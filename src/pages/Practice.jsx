import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mic, BookA, GraduationCap, Clock, ArrowRight, CheckCircle, Loader2, Sparkles, Layers } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DictationCard from '@/components/game/DictationCard';
import CivicsTestCard from '@/components/practice/CivicsTestCard';
import FlashcardGame from '@/components/practice/FlashcardGame';
import MatchingGame from '@/components/practice/MatchingGame';
import ReadingPracticeCard from '@/components/practice/ReadingPracticeCard';
import InterviewPractice from '@/components/practice/InterviewPractice';
import StudyBuddy from '@/components/ai/StudyBuddy';
import RepresentativeFinder from '@/components/civics/RepresentativeFinder';
import PracticePathProgress from '@/components/practice/PracticePathProgress';
import PageHeader from '@/components/PageHeader';
import TopicArt from '@/components/art/TopicArt';
import { Tag } from '@/components/pathways/ui';
import { toast } from "sonner";
import VoiceSettings from '@/components/utils/VoiceSettings';

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
    const urlMode = new URLSearchParams(window.location.search).get('mode');
    if (startedFromUrl.current || !urlMode) return;
    if (urlMode === 'interview') {
      startedFromUrl.current = true;
      setMode('interview');
    } else if (['reading', 'dictation', 'civics'].includes(urlMode) && currentUser) {
      startedFromUrl.current = true;
      startSession(urlMode);
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
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setMode('menu')} className="text-slate-600 hover:text-slate-900">
          &larr; Back to Practice Menu
        </Button>
        <InterviewPractice 
          onComplete={(passed) => {
            if (passed) {
              toast.success('Great job! You\'re ready for the interview!');
            } else {
              toast.info('Keep practicing - you\'re getting better!');
            }
            setMode('menu');
          }}
          onNext={() => {}}
        />
      </div>
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
      setMode('menu');
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
      setMode('menu');
    }
  } catch (error) {
    console.error("Error loading assignment", error);
    toast.error("Failed to load assignment");
    setMode('menu');
  } finally {
    setIsLoading(false);
  }
};

  const handleComplete = async (isSuccess, score = null) => {
    const currentItem = content[currentIndex];
    
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
    const banner = (art) => (
      <div className="bg-pw-blue-soft px-4 pt-3 pb-2 -mx-6 -mt-6 mb-4 rounded-t-3xl">
        <TopicArt name={art} className="w-full h-16" accent={false} />
      </div>
    );
    const label = 'text-sm font-bold text-pw-navy';
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12">
        <PageHeader
          title="Practice Dashboard"
          subtitle="Choose your study mode to prepare for your citizenship test."
          tag="Practice"
          tagTone="red"
          art="book"
        />
        <div className="flex justify-center">
          <VoiceSettings />
        </div>

        <PracticePathProgress userEmail={currentUser?.email} />

        {assignments.length > 0 && (
        <div className="bg-white border border-pw-line shadow-raised rounded-3xl p-5">
          <h2 className="text-xl font-extrabold text-pw-navy flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5" /> Assignments from your Tutor
          </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {assignments.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => startAssignment(a)}
                  className="text-left rounded-2xl border-2 border-pw-line bg-white hover:border-pw-navy p-4 flex justify-between items-center gap-2 min-h-[64px] transition-colors"
                >
                  <div className="overflow-hidden">
                    <p className="font-bold text-pw-navy text-base capitalize truncate">
                      {a.content_type === 'custom' ? (a.custom_content || 'Custom Task') : a.content_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-pw-muted">
                      Assigned {new Date(a.assigned_date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-xl bg-pw-navy text-white font-bold px-4 min-h-11 inline-flex items-center">Start</span>
                </button>
              ))}
            </div>
        </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* 1. Reading Mode */}
          <Card className="overflow-hidden hover:shadow-lift transition-all duration-300 cursor-pointer" onClick={() => startSession('reading')}>
            <CardHeader>
              {banner('book')}
              <CardTitle className="text-xl">Reading</CardTitle>
              <CardDescription>
                Read official USCIS sentences aloud to practice pronunciation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full"><BookA className="w-4 h-4" /> Start Reading</Button>
            </CardContent>
          </Card>

          {/* 2. Writing Vocab */}
          <Card className="overflow-hidden hover:shadow-lift transition-all duration-300">
            <CardHeader>
              {banner('scroll')}
              <CardTitle className="text-xl">Writing Vocab</CardTitle>
              <CardDescription>
                Practice writing official vocabulary words.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button onClick={() => startSession('vocabulary', 'dictation')} className="w-full justify-start">
                <Mic className="w-4 h-4 mr-2" /> Dictation
              </Button>
              <Button onClick={() => startSession('vocabulary', 'flashcards')} variant="outline" className="w-full justify-start">
                <Sparkles className="w-4 h-4 mr-2" /> Flashcards
              </Button>
              <Button onClick={() => startSession('vocabulary', 'matching')} variant="outline" className="w-full justify-start">
                <Layers className="w-4 h-4 mr-2" /> Matching
              </Button>
            </CardContent>
          </Card>

          {/* 3. Sentence Dictation */}
          <Card className="overflow-hidden hover:shadow-lift transition-all duration-300 cursor-pointer" onClick={() => startSession('dictation')}>
            <CardHeader>
              {banner('pencil')}
              <CardTitle className="text-xl">Sentence Dictation</CardTitle>
              <CardDescription>
                Listen to full sentences and write them down correctly.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full"><Mic className="w-4 h-4" /> Start Dictation</Button>
            </CardContent>
          </Card>

          {/* 4. Civics Test */}
          <Card className="overflow-hidden hover:shadow-lift transition-all duration-300">
            <CardHeader>
              {banner('capitol')}
              <div className="flex justify-between items-start gap-2">
                 <CardTitle className="text-xl">Civics Test</CardTitle>
                 <Badge variant="outline">Quiz</Badge>
              </div>
              <CardDescription className="mb-4">
                Practice the civics questions for the 2025 and 2008 tests.
              </CardDescription>
              <div className="space-y-4 pt-2" onClick={(e) => e.stopPropagation()}>
                 <div className="space-y-2">
                   <label className={label}>Version:</label>
                   <Select value={civicsVersion} onValueChange={(v) => { setCivicsVersion(v); localStorage.setItem('civicsVersion', v); }}>
                      <SelectTrigger className="h-auto text-left">
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
                   <a href="https://www.uscis.gov/citizenship/2025-test" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-pw-navy underline underline-offset-4 decoration-pw-red/60 hover:decoration-pw-red inline-block">
                      Not sure which test you'll take? Check uscis.gov.
                   </a>
                 </div>
                 <div className="space-y-2">
                   <label className={label}>Difficulty:</label>
                   <Select value={civicsDifficulty} onValueChange={setCivicsDifficulty}>
                      <SelectTrigger>
                          <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="easy">Easy</SelectItem>
                          <SelectItem value="medium">Med</SelectItem>
                          <SelectItem value="hard">Hard</SelectItem>
                      </SelectContent>
                   </Select>
                 </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button onClick={() => startSession('civics')} className="w-full"><GraduationCap className="w-4 h-4" /> Start Quiz</Button>
            </CardContent>
          </Card>
        </div>

        {/* Interview Practice Section */}
        <button
          type="button"
          onClick={() => setMode('interview')}
          className="group w-full text-left rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden hover:shadow-lift transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
        >
          <div className="flex flex-col sm:flex-row">
            <div className="sm:w-56 shrink-0 bg-pw-red-soft px-4 py-4 grid place-items-center">
              <TopicArt name="speech" className="w-full h-20" />
            </div>
            <div className="flex-1 p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h3 className="text-2xl font-extrabold text-pw-navy">Mock Interview Practice</h3>
                <Tag tone="red">NEW</Tag>
              </div>
              <p className="text-base text-pw-muted mb-4">
                Simulate your real citizenship interview with realistic questions from all sections: small talk, personal information, morals & ethics, and oath requirements.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Tag tone="navy">AI-powered feedback</Tag>
                <Tag tone="navy">Speech practice</Tag>
                <Tag tone="navy">Real interview format</Tag>
                <ArrowRight className="w-6 h-6 text-pw-navy ml-auto shrink-0" aria-hidden="true" />
              </div>
            </div>
          </div>
        </button>

        {/* Representative Finder — moved to bottom */}
        <RepresentativeFinder
          userEmail={currentUser?.email}
          onDataLoaded={setRepresentativeData}
        />
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 animate-in fade-in">
        <div className="w-20 h-20 bg-pw-green-soft text-pw-green-ink rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-extrabold text-pw-navy">Session Complete!</h2>
        <p className="text-lg text-pw-muted">You've finished your practice session.</p>
        <Button onClick={() => setMode('menu')} className="min-w-[200px]">
          Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-2 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setMode('menu')}>
          &larr; Exit Practice
        </Button>
        <Badge variant="outline" className="capitalize">{mode.replace('_', ' ')}</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-pw-navy" />
        </div>
      ) : content.length > 0 ? (
         mode === 'reading' ? (
            <ReadingPracticeCard 
                sentence={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
            />
         ) : mode === 'civics' ? (
            <CivicsTestCard 
                question={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
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
                  sentence={content[currentIndex]}
                  onComplete={handleComplete}
                  onNext={handleNext}
              />
            )
         ) : (
            // Dictation (Sentences)
            <DictationCard 
                sentence={content[currentIndex]}
                onComplete={handleComplete}
                onNext={handleNext}
            />
         )
      ) : (
         <div className="text-center py-20">
            <p className="text-lg text-pw-muted">No content found for this mode.</p>
            <Button onClick={() => setMode('menu')} className="mt-4">Go Back</Button>
         </div>
         )}
         <StudyBuddy />
         </div>
         );
         }