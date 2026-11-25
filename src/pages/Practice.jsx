import React, { useState, useEffect } from 'react';
import { progress as progressApi } from '@/api/progress';
import { review } from '@/api/review';
import { pickForPractice } from '@/lib/practicePicking';
import { content as contentApi } from '@/api/content';
import { auth } from '@/api/auth';
import { ArrowRight, BookOpen, Check, Landmark, Loader2, Sparkles, Layers, Mic, MessagesSquare, PenLine, SlidersHorizontal, X } from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DictationCard from '@/components/game/DictationCard';
import CivicsTestCard from '@/components/practice/CivicsTestCard';
import RoundComplete from '@/components/practice/RoundComplete';
import { firstName } from '@/lib/todayView';
import FlashcardGame from '@/components/practice/FlashcardGame';
import MatchingGame from '@/components/practice/MatchingGame';
import ReadingPracticeCard from '@/components/practice/ReadingPracticeCard';
import InterviewPractice from '@/components/practice/InterviewPractice';
import StudyTop from '@/components/study/StudyTop';
import { Button as PwButton, Card, Chip } from '@/components/pathways/ui';
import { AmioSays } from '@/components/pathways/Amio';
import usePracticeText from '@/components/practice/usePracticeText';
import { PRACTICE_PARTS, partStatus, suggestPart } from '@/lib/studyView';
import { cardOutcome, countOutcomes, countedOutcomes, missedItems, passRule } from '@/lib/practiceResults';
import { awardBadges } from '@/lib/awardBadges';
import { toast } from "sonner";
import VoiceSettings from '@/components/utils/VoiceSettings';

// Practice home (the Practice tab of Study, Amio v2): on paper, the Study
// title and tabs, Amio's line, "Suggested for you" (the part with the lowest
// quick-check level) on a navy card with the gold Start, the four parts as
// tiles in their colours (Reading denim · Writing gold · Civics sky ·
// Speaking white) with their status (quick-check level; "Ready" when strong),
// the vocabulary games and "The whole day". Tapping a part starts right away;
// a run is full screen (?mode=… hides the app header and tab bar, see
// Layout). Wording in practiceStrings.js (usePracticeText).
const RUN_MODES = ['reading', 'dictation', 'civics', 'interview', 'vocabulary'];
// The four parts: icon, the run each starts, and its tile colours.
const PART_ROWS = {
  reading: { icon: BookOpen, run: 'reading', look: 'bg-denim text-white border-denim', sub: 'text-white' },
  writing: { icon: PenLine, run: 'dictation', look: 'bg-gold text-navy border-gold', sub: 'text-navy' },
  civics: { icon: Landmark, run: 'civics', look: 'bg-sky text-navy border-sky', sub: 'text-navy' },
  speaking: { icon: MessagesSquare, run: 'interview', look: 'bg-white text-navy border-line', sub: 'text-muted' },
};

