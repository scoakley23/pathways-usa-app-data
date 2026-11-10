import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
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
import { Button as PwButton, Card, Chip, CreamSheet, Eyebrow, NavyTop, Poster, posterSolid, posterOutline } from '@/components/pathways/ui';
import { LEVELS } from '@/lib/pretest';
import { PRACTICE_PARTS, partStatus, suggestPart } from '@/lib/studyView';
import { cardOutcome, countOutcomes } from '@/lib/practiceResults';
import { awardBadges } from '@/lib/awardBadges';
import { toast } from "sonner";
import VoiceSettings from '@/components/utils/VoiceSettings';

// Practice hub (the Practice tab of Study): on navy, "Suggested for you"
// (the part with the lowest quick-check level) with a star-red Start; on the
// cream sheet, the four parts as rows in the order Reading · Writing · Civics
// · Speaking with their status (quick-check level; "Ready" when strong).
// Tapping one starts right away; a run is full screen
// (?mode=… hides the app header and tab bar, see Layout).
const RUN_MODES = ['reading', 'dictation', 'civics', 'interview', 'vocabulary'];
const RUN_LABEL = {
  reading: 'Reading · Read aloud',
  dictation: 'Writing · Listen and write',
  vocabulary: 'Writing · Vocabulary',
  civics: 'Civics questions',
  interview: 'Speaking · The officer’s questions',
};

// The four parts as rows: name, one line, icon, and the run each starts.
const PART_ROWS = {
  reading: { label: 'Reading', line: 'Read a sentence aloud', icon: BookOpen, run: 'reading' },
  writing: { label: 'Writing', line: 'Listen and write', icon: PenLine, run: 'dictation' },
  civics: { label: 'Civics', line: 'Answer out loud or type', icon: Landmark, run: 'civics' },
  speaking: { label: 'Speaking', line: 'Mock interview', icon: MessagesSquare, run: 'interview' },
};

