import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { ArrowRight, Clock, Loader2, Sparkles, Layers, Mic, SlidersHorizontal, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import DictationCard from '@/components/game/DictationCard';
import CivicsTestCard from '@/components/practice/CivicsTestCard';
import FlashcardGame from '@/components/practice/FlashcardGame';
import MatchingGame from '@/components/practice/MatchingGame';
import ReadingPracticeCard from '@/components/practice/ReadingPracticeCard';
import InterviewPractice from '@/components/practice/InterviewPractice';
import PageHeader from '@/components/PageHeader';
import { PillButton, Poster, PosterStars, SKILL_COLOR, SKILL_ON, posterSolid, posterOutline } from '@/components/pathways/ui';
import { cardOutcome, countOutcomes } from '@/lib/practiceResults';
import { toast } from "sonner";
import VoiceSettings from '@/components/utils/VoiceSettings';

// Practice hub: the four parts of the interview as tiles, in the order
// Reading · Writing · Civics · Speaking, each in its skill color with a
// white Start. Tapping one starts right away; a run is full screen
// (?mode=… hides the app header and tab bar, see Layout).
const RUN_MODES = ['reading', 'dictation', 'civics', 'interview', 'vocabulary'];
const RUN_LABEL = {
  reading: 'Reading · Read aloud',
  dictation: 'Writing · Listen and write',
  vocabulary: 'Writing · Vocabulary',
  civics: 'Civics questions',
  interview: 'Speaking · The officer’s questions',
};

function PartTile({ n, skill, label, title, status, onStart }) {
  return (
    <button
      type="button"
      onClick={onStart}
      className={`group text-left rounded-[18px] p-5 min-h-[176px] flex flex-col justify-between gap-4 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${SKILL_COLOR[skill]} ${SKILL_ON[skill]}`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">Part {n} · {label}</span>
        <span className="font-display text-[56px] leading-[0.7]" aria-hidden="true">{n}</span>
      </span>
      <span className="text-[30px] font-bold leading-[1.08] tracking-[-0.01em]">{title}</span>
      <span className="flex items-center justify-between gap-3">
        <span className="font-display italic text-[19px] leading-snug">{status}</span>
        <span className="shrink-0 min-h-11 rounded-full bg-white text-pw-navy px-5 text-base font-semibold inline-flex items-center gap-1.5 group-hover:bg-pw-soft">
          Start <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
        </span>
      </span>
    </button>
  );
}

export default function Practice() {
  const [mode, setMode] = useState('menu'); // menu, dictation, vocabulary, civics
  const [vocabSubMode, setVocabSubMode] = useState('dictation'); // dictation, flashcards, matching
  const [civicsVersion, setCivicsVersion] = useState(() => localStorage.getItem('civicsVersion') || '2025');
  const [civicsDifficulty, setCivicsDifficulty] = useState('all'); // all, easy, medium, hard
  const [content, setContent] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [assignments, setAssignments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [representativeData, setRepresentativeData] = useState(null);
  const hasMounted = React.useRef(false);
  const [results, setResults] = useState([]); // stars: one outcome per card
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const urlMode = searchParams.get('mode');

  // A run lives in the URL (?mode=…) so it is full screen and the browser's
  // Back closes it. Leaving the run clears the param.
  const exitRun = () => {
    setMode('menu');
    setResults([]);
    setSearchParams({}, { replace: false });
  };
  useEffect(() => {
    if (!urlMode && mode !== 'menu') {
      setMode('menu');
      setResults([]);
    }
  }, [urlMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadRepresentativeData = async (email) => {
    try {
      const normalizedEmail = email.toLowerCase().trim();
      const profiles = await base44.entities.PublicProfile.filter({ user_email: normalizedEmail }, '-created_date', 1);
      if (profiles.length > 0 && profiles[0].representative_data) {
        setRepresentativeData(profiles[0].representative_data);
      }
    } catch (e) {
      console.error("Error loading representative data", e);
    }
  };

  const loadUserAndAssignments = async () => {
      try {
        const user = await base44.auth.me();
        if (user) {
          const normalizedEmail = user.email.toLowerCase().trim();
          const normalizedUser = { ...user, email: normalizedEmail };
          setCurrentUser(normalizedUser);
          loadRepresentativeData(normalizedEmail);
          const myAssignments = await base44.entities.Assignment.filter(
            { student_email: normalizedEmail, status: 'pending' }, null, 100
          );
          setAssignments(myAssignments);
        }
      } catch (e) {
        console.error("Error loading user data:", e);
      }
  };

  // Fetch pending assignments on load
  useEffect(() => {
    loadUserAndAssignments();
  }, []);

  // Refresh when returning to menu (skip on initial mount to avoid double-fetch)
  useEffect(() => {
      if (hasMounted.current && mode === 'menu') {
          loadUserAndAssignments();
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
      setSearchParams({}, { replace: true });
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
    if (urlMode !== selectedMode) setSearchParams({ mode: selectedMode });
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

  const startAssignment = async (assignment) => {
  setIsLoading(true);
  let mode = 'dictation';
  if (assignment.content_type === 'vocabulary') mode = 'vocabulary';
  if (assignment.content_type === 'civics_question') mode = 'civics';
  if (assignment.content_type === 'custom') {
    if (assignment.custom_type === 'vocabulary') mode = 'vocabulary';
    else if (assignment.custom_type === 'civics_question') mode = 'civics';
    else mode = 'dictation';
  }
  setMode(mode);
  setSearchParams({ mode });
  setResults([]);
  setCurrentIndex(0);
  setSessionComplete(false);

  try {
    let item;
    
    if (assignment.content_type === 'custom') {
      // Handle custom assignments
      if (assignment.custom_type === 'vocabulary' && assignment.custom_data) {
        item = { 
          text: assignment.custom_data.word, 
          word: assignment.custom_data.word,
          definition: assignment.custom_data.definition,
          type: 'vocabulary', 
          id: 'custom_vocab_' + assignment.id 
        };
        setMode('vocabulary');
        setVocabSubMode('flashcards');
      } else if (assignment.custom_type === 'civics_question' && assignment.custom_data) {
        item = {
          question: assignment.custom_data.question,
          answer: assignment.custom_data.answer,
          type: 'civics_question',
          version: 'custom',
          id: 'custom_civics_' + assignment.id
        };
        setMode('civics');
      } else {
        const text = assignment.custom_content || (assignment.custom_data && assignment.custom_data.text);
        item = { text: text, type: 'sentence', id: 'custom_sentence_' + assignment.id };
      }
    } else {
      // Handle standard content - fetch ALL and filter (Base44 ID query workaround)
      if (assignment.content_type === 'sentence') {
        const all = await base44.entities.Sentence.list('-created_date', 1000);
        item = all.find(s => s.id === assignment.content_id);
      } else if (assignment.content_type === 'vocabulary') {
        const all = await base44.entities.VocabularyWord.list('-created_date', 1000);
        const vocab = all.find(v => v.id === assignment.content_id);
        item = vocab ? { ...vocab, text: vocab.word, type: 'vocabulary' } : null;
      } else if (assignment.content_type === 'civics_question') {
        const all = await base44.entities.CivicsQuestion.list('-created_date', 1000);
        item = all.find(q => q.id === assignment.content_id);
      }
    }

    if (item) {
      setContent([item]);
      item.assignment_id = assignment.id;
    } else {
      toast.error("Content not found");
      exitRun();
    }
  } catch (error) {
    console.error("Error loading assignment", error);
    toast.error("Failed to load assignment");
    exitRun();
  } finally {
    setIsLoading(false);
  }
};

  const handleComplete = async (isSuccess, score = null) => {
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
            assignment_id: currentItem.assignment_id,
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

          // Assignment completion logic
          if (currentItem.assignment_id) {
            await base44.entities.Assignment.update(currentItem.assignment_id, {
              status: 'completed',
              completed_date: new Date().toISOString()
            });
            
            // Notify Tutor
            // Find the assignment to get tutor email (we filtered it out of state, so we need it from somewhere or assume we have it)
            const completedAssignment = assignments.find(a => a.id === currentItem.assignment_id);
            if (completedAssignment) {
                 await base44.entities.Notification.create({
                     user_email: completedAssignment.tutor_email,
                     type: 'assignment',
                     title: 'Assignment Completed',
                     message: `${currentUser.email} has completed an assignment.`,
                     link: '/Tutor'
                 });
            }

            // Update local state immediately so it vanishes from list
            setAssignments(prev => prev.filter(a => a.id !== currentItem.assignment_id));
            
            toast.success("Assignment Completed!");
          }

          // Gamification
          if (isSuccess) {
             const newPoints = (currentUser.points || 0) + 10;
             await base44.auth.updateMe({ points: newPoints });
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
    const label = 'text-sm font-semibold text-pw-navy';
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <PageHeader
          tag="The four parts of the interview"
          title="Practice"
          guide="Pick a part and we start right away. Ten cards, about five minutes."
        >
          <PillButton onClick={() => setSettingsOpen(true)} className="bg-white border border-pw-line">
            <SlidersHorizontal className="w-4 h-4" aria-hidden="true" /> {civicsVersion} test
          </PillButton>
        </PageHeader>

        {assignments.length > 0 && (
          <section aria-labelledby="assigned" className="space-y-3">
            <h2 id="assigned" className="font-display text-[28px] leading-tight flex items-center gap-2">
              <Clock className="w-5 h-5" aria-hidden="true" /> From your tutor
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => startAssignment(a)}
                  className="text-left rounded-[14px] border border-pw-line bg-white shadow-raised hover:border-pw-navy p-4 flex justify-between items-center gap-2 min-h-[64px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                >
                  <div className="overflow-hidden">
                    <p className="font-semibold text-pw-navy text-base capitalize truncate">
                      {a.content_type === 'custom' ? (a.custom_content || 'Custom Task') : a.content_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-pw-muted">
                      Assigned {new Date(a.assigned_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-pw-navy text-white font-semibold px-4 min-h-11 inline-flex items-center">Start</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
          <PartTile n={1} skill="reading" label="Reading" title="Read a sentence aloud" status="We check each word" onStart={() => startSession('reading')} />
          <PartTile n={2} skill="writing" label="Writing" title="Listen and write" status="On ruled paper" onStart={() => startSession('dictation')} />
          <PartTile n={3} skill="civics" label="Civics" title="Civics questions" status={`The ${civicsVersion} test`} onStart={() => startSession('civics')} />
          <PartTile n={4} skill="speaking" label="Speaking" title="The officer’s questions" status="Say what each one asks" onStart={() => { setSearchParams({ mode: 'interview' }); setMode('interview'); }} />
        </div>

        {/* Vocabulary games (part of Writing) */}
        <section aria-labelledby="vocab" className="space-y-2">
          <h2 id="vocab" className="text-[13px] font-semibold uppercase tracking-[0.14em] text-pw-muted">Writing · Vocabulary games</h2>
          <div className="flex flex-wrap gap-2">
            <PillButton onClick={() => startSession('vocabulary', 'dictation')} className="bg-white border border-pw-line"><Mic className="w-4 h-4" aria-hidden="true" /> Word dictation</PillButton>
            <PillButton onClick={() => startSession('vocabulary', 'flashcards')} className="bg-white border border-pw-line"><Sparkles className="w-4 h-4" aria-hidden="true" /> Flashcards</PillButton>
            <PillButton onClick={() => startSession('vocabulary', 'matching')} className="bg-white border border-pw-line"><Layers className="w-4 h-4" aria-hidden="true" /> Matching</PillButton>
          </div>
        </section>

        {/* Mixed practice: the full run-through on Interview Day */}
        <div>
          <span className="ml-4 inline-block rounded-t-lg bg-pw-navy px-3 py-1 text-sm font-semibold text-white">Mixed practice</span>
          <div className="rounded-[14px] bg-white border border-pw-line shadow-raised p-5 space-y-2">
            <h2 className="font-display text-[30px] leading-tight">Interview Day</h2>
            <p className="text-base text-pw-muted max-w-2xl">The whole interview, in order: the oath, the officer’s questions, reading, writing and civics. Nothing is saved.</p>
            <Link
              to="/interview-day"
              className="mt-2 inline-flex min-h-12 items-center gap-2 rounded-full border-2 border-pw-navy px-5 text-base font-semibold text-pw-navy hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
            >
              Start the run-through <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </div>

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

  if (sessionComplete) {
    const counts = countOutcomes(results);
    const total = content.length;
    return (
      <RunShell label={RUN_LABEL[mode]} onClose={exitRun}>
        <Poster
          tone="blue"
          className="-mx-4 sm:mx-0 sm:rounded-[14px]"
          label="Practice · Done"
          question={`${counts.right} of ${total} right`}
          answer={counts.close ? `${counts.close} almost. One more look and you have them.` : 'Nice work.'}
        >
          <div className="space-y-5">
            <PosterStars index={total} total={total} results={results} />
            <p className="text-base">{counts.right} right · {counts.close} almost · {counts.missed} missed</p>
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
         ) : mode === 'civics' ? (
            <CivicsTestCard 
                index={currentIndex}
                total={content.length}
                question={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
                results={results}
                representativeData={representativeData}
            />
         ) : mode === 'vocabulary' ? (
            vocabSubMode === 'flashcards' ? (
              <FlashcardGame 
                words={content} 
                onComplete={(isSuccess) => {
                  handleComplete(isSuccess);
                  handleNext();
                }}
              />
            ) : vocabSubMode === 'matching' ? (
              <MatchingGame 
                words={content}
                onComplete={() => setSessionComplete(true)}
              />
            ) : (
              // Default to Dictation for vocabulary
              <DictationCard 
                  index={currentIndex}
                  total={content.length}
                  sentence={content[currentIndex]}
                  onComplete={handleComplete}
                  onNext={handleNext}
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
function RunShell({ label, onClose, children }) {
  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
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