export default function Practice() {
  const { t, rtl } = usePracticeText();
  const [mode, setMode] = useState('menu'); // menu, dictation, vocabulary, civics
  const [vocabSubMode, setVocabSubMode] = useState('dictation'); // dictation, flashcards, matching
  const [civicsVersion, setCivicsVersion] = useState(() => localStorage.getItem('civicsVersion') || '2025');
  const [civicsDifficulty, setCivicsDifficulty] = useState('all'); // all, easy, medium, hard
  const [content, setContent] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const hasMounted = React.useRef(false);
  const [results, setResults] = useState([]); // stars: one outcome per card
  // Points add up across a run (the user record is only read on load), and
  // the badge check waits for the run's last save.
  const pointsRef = React.useRef(0);
  const savesRef = React.useRef(Promise.resolve());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const urlMode = searchParams.get('mode');
  // Practice lives in the Study page's Practice tab (/study?tab=practice);
  // a run adds ?mode=… there. Keep the tab when a run starts or ends.
  const practiceParams = (runMode) => (runMode ? { tab: 'practice', mode: runMode } : { tab: 'practice' });

  // A run lives in the URL (?mode=…) so it is full screen and the browser's
  // Back closes it. Leaving the run clears the param.
  const exitRun = () => {
    setMode('menu');
    setResults([]);
    setSearchParams(practiceParams(), { replace: false });
  };
  useEffect(() => {
    if (!urlMode && mode !== 'menu') {
      setMode('menu');
      setResults([]);
    }
  }, [urlMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadUser = async () => {
      try {
        const user = await auth.me();
        if (user) {
          const normalizedEmail = user.email.toLowerCase().trim();
          const normalizedUser = { ...user, email: normalizedEmail };
          setCurrentUser(normalizedUser);
          pointsRef.current = user.points || 0;
        }
      } catch (e) {
        console.error("Error loading user data:", e);
      }
  };

  // Load the signed-in learner
  useEffect(() => {
    loadUser();
  }, []);

  // Refresh when returning to menu (skip on initial mount to avoid double-fetch)
  useEffect(() => {
      if (hasMounted.current && mode === 'menu') {
          loadUser();
      }
      hasMounted.current = true;
  }, [mode]);

  // Open a specific practice mode when arriving via ?mode= (the roadmap's
  // Speak stop, or a task on the Today card). Sessions that load content wait
  // for the signed-in user so progress ordering works.
  const startedFromUrl = React.useRef(false);
  useEffect(() => {
    if (startedFromUrl.current || !urlMode) return;
    if (urlMode === 'interview') {
      startedFromUrl.current = true;
      setMode('interview');
    } else if (['reading', 'dictation', 'civics'].includes(urlMode) && currentUser) {
      startedFromUrl.current = true;
      startSession(urlMode);
    } else if (!RUN_MODES.includes(urlMode) || urlMode === 'vocabulary') {
      // Not something a link can start (or a reload mid-vocabulary): back to the hub.
      setSearchParams(practiceParams(), { replace: true });
    }
  }, [currentUser]); // eslint-disable-line react-hooks/exhaustive-deps

  // Seed Reading Data if empty
  useEffect(() => {
    const seedData = async () => {
      try {
      {
         const sentences = [
            { text: "Who was George Washington?", difficulty: "easy" },
            { text: "What is the capital of the United States?", difficulty: "easy" },
            { text: "When is Flag Day?", difficulty: "medium" },
            { text: "Who elects Congress?", difficulty: "hard" },
            { text: "Lincoln was the President during the Civil War.", difficulty: "medium" },
            { text: "What do we pay to the government?", difficulty: "medium" },
            { text: "Who lives in the White House?", difficulty: "easy" },
            { text: "When is Columbus Day?", difficulty: "easy" },
            { text: "Where does Congress meet?", difficulty: "medium" },
            { text: "Who was the first President?", difficulty: "easy" },
            { text: "Why do people come to America?", difficulty: "medium" },
            { text: "What are the colors of the American flag?", difficulty: "easy" },
            { text: "When is Labor Day?", difficulty: "easy" },
            { text: "How many Senators do we have?", difficulty: "hard" },
            { text: "When is Presidents' Day?", difficulty: "easy" },
            { text: "What is the Bill of Rights?", difficulty: "hard" },
            { text: "Who is the Father of Our Country?", difficulty: "medium" },
            { text: "What is the largest city in America?", difficulty: "medium" },
            { text: "When is Independence Day?", difficulty: "easy" },
            { text: "What was the first capital of the United States?", difficulty: "hard" }
         ];
         // Base44 only; on Supabase the content is already loaded.
         await contentApi.seedReadingSentencesIfEmpty(sentences);
      }
      } catch (err) {
        console.error("Seeding skipped:", err);
      }
    };
    seedData();
  }, []);

  // When a run ends, check badges once its saves are done. Full Marks counts
  // only runs whose answers are checked (not flashcards or matching).
  useEffect(() => {
    if (!sessionComplete || !currentUser) return;
    const checked = mode !== 'vocabulary' || vocabSubMode === 'dictation';
    const run = checked ? Array.from({ length: content.length }, (_, i) => results[i]) : null;
    savesRef.current.then(() => awardBadges({ run }));
  }, [sessionComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Interview Practice Mode
  // The mock interview (The Road): full width, its own top bar; it ends on
  // the Round complete report (the run stays open until the learner closes
  // it, so the report can be read).
  if (mode === 'interview') {
    return (
      <InterviewPractice
        onComplete={(passed) => {
          if (passed) {
            toast.success('Great job! You\'re ready for the interview!');
          } else {
            toast.info('Keep practicing - you\'re getting better!');
          }
        }}
        onNext={() => {}}
        onClose={exitRun}
        onBack={() => navigate('/')}
        learnerName={firstName(currentUser)}
      />
    );
  }

  const getSRSContent = async (items, type, options = {}) => {
    if (!currentUser) return items.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    try {
      const progress = await progressApi.list({ contentType: type });

      // Supabase (the switch on): Prompt 4's one review schedule; the old
      // review fields are gone (src/lib/practicePicking.js).
      if (review.usesBoxes) {
        const reviewItems = type === 'civics_question' ? await review.items() : [];
        return pickForPractice(items, progress, reviewItems, { civics: type === 'civics_question' });
      }
      
      const progressMap = new Map(progress.map(p => [p.content_id, p]));
      
      // 1. Calculate Category Weakness
      const categoryStats = {};
      progress.forEach(p => {
          // Find corresponding item to get category
          const item = items.find(i => i.id === p.content_id);
          if (item && item.category) {
             if (!categoryStats[item.category]) categoryStats[item.category] = { total: 0, incorrect: 0 };
             categoryStats[item.category].total++;
             if (p.last_result === 'incorrect' || p.status === 'practicing') {
                 categoryStats[item.category].incorrect++;
             }
          }
      });

      const weakCategories = Object.keys(categoryStats).filter(cat => {
          const stats = categoryStats[cat];
          return stats.total > 0 && (stats.incorrect / stats.total) > 0.4; // >40% incorrect/practicing
      });

      // 2. Calculate Priority Score (Modified SM-2 + Adaptive Boost)
      const scoredItems = items.map(item => {
        const p = progressMap.get(item.id);
        let score = 100; // Base score for new/unseen items
        
        // Adaptive Learning: Boost score if in a weak category
        if (item.category && weakCategories.includes(item.category)) {
            score += 300; 
        }

        if (p) {
          const now = new Date().getTime();
          const lastPracticed = new Date(p.last_practiced).getTime();
          const daysSince = (now - lastPracticed) / (1000 * 60 * 60 * 24);
          
          const interval = p.interval || 0;
          
          // SRS Logic: Priority is higher when we are past the due date (interval)
          // Score = (Days Since / Interval) * 100. 
          // If Interval is 0 (just started/failed), prioritize heavily.
          
          if (interval === 0) {
             score += 500; // Immediate retry priority
          } else {
             const dueRatio = daysSince / interval;
             score += dueRatio * 100;
          }

          // If mastered and interval is long, push it down unless it's due
          if (p.status === 'mastered' && interval > 20 && daysSince < interval) {
              score -= 500;
          }
        } else {
           // Slightly randomize unseen items so we don't always see them in same order
           score += Math.random() * 50; 
        }
        
        return { ...item, score };
      });
      
      // Sort descending by score
      const sorted = scoredItems.sort((a, b) => b.score - a.score);
      
      // Log adaptive behavior
      if (weakCategories.length > 0) {
          console.log("Adaptive Learning Active: Focusing on weak categories:", weakCategories);
          toast.info(`Adaptive Mode: Focusing on ${weakCategories.join(', ')}`);
      }

      return sorted.slice(0, 10);
    } catch (e) {
      console.error("SRS calculation failed", e);
      return items.sort(() => 0.5 - Math.random()).slice(0, 10);
    }
  };

  const startSession = async (selectedMode, subMode = null) => {
    startedFromUrl.current = true;
    if (urlMode !== selectedMode) setSearchParams(practiceParams(selectedMode));
    setResults([]);
    setIsLoading(true);
    setMode(selectedMode);
    if (subMode) setVocabSubMode(subMode);
    setCurrentIndex(0);
    setSessionComplete(false);
    
    try {
      let data = [];
      if (selectedMode === 'reading') {
         data = await contentApi.readingSentences();
         // Reading doesn't use strict SRS yet, simple shuffle
         data = data.sort(() => 0.5 - Math.random()).slice(0, 10);
      } else if (selectedMode === 'dictation') {
        const allSentences = await contentApi.writingSentences();
        data = await getSRSContent(allSentences, 'sentence');
      } else if (selectedMode === 'vocabulary') {
        const allVocab = await contentApi.vocabularyWords();
        const transformed = allVocab.map(v => ({ ...v, text: v.word, type: 'vocabulary' }));
        data = await getSRSContent(transformed, 'vocabulary');
      } else if (selectedMode === 'civics') {
        let allQuestions = await contentApi.civicsQuestions();
        allQuestions = allQuestions.filter(q => q.version === civicsVersion);
        
        // Adaptive Difficulty Handling
        if (civicsDifficulty !== 'all') {
          allQuestions = allQuestions.filter(q => q.difficulty === civicsDifficulty);
          // Simple shuffle if filtering manually
          data = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);
        } else {
           // Use SRS + Adaptive Logic for 'All' difficulty
           data = await getSRSContent(allQuestions, 'civics_question');
        }
      }
      
      setContent(data);
    } catch (error) {
      console.error("Error starting session", error);
      toast.error(t('start_failed'));
      exitRun();
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (isSuccess, score = null) => {
    const save = saveCard(isSuccess, score);
    savesRef.current = savesRef.current.then(() => save);
    return save;
  };

  const saveCard = async (isSuccess, score = null) => {
    const currentItem = content[currentIndex];
    const at = currentIndex;
    setResults((prev) => { const next = [...prev]; next[at] = cardOutcome(isSuccess, score); return next; });
    
    if (currentUser) {
       try {
          // 1. Fetch existing progress to implement SRS math
          const found = await progressApi.get(currentItem.id);
          
          const prevProgress = found || { 
              ease_factor: 2.5, 
              interval: 0, 
              consecutive_correct: 0 
          };

          // 2. Calculate new SRS values (Simplified SM-2)
          let newEaseFactor = prevProgress.ease_factor;
          let newInterval = prevProgress.interval;
          let newConsecutive = prevProgress.consecutive_correct;

          if (isSuccess) {
              newConsecutive += 1;
              // SM-2 Algorithm: Graduated intervals
              if (newConsecutive === 1) {
                  newInterval = 1; // Review tomorrow
              } else if (newConsecutive === 2) {
                  newInterval = 6; // Review in 6 days
              } else {
                  // Exponential growth based on ease factor
                  newInterval = Math.round(prevProgress.interval * prevProgress.ease_factor);
              }
              // Reward consecutive successes with easier future reviews
              if (newConsecutive >= 2) {
                  newEaseFactor = Math.min(2.5, newEaseFactor + 0.1);
              }
          } else {
              newConsecutive = 0;
              newInterval = 0; // Reset - immediate relearning
              // Penalize ease factor on errors (minimum 1.3)
              newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
          }

          const progressData = {
            user_email: currentUser.email,
            content_id: currentItem.id,
            content_type: mode === 'civics' ? 'civics_question' : (mode === 'vocabulary' ? 'vocabulary' : 'sentence'),
            status: (isSuccess && newConsecutive >= 3) ? 'mastered' : 'practicing',
            last_practiced: new Date().toISOString(),
            ease_factor: newEaseFactor,
            interval: newInterval,
            consecutive_correct: newConsecutive,
            last_result: isSuccess ? 'correct' : 'incorrect',
            best_score: Math.max(prevProgress.best_score || 0, score || 0),
            last_score: score || 0,
            total_attempts: (prevProgress.total_attempts || 0) + 1
          };

          // Update or Create
          await progressApi.save(found, progressData);
          // Supabase: a civics answer also moves the question's review box.
          if (mode === 'civics') await review.afterPractice(currentItem.id, isSuccess);

          // Gamification
          if (isSuccess) {
             pointsRef.current += 10;
             await auth.updateMe({ points: pointsRef.current });
          }
       } catch (e) {
         console.error("Save progress failed", e);
       }
    }
  };

  const handleNext = () => {
    if (currentIndex + 1 < content.length) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
    }
  };

  if (mode === 'menu') {
    const label = 'text-base font-semibold text-navy';
    const levels = currentUser?.skill_levels || null;
    const startPart = (part) => {
      const run = PART_ROWS[part].run;
      if (run === 'interview') { setSearchParams(practiceParams('interview')); setMode('interview'); }
      else startSession(run);
    };
    const suggested = suggestPart(levels);
    const statusText = (part) => {
      const st = partStatus(levels?.[part]);
      return st === 'ready' ? null : st === 'not_checked' ? t('not_checked') : t(`level_${st}`);
    };
    const testButton = (
      <Chip onClick={() => setSettingsOpen(true)} aria-label={t('settings_label', { version: civicsVersion })}>
        <SlidersHorizontal className="w-4 h-4" aria-hidden="true" /> {t('test_button', { version: civicsVersion })}
      </Chip>
    );
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
        <div className="mx-auto max-w-lg px-4 pt-6 pb-8 flex flex-col gap-5">
          <StudyTop tab="practice" action={testButton} />
          <AmioSays mood="hello" size={56}>{t('amio_practice')}</AmioSays>

          {/* Suggested for you */}
          <section aria-labelledby="practice-suggested" className="rounded-card bg-navy text-white p-5 flex flex-col gap-3">
            <p id="practice-suggested" className="text-base font-semibold text-sky" dir="auto">{t('suggested')}</p>
            <p className="font-display text-[1.75rem] leading-tight" dir="auto"><bdi>{t(`part_${suggested}`)}</bdi> · <bdi>{t(`line_${suggested}`)}</bdi></p>
            <PwButton variant="main" onNavy className="w-full" onClick={() => startPart(suggested)}>
              {t('start')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
            </PwButton>
          </section>

          {/* The four parts, as tiles in their colours */}
          <ul className="grid grid-cols-2 gap-2 list-none m-0 p-0">
            {PRACTICE_PARTS.map((part) => {
              const row = PART_ROWS[part];
              const Icon = row.icon;
              const st = statusText(part);
              return (
                <li key={part}>
                  <button
                    type="button"
                    onClick={() => startPart(part)}
                    className={`w-full h-full min-h-[8.5rem] rounded-card border-[2.5px] p-4 flex flex-col justify-between gap-3 text-start hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${row.look}`}
                  >
                    <Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
                    <span>
                      <span className="block text-lg font-bold" dir="auto">{t(`part_${part}`)}</span>
                      <span className={`block text-base ${row.sub}`} dir="auto">{t(`line_${part}`)}</span>
                      <span className={`mt-1 flex items-center gap-1 text-base font-semibold ${row.sub}`} dir="auto">
                        {st === null ? <><Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> {t('ready')}</> : st}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Vocabulary games (part of Writing) */}
          <section aria-labelledby="vocab" className="flex flex-col gap-2">
            <h2 id="vocab" className="text-lg font-bold" dir="auto">{t('vocab_title')}</h2>
            <div className="flex flex-wrap gap-2">
              <Chip onClick={() => startSession('vocabulary', 'dictation')}><Mic className="w-4 h-4" aria-hidden="true" /> {t('word_dictation')}</Chip>
              <Chip onClick={() => startSession('vocabulary', 'flashcards')}><Sparkles className="w-4 h-4" aria-hidden="true" /> {t('flashcards')}</Chip>
              <Chip onClick={() => startSession('vocabulary', 'matching')}><Layers className="w-4 h-4" aria-hidden="true" /> {t('matching')}</Chip>
            </div>
          </section>

          {/* The whole day: the full practice call on Interview Day */}
          <Card padding="p-5" className="flex flex-col gap-2">
            <h2 className="text-lg font-bold" dir="auto">{t('whole_day')}</h2>
            <p className="text-base text-muted" dir="auto">{t('whole_day_body')}</p>
            <Link
              to="/interview-day"
              className="mt-1 self-start min-h-tap inline-flex items-center gap-2 px-1 text-base font-semibold text-denim underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
            >
              {t('see_the_day')} <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </Card>
        </div>

        {/* Settings: civics test version, difficulty, voice */}
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent side="bottom" dir={rtl ? 'rtl' : 'ltr'} className="rounded-t-sheet bg-paper max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="pe-10 font-display text-[1.75rem] text-navy text-start" dir="auto">{t('settings_title')}</SheetTitle>
            </SheetHeader>
            <div className="mx-auto max-w-lg space-y-5 py-4 text-navy">
              <div className="space-y-2">
                <label className={label} htmlFor="civics-version" dir="auto">{t('civics_version')}</label>
                <Select value={civicsVersion} onValueChange={(v) => { setCivicsVersion(v); try { localStorage.setItem('civicsVersion', v); } catch (e) { /* storage blocked */ } }}>
                  <SelectTrigger id="civics-version" className="h-auto min-h-11 text-start bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2008">{t('v2008_choice')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-base text-muted leading-snug" dir="auto">{civicsVersion === '2025' ? t('rule_2025') : t('rule_2008')}</p>
                <a href="https://www.uscis.gov/citizenship/2025-test" target="_blank" rel="noopener noreferrer" className="text-base font-semibold text-navy underline underline-offset-4 inline-block min-h-[44px] py-2" dir="auto">
                  {t('which_test')}
                </a>
              </div>
              <div className="space-y-2">
                <label className={label} htmlFor="civics-difficulty" dir="auto">{t('difficulty')}</label>
                <Select value={civicsDifficulty} onValueChange={setCivicsDifficulty}>
                  <SelectTrigger id="civics-difficulty" className="min-h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('diff_all')}</SelectItem>
                    <SelectItem value="easy">{t('diff_easy')}</SelectItem>
                    <SelectItem value="medium">{t('diff_medium')}</SelectItem>
                    <SelectItem value="hard">{t('diff_hard')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className={label} dir="auto">{t('voice')}</p>
                <VoiceSettings />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // A civics round (The Road): the question screen and "Round complete" are
  // full width (navy top, cream sheet) with their own close button.
  // "Review" starts a round with only the questions that were missed (same
  // grading and saving).
  const startReview = (items) => {
    setResults([]);
    setContent(items);
    setCurrentIndex(0);
    setSessionComplete(false);
  };
  // Every run ends on "Round complete": civics, reading, writing and the
  // vocabulary games (word dictation, flashcards, matching).
  const roundKind = mode === 'civics' ? 'civics'
    : mode === 'reading' ? 'reading'
      : mode === 'dictation' ? 'writing'
        : mode === 'vocabulary' ? (vocabSubMode === 'flashcards' ? 'flashcards' : vocabSubMode === 'matching' ? 'matching' : 'words')
          : null;
  if (roundKind === 'matching' && sessionComplete) {
    // Matching saves nothing; every pair ends matched.
    return (
      <RoundComplete
        outcomes={results}
        title={firstName(currentUser) ? t('all_matched_name', { n: results.length, name: firstName(currentUser) }) : t('all_matched', { n: results.length })}
        onClose={exitRun}
        onAgain={() => startSession(mode, vocabSubMode)}
        onBack={() => navigate('/')}
      />
    );
  }
  if (roundKind && sessionComplete) {
    const missed = missedItems(content, results);
    const right = countOutcomes(results).right;
    const name = firstName(currentUser);
    const title = right > 0
      ? (name ? t('round_right_name', { n: right, name }) : t('round_right', { n: right }))
      : (name ? t('round_zero_name', { name }) : t('round_zero'));
    const rule = roundKind === 'reading' ? t('rule_reading')
      : roundKind === 'writing' ? t('rule_writing')
        : roundKind === 'civics' ? t('rule_civics', passRule(civicsVersion))
          : null;
    return (
      <RoundComplete
        outcomes={countedOutcomes(content, results)}
        title={title}
        rule={rule}
        review={{
          heading: t('to_review'),
          lines: missed.map((item) => item.question || item.text || item.word),
          button: t('review_button'),
        }}
        onClose={exitRun}
        onReview={() => startReview(missed)}
        onAgain={() => startSession(mode, vocabSubMode)}
        onBack={() => navigate('/')}
      />
    );
  }
  // The cards themselves (The Road): full width, each with its own top bar.
  if (roundKind && !isLoading && content.length > 0) {
    const cardProps = {
      index: currentIndex,
      total: content.length,
      onComplete: handleComplete,
      onNext: handleNext,
      onClose: exitRun,
    };
    if (roundKind === 'civics') return <CivicsTestCard {...cardProps} question={content[currentIndex]} />;
    if (roundKind === 'reading') return <ReadingPracticeCard {...cardProps} sentence={content[currentIndex]} />;
    if (roundKind === 'flashcards') {
      return (
        <FlashcardGame
          words={content}
          index={currentIndex}
          total={content.length}
          onClose={exitRun}
          onComplete={(isSuccess) => { handleComplete(isSuccess); handleNext(); }}
        />
      );
    }
    if (roundKind === 'matching') {
      return (
        <MatchingGame
          words={content}
          onClose={exitRun}
          onComplete={(pairs) => {
            // Every pair ends matched; nothing is saved for this game.
            setResults(Array(pairs).fill('right'));
            setSessionComplete(true);
          }}
        />
      );
    }
    return <DictationCard {...cardProps} sentence={content[currentIndex]} />;
  }

  return (
    <RunShell label={t(`run_${mode}`)} closeLabel={t('close')} onClose={exitRun}>

      {isLoading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-navy" />
        </div>
      ) : (
         <div className="text-center py-20">
            <p className="text-lg text-muted" dir="auto">{t('no_content')}</p>
            <PwButton variant="second" onClick={exitRun} className="mt-4">{t('go_back')}</PwButton>
         </div>
         )}
    </RunShell>
  );
         }

// A practice run, full screen: a close button and what is being practiced,
// then the cards (each poster carries its own stars).
// The other runs (reading, writing, vocabulary, interview) keep the padded
// layout until their redesign; Layout gives /study the full width.
function RunShell({ label, closeLabel, onClose, children }) {
  return (
    <div className="container max-w-2xl mx-auto px-4 pt-6 space-y-4 pb-8">
      <div className="flex items-center gap-3 -mt-2">
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className="w-11 h-11 shrink-0 rounded-full bg-white border border-line grid place-items-center text-navy hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <p className="text-[0.8125rem] font-semibold text-muted">{label}</p>
      </div>
      {children}
    </div>
  );
}