export default function Practice() {
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
        const user = await base44.auth.me();
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
      const existing = await base44.entities.ReadingSentence.list();
      if (existing.length === 0) {
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
         await base44.entities.ReadingSentence.bulkCreate(sentences);
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
  if (mode === 'interview') {
    return (
      <RunShell label={RUN_LABEL.interview} onClose={exitRun}>
        <InterviewPractice
          onComplete={(passed) => {
            if (passed) {
              toast.success('Great job! You\'re ready for the interview!');
            } else {
              toast.info('Keep practicing - you\'re getting better!');
            }
            exitRun();
          }}
          onNext={() => {}}
        />
      </RunShell>
    );
  }

  const getSRSContent = async (items, type, options = {}) => {
    if (!currentUser) return items.sort(() => 0.5 - Math.random()).slice(0, 10);
    
    try {
      const progress = await base44.entities.UserProgress.filter({
        user_email: currentUser.email, content_type: type
      });
      
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
         data = await base44.entities.ReadingSentence.list();
         // Reading doesn't use strict SRS yet, simple shuffle
         data = data.sort(() => 0.5 - Math.random()).slice(0, 10);
      } else if (selectedMode === 'dictation') {
        const allSentences = await base44.entities.Sentence.list();
        data = await getSRSContent(allSentences, 'sentence');
      } else if (selectedMode === 'vocabulary') {
        const allVocab = await base44.entities.VocabularyWord.list();
        const transformed = allVocab.map(v => ({ ...v, text: v.word, type: 'vocabulary' }));
        data = await getSRSContent(transformed, 'vocabulary');
      } else if (selectedMode === 'civics') {
        let allQuestions = await base44.entities.CivicsQuestion.list();
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
      toast.error("Failed to start practice session");
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
          const existing = await base44.entities.UserProgress.filter(
              { user_email: currentUser.email, content_id: currentItem.id }, null, 1
          );
          
          const prevProgress = existing[0] || { 
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
          if (existing.length > 0) {
              await base44.entities.UserProgress.update(existing[0].id, progressData);
          } else {
              await base44.entities.UserProgress.create(progressData);
          }

          // Gamification
          if (isSuccess) {
             pointsRef.current += 10;
             await base44.auth.updateMe({ points: pointsRef.current });
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
    const label = 'text-sm font-semibold text-ink';
    const levels = currentUser?.skill_levels || null;
    const startPart = (part) => {
      const run = PART_ROWS[part].run;
      if (run === 'interview') { setSearchParams(practiceParams('interview')); setMode('interview'); }
      else startSession(run);
    };
    const suggested = suggestPart(levels);
    const testButton = (
      <Chip onNavy onClick={() => setSettingsOpen(true)} aria-label={`Practice settings: ${civicsVersion} test`}>
        <SlidersHorizontal className="w-4 h-4" aria-hidden="true" /> {civicsVersion} test
      </Chip>
    );
    return (
      <div>
        <NavyTop className="pb-14">
          <StudyTop tab="practice" action={testButton}>
            <div className="pt-2 space-y-3">
              <p className="text-label uppercase text-on-navy-label">Suggested for you</p>
              <p className="font-display text-[22px] leading-tight">
                {PART_ROWS[suggested].label} · {PART_ROWS[suggested].line}
              </p>
              <PwButton variant="main" onNavy className="w-full sm:w-auto" onClick={() => startPart(suggested)}>
                Start <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
              </PwButton>
            </div>
          </StudyTop>
        </NavyTop>

        <CreamSheet>
          <div className="mx-auto max-w-5xl space-y-6 pb-8">
            <p className="text-base text-ink-2">Pick a part and we start right away. Ten cards, about five minutes.</p>

            {/* The four parts */}
            <Card padding="p-0">
              <ul className="divide-y divide-card-line">
                {PRACTICE_PARTS.map((part) => {
                  const row = PART_ROWS[part];
                  const Icon = row.icon;
                  const status = partStatus(levels?.[part]);
                  return (
                    <li key={part}>
                      <button
                        type="button"
                        onClick={() => startPart(part)}
                        className="w-full flex items-center gap-4 px-4 py-4 min-h-[76px] text-start hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy first:rounded-t-card last:rounded-b-card"
                      >
                        <span className="w-12 h-12 shrink-0 rounded-full bg-navy text-white grid place-items-center">
                          <Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[17px] font-semibold text-ink">{row.label}</span>
                          <span className="block text-base text-ink-2">{row.line}</span>
                        </span>
                        <span className="shrink-0 text-end text-sm">
                          {status === 'ready' ? (
                            <span className="inline-flex items-center gap-1 font-semibold text-correct">
                              <Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /> Ready
                            </span>
                          ) : (
                            <span className="text-ink-2">{status === 'not_checked' ? 'Not checked yet' : LEVELS[status].label}</span>
                          )}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>

            {/* Vocabulary games (part of Writing) */}
            <section aria-labelledby="vocab" className="space-y-2">
              <h2 id="vocab" className="text-label uppercase text-ink-label">Writing · Vocabulary games</h2>
              <div className="flex flex-wrap gap-2">
                <Chip onClick={() => startSession('vocabulary', 'dictation')}><Mic className="w-4 h-4" aria-hidden="true" /> Word dictation</Chip>
                <Chip onClick={() => startSession('vocabulary', 'flashcards')}><Sparkles className="w-4 h-4" aria-hidden="true" /> Flashcards</Chip>
                <Chip onClick={() => startSession('vocabulary', 'matching')}><Layers className="w-4 h-4" aria-hidden="true" /> Matching</Chip>
              </div>
            </section>

            {/* Mixed practice: the full run-through on Interview Day */}
            <Card padding="p-5" className="space-y-2">
              <Eyebrow>Mixed practice</Eyebrow>
              <h2 className="font-display text-[22px] leading-tight text-ink">Interview Day</h2>
              <p className="text-base text-ink-2 max-w-2xl">The whole interview, in order: the oath, the officer’s questions, reading, writing and civics. Nothing is saved.</p>
              <Link
                to="/interview-day"
                className="mt-2 inline-flex min-h-tap items-center gap-2 rounded-full border-2 border-navy px-5 text-base font-semibold text-ink hover:bg-sand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
              >
                Start the run-through <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </Card>
          </div>
        </CreamSheet>

        {/* Settings: civics test version, difficulty, voice */}
        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetContent side="bottom" className="bg-pw-page max-h-[90vh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="font-display font-normal text-[30px] text-pw-navy text-left">Practice settings</SheetTitle>
            </SheetHeader>
            <div className="mx-auto max-w-lg space-y-5 py-4 text-pw-navy">
              <div className="space-y-2">
                <label className={label} htmlFor="civics-version">Civics test version</label>
                <Select value={civicsVersion} onValueChange={(v) => { setCivicsVersion(v); try { localStorage.setItem('civicsVersion', v); } catch (e) { /* storage blocked */ } }}>
                  <SelectTrigger id="civics-version" className="h-auto min-h-11 text-left bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2008">Applied before Oct 20, 2025? Choose 2008.</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-pw-muted leading-snug">
                  {civicsVersion === '2025'
                    ? 'The officer asks up to 20 questions from this list of 128. You pass with 12 correct.'
                    : 'The officer asks up to 10 questions from this list of 100. You pass with 6 correct.'}
                </p>
                <a href="https://www.uscis.gov/citizenship/2025-test" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-pw-navy underline underline-offset-4 inline-block min-h-[44px] py-2">
                  Not sure which test you'll take? Check uscis.gov.
                </a>
              </div>
              <div className="space-y-2">
                <label className={label} htmlFor="civics-difficulty">Civics difficulty</label>
                <Select value={civicsDifficulty} onValueChange={setCivicsDifficulty}>
                  <SelectTrigger id="civics-difficulty" className="min-h-11 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <p className={label}>Voice</p>
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
  if (mode === 'civics' && sessionComplete) {
    return (
      <RoundComplete
        items={content}
        results={results}
        version={civicsVersion}
        name={firstName(currentUser)}
        onClose={exitRun}
        onReview={startReview}
        onAgain={() => startSession('civics')}
        onBack={() => navigate('/')}
      />
    );
  }
  if (mode === 'civics' && !isLoading && content.length > 0) {
    return (
      <CivicsTestCard
        index={currentIndex}
        total={content.length}
        question={content[currentIndex]}
        onComplete={handleComplete}
        onNext={handleNext}
        onClose={exitRun}
      />
    );
  }

  if (sessionComplete) {
    const counts = countOutcomes(results);
    // Matching plays up to six pairs, not every card in the run.
    const total = mode === 'vocabulary' && vocabSubMode === 'matching' ? results.length : content.length;
    return (
      <RunShell label={RUN_LABEL[mode]} onClose={exitRun}>
        <Poster
          tone="blue"
          className="-mx-4 sm:mx-0 sm:rounded-card"
          label="Practice · Done"
          question={`${counts.right} of ${total} right`}
          answer={counts.close ? `${counts.close} almost. One more look and you have them.` : 'Nice work.'}
        >
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => startSession(mode, vocabSubMode)} className={posterSolid}>Practice again</button>
              <button type="button" onClick={exitRun} className={posterOutline}>Back to Practice</button>
            </div>
          </div>
        </Poster>
      </RunShell>
    );
  }

  return (
    <RunShell label={RUN_LABEL[mode]} onClose={exitRun}>

      {isLoading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-pw-navy" />
        </div>
      ) : content.length > 0 ? (
         mode === 'reading' ? (
            <ReadingPracticeCard 
                index={currentIndex}
                total={content.length}
                sentence={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
                results={results}
            />
         ) : mode === 'vocabulary' ? (
            vocabSubMode === 'flashcards' ? (
              <FlashcardGame 
                words={content} 
                index={currentIndex}
                total={content.length}
                results={results}
                onComplete={(isSuccess) => {
                  handleComplete(isSuccess);
                  handleNext();
                }}
              />
            ) : vocabSubMode === 'matching' ? (
              <MatchingGame 
                words={content}
                onComplete={(pairs) => {
                  // Every pair ends matched; nothing is saved for this game.
                  setResults(Array(pairs).fill('right'));
                  setSessionComplete(true);
                }}
              />
            ) : (
              // Default to Dictation for vocabulary
              <DictationCard 
                  index={currentIndex}
                  total={content.length}
                  sentence={content[currentIndex]}
                  onComplete={handleComplete}
                  onNext={handleNext}
                  results={results}
              />
            )
         ) : (
            // Dictation (Sentences)
            <DictationCard 
                index={currentIndex}
                total={content.length}
                sentence={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
                results={results}
            />
         )
      ) : (
         <div className="text-center py-20">
            <p className="text-lg text-pw-muted">No content found for this mode.</p>
            <Button onClick={exitRun} className="mt-4">Go Back</Button>
         </div>
         )}
    </RunShell>
  );
         }

// A practice run, full screen: a close button and what is being practiced,
// then the cards (each poster carries its own stars).
// The other runs (reading, writing, vocabulary, interview) keep the padded
// layout until their redesign; Layout gives /study the full width.
function RunShell({ label, onClose, children }) {
  return (
    <div className="container max-w-2xl mx-auto px-4 pt-6 space-y-4 pb-8">
      <div className="flex items-center gap-3 -mt-2">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close practice"
          className="w-11 h-11 shrink-0 rounded-full bg-white border border-pw-line grid place-items-center text-pw-navy hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-pw-muted">{label}</p>
      </div>
      {children}
    </div>
  );
}
