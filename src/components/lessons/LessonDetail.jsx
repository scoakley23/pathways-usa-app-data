import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Play, CheckCircle, RotateCcw, AlertCircle, EyeOff, Mic, MicOff, Keyboard, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';
import FlashcardView from '@/components/lessons/FlashcardView';
import KeyPointsDisplay from '@/components/lessons/KeyPointsDisplay';
import QuizExplanationPanel from '@/components/lessons/QuizExplanationPanel';
import GlossaryText from '@/components/lessons/GlossaryText';
import { toast } from "sonner";
import { useLessonTranslation } from '@/hooks/useLessonTranslation';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import TopicArt, { TOPIC_ART } from '@/components/art/TopicArt';
import { RaisedCard, Tag, SegmentedProgress } from '@/components/pathways/ui';

export default function LessonDetail({ lesson, onBack, onComplete, lessons, onNavigateLesson }) {
  const [user, setUser] = useState(null);
  const [flashcards, setFlashcards] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [lessonProgress, setLessonProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quiz state
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [score, setScore] = useState(0);
  const [answeredCount, setAnsweredCount] = useState(0);
  const [flashcardsViewed, setFlashcardsViewed] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [inputMode, setInputMode] = useState('type');
  const [isListening, setIsListening] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selfCheckMode, setSelfCheckMode] = useState(false);
  const recognitionRef = useRef(null);

  const {
    language,
    setLanguage,
    translating,
    displayLesson,
    displayFlashcards,
    displayQuizzes,
  } = useLessonTranslation({ lesson, flashcards, quizzes });

  const questionVersion = displayQuizzes.length > 0 ? quizzes[0].version : '2008';

  useEffect(() => {
    loadData();
  }, [lesson?.id]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setTypedAnswer(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
    };
  }, []);

  const cleanQuestionText = (text) => {
    if (!text) return text;
    return text.replace(/\s*\([^)]*(?:2008|2025)[^)]*\)\s*$/i, '').trim();
  };

  const currentIndex = lessons ? lessons.findIndex(l => l.id === lesson?.id) : -1;
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < (lessons?.length || 0) - 1 ? lessons[currentIndex + 1] : null;

  const relatedLessons = lessons ? lessons.filter(l => l.topic === lesson?.topic && l.id !== lesson?.id) : [];

  const handleNavigate = (newLesson) => {
    setQuizStarted(false);
    setCurrentQuestion(0);
    setTypedAnswer('');
    setShowAnswer(false);
    setScore(0);
    setAnsweredCount(0);
    setFlashcardsViewed(false);
    setQuizCompleted(false);
    setShowExplanation(false);
    setExplanation(null);
    setVerifying(false);
    setVerificationResult(null);
    setSelfCheckMode(false);
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onNavigateLesson) onNavigateLesson(newLesson);
  };

  const loadData = async () => {
    if (!lesson?.id) return;
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [lessonFlashcards, civics2025, civics2008, progressList] = await Promise.all([
        base44.entities.LessonFlashcard.filter({ lesson_id: lesson.id }, null, 200),
        base44.entities.CivicsQuestion.filter({ version: '2025', category: lesson.topic }, null, 100),
        base44.entities.CivicsQuestion.filter({ version: '2008', category: lesson.topic }, null, 100),
        currentUser?.email ? base44.entities.LessonProgress.filter(
          { user_email: currentUser.email, lesson_id: lesson.id }, null, 1
        ) : Promise.resolve([])
      ]);

      setFlashcards(lessonFlashcards);
      // Use 2025 questions, fall back to 2008 if none available
      setQuizzes(civics2025.length > 0 ? civics2025 : civics2008);
      if (progressList.length > 0) {
        setLessonProgress(progressList[0]);
        setQuizCompleted(progressList[0].quiz_attempts > 0);
      } else if (currentUser?.email) {
        // Mark as "in progress" the moment they open the lesson
        try {
          const newProgress = await base44.entities.LessonProgress.create({
            user_email: currentUser.email,
            lesson_id: lesson.id,
            topic: lesson.topic,
            completed: false,
            quiz_attempts: 0,
            best_score: 0,
            last_score: 0,
            total_questions: civics2025.length || civics2008.length,
            last_attempt_date: new Date().toISOString(),
            needs_review: false
          });
          setLessonProgress(newProgress);
        } catch (e) {
          console.error('Failed to create initial progress:', e);
        }
      }
    } catch (err) {
      console.error('Failed to load lesson data:', err);
    } finally {
      setLoading(false);
    }
  };

  const extractYouTubeId = (url) => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&]+)/,
      /(?:youtu\.be\/)([^?]+)/,
      /(?:youtube\.com\/embed\/)([^/?]+)/,
      /^([a-zA-Z0-9_-]{11})$/
    ];
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setCurrentQuestion(0);
    setTypedAnswer('');
    setShowAnswer(false);
    setScore(0);
    setAnsweredCount(0);
    setShowExplanation(false);
    setExplanation(null);
    setVerifying(false);
    setVerificationResult(null);
    setSelfCheckMode(false);
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  };

  const checkAnswer = async () => {
    if (!typedAnswer.trim()) return;
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }

    if (selfCheckMode) {
      setShowAnswer(true);
      setAnsweredCount(answeredCount + 1);
      return;
    }

    setVerifying(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a USCIS citizenship test examiner. Determine if the student's spoken answer is correct.

Question: ${displayQuizzes[currentQuestion].question}
Official Answer: ${displayQuizzes[currentQuestion].answer}
Student's Answer: ${typedAnswer}

In the real USCIS interview, answers don't need to be word-for-word — as long as the meaning is correct, it counts. Determine if the student's answer conveys the correct meaning.`,
        response_json_schema: {
          type: "object",
          properties: {
            is_correct: { type: "boolean" },
            feedback: { type: "string" }
          }
        }
      });
      setVerificationResult(result);
      setShowAnswer(true);
      setAnsweredCount(answeredCount + 1);

      if (!result.is_correct) {
        setShowExplanation(true);
        fetchExplanation(displayQuizzes[currentQuestion]);
      }
    } catch (e) {
      console.error('Failed to verify answer:', e);
      setSelfCheckMode(true);
      setShowAnswer(true);
      setAnsweredCount(answeredCount + 1);
    } finally {
      setVerifying(false);
    }
  };

  const advanceQuestion = (newScore) => {
    const totalAnswered = answeredCount;
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    setTypedAnswer('');
    setShowAnswer(false);
    setShowExplanation(false);
    setExplanation(null);
    setVerificationResult(null);
    setSelfCheckMode(false);
    if (currentQuestion + 1 < displayQuizzes.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Move past the last question so the results screen renders,
      // even when finishQuiz can't save (e.g. signed out).
      setCurrentQuestion(displayQuizzes.length);
      finishQuiz(totalAnswered > 0 ? (newScore / displayQuizzes.length) * 100 : 0);
    }
  };

  const markCorrect = () => {
    const newScore = score + 1;
    setScore(newScore);
    advanceQuestion(newScore);
  };

  const markIncorrect = () => {
    setShowExplanation(true);
    fetchExplanation(displayQuizzes[currentQuestion]);
  };

  const fetchExplanation = async (quizItem) => {
    setLoadingExplanation(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `A student studying for the US citizenship test got this question wrong:

Question: ${quizItem.question}
Correct Answer: ${quizItem.answer}

Please provide a brief, simple explanation (2-3 sentences) of this concept in plain English that a non-native English speaker can easily understand. Explain WHY this is the correct answer and include any helpful context.`,
      });
      setExplanation(result);
    } catch (e) {
      console.error('Failed to fetch explanation:', e);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleContinueFromExplanation = () => {
    setShowExplanation(false);
    setExplanation(null);
    advanceQuestion(score);
  };

  const finishQuiz = async (finalScore) => {
    if (!user?.email) return;
    
    try {
      const existing = await base44.entities.LessonProgress.filter(
        { user_email: user.email, lesson_id: lesson.id }, null, 1
      );

      const progressData = {
        user_email: user.email,
        lesson_id: lesson.id,
        topic: lesson.topic,
        completed: true,
        quiz_attempts: (lessonProgress?.quiz_attempts || 0) + 1,
        best_score: Math.max(lessonProgress?.best_score || 0, finalScore),
        last_score: finalScore,
        total_questions: displayQuizzes.length,
        last_attempt_date: new Date().toISOString(),
        needs_review: finalScore < 60
      };

      if (existing.length > 0) {
        await base44.entities.LessonProgress.update(existing[0].id, progressData);
      } else {
        await base44.entities.LessonProgress.create(progressData);
      }

      toast.success(`Quiz completed! Score: ${Math.round(finalScore)}%`);
      setQuizCompleted(true);
      setLessonProgress(prev => ({ ...prev, completed: true, quiz_attempts: (prev?.quiz_attempts || 0) + 1, best_score: Math.max(prev?.best_score || 0, finalScore), last_score: finalScore }));
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };

  const handleMarkComplete = async () => {
    if (!user?.email) return;
    
    try {
      const existing = await base44.entities.LessonProgress.filter(
        { user_email: user.email, lesson_id: lesson.id }, null, 1
      );

      const data = {
        user_email: user.email,
        lesson_id: lesson.id,
        topic: lesson.topic,
        completed: true,
        quiz_attempts: lessonProgress?.quiz_attempts || 0,
        best_score: lessonProgress?.best_score || 0,
        last_score: lessonProgress?.last_score || 0,
        total_questions: displayQuizzes.length,
        last_attempt_date: new Date().toISOString(),
        needs_review: lessonProgress?.needs_review || false
      };

      if (existing.length > 0) {
        await base44.entities.LessonProgress.update(existing[0].id, data);
      } else {
        await base44.entities.LessonProgress.create(data);
      }
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
    if (onComplete) onComplete();
  };

  const videoId = extractYouTubeId(lesson.video_url);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-pw-navy" />
      </div>
    );
  }

  const optionRow = 'w-full min-h-[44px] rounded-2xl border border-pw-line bg-white p-4';
  const modeBtn = (active) => `flex items-center justify-center min-h-[44px] px-4 rounded-full text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${active ? 'bg-pw-navy text-white' : 'text-pw-navy hover:bg-white'}`;
  const resultPct = displayQuizzes.length ? (score / displayQuizzes.length) * 100 : 0;

  return (
    <div className="space-y-6 text-pw-navy">
      {/* Header */}
      <header className="rounded-3xl bg-pw-blue-soft px-4 pt-4 pb-5 sm:px-6 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="min-h-[44px] shrink-0 rounded-2xl bg-white border border-pw-line text-pw-navy hover:bg-pw-soft transition-colors inline-flex items-center gap-2 px-4 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
          >
            <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            Back to Lessons
          </button>
          {TOPIC_ART[lesson.topic] && (
            <TopicArt name={TOPIC_ART[lesson.topic]} className="h-16 w-auto max-w-[40%]" />
          )}
        </div>

        {/* Title */}
        <div>
          {displayLesson.topic && <Tag tone="blue" className="mb-3">{displayLesson.topic}</Tag>}
          <h1 className="text-[28px] sm:text-[34px] leading-tight font-extrabold tracking-[-0.5px]">{displayLesson.title}</h1>
          {displayLesson.description && (
            <p className="text-pw-muted text-lg mt-1">{displayLesson.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <LanguageSelector
            language={language}
            onLanguageChange={setLanguage}
            translating={translating}
          />
          {translating ? (
            <Tag tone="blue">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
              Translating...
            </Tag>
          ) : lessonProgress?.completed && lessonProgress?.quiz_attempts > 0 ? (
            <Tag tone="green">
              Lesson Completed
            </Tag>
          ) : (
            <p className="text-base text-pw-muted">Complete the flashcards and quiz to finish</p>
          )}
        </div>
      </header>

      {/* Video */}
      {videoId ? (
        <div className="w-full rounded-3xl overflow-hidden shadow-raised bg-black">
          <div className="relative" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?origin=${window.location.origin}`}
              title="Lesson video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      ) : (
        lesson.video_url && (
          <div className="w-full rounded-3xl bg-pw-soft p-8 text-center text-base text-pw-muted">
            Video not available
          </div>
        )
      )}

      {/* Main Tabs */}
      <Tabs defaultValue="content" className="w-full">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="content" className="flex items-center gap-1.5">
            Lesson
          </TabsTrigger>
          <TabsTrigger value="flashcards" className="flex items-center gap-1.5" onClick={() => setFlashcardsViewed(true)}>
            Flashcards
            {flashcardsViewed && <CheckCircle className="w-4 h-4 text-pw-green-ink" aria-label="Viewed" />}
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-1.5">
            Quiz
            {quizCompleted && lessonProgress?.best_score > 0 && (
              <span className="text-sm font-bold ml-0.5 opacity-80">{Math.round(lessonProgress.best_score)}%</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-4">
          {displayLesson.key_points && displayLesson.key_points.length > 0 && (
            <KeyPointsDisplay keyPoints={displayLesson.key_points} />
          )}

          {displayLesson.content && (
            <RaisedCard>
              <div className="prose prose-slate max-w-none text-base leading-relaxed text-pw-navy [&_h1]:text-2xl [&_h2]:text-xl [&_h3]:text-lg [&_h1]:font-extrabold [&_h2]:font-extrabold [&_h3]:font-extrabold [&_h1]:mt-6 [&_h2]:mt-6 [&_h3]:mt-6 [&_h1]:mb-2 [&_h2]:mb-2 [&_h3]:mb-2 [&>*:first-child]:mt-0 [&_p]:my-3 [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-6 [&_ol]:pl-6 [&_ul]:my-3 [&_ol]:my-3 [&_li]:my-1 [&_li]:marker:text-pw-red [&_strong]:font-extrabold [&_a]:underline [&_a]:decoration-pw-red">
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p><GlossaryText>{children}</GlossaryText></p>,
                    li: ({ children }) => <li><GlossaryText>{children}</GlossaryText></li>,
                  }}
                >
                  {displayLesson.content}
                </ReactMarkdown>
              </div>
            </RaisedCard>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="mt-4">
          <RaisedCard>
            <FlashcardView flashcards={displayFlashcards} />
          </RaisedCard>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="mt-4">
          <RaisedCard>
            {displayQuizzes.length === 0 ? (
              <div className="text-center py-8 text-base text-pw-muted">
                No USCIS civics questions available for this topic yet.
              </div>
            ) : !quizStarted ? (
              <div className="space-y-4">
                <div className="rounded-2xl bg-pw-blue-soft p-3">
                  <TopicArt name="speech" className="w-full h-20" />
                </div>
                <Tag tone="blue">{displayQuizzes.length} questions from the {questionVersion} civics test</Tag>
                <h3 className="text-2xl font-extrabold">Oral Civics Practice</h3>
                <p className="text-base text-pw-muted leading-relaxed">
                  Just like the real USCIS interview — read the question, then speak or type your answer.
                  Your response will be verified automatically, just like a real officer would assess it.
                </p>
                {lessonProgress && lessonProgress.quiz_attempts > 0 && (
                  <p className="text-base font-bold">
                    Previous best: {Math.round(lessonProgress.best_score)}% ({lessonProgress.quiz_attempts} attempt{lessonProgress.quiz_attempts > 1 ? 's' : ''})
                  </p>
                )}
                <Button onClick={startQuiz} size="lg" className="w-full sm:w-auto">
                  <Play className="w-5 h-5" aria-hidden="true" />
                  Start Practice
                </Button>
              </div>
            ) : currentQuestion < displayQuizzes.length ? (
              <div className="space-y-6">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-bold text-pw-muted">
                    <span>Question {currentQuestion + 1} of {displayQuizzes.length}</span>
                    <span>Score: {score}/{answeredCount}</span>
                  </div>
                  <SegmentedProgress
                    current={currentQuestion}
                    total={displayQuizzes.length}
                    label={`Question ${currentQuestion + 1} of ${displayQuizzes.length}`}
                  />
                </div>

                {/* Question */}
                <div>
                  <Tag tone="blue" className="mb-3">
                    {displayQuizzes[currentQuestion].version} Civics Test
                  </Tag>
                  <h3 className="text-2xl font-extrabold leading-snug mb-5">
                    {cleanQuestionText(displayQuizzes[currentQuestion].question)}
                  </h3>
                  
                  {/* Answer input area */}
                  <div className="space-y-4">
                    {/* Mode toggle */}
                    {!showAnswer && (
                      <div className="flex gap-1 p-1 bg-pw-soft rounded-full w-fit" role="group" aria-label="Answer mode">
                        <button
                          type="button"
                          aria-pressed={inputMode === 'type'}
                          onClick={() => { if (isListening && recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) {} } setInputMode('type'); }}
                          className={modeBtn(inputMode === 'type')}
                        >
                          <Keyboard className="w-4 h-4 mr-1.5" aria-hidden="true" /> Type
                        </button>
                        <button
                          type="button"
                          aria-pressed={inputMode === 'speak'}
                          onClick={() => {
                            if (!recognitionRef.current) { toast.error('Voice input is not supported in this browser'); return; }
                            setInputMode('speak');
                          }}
                          className={modeBtn(inputMode === 'speak')}
                        >
                          <Mic className="w-4 h-4 mr-1.5" aria-hidden="true" /> Speak
                        </button>
                      </div>
                    )}

                    {inputMode === 'speak' && !showAnswer ? (
                      <div className="space-y-4">
                        <div className={`${optionRow} min-h-[56px] bg-pw-soft border-transparent`} aria-live="polite">
                          {typedAnswer ? (
                            <p className="text-base text-pw-navy">{typedAnswer}</p>
                          ) : (
                            <p className="text-base text-pw-muted">
                              {isListening ? 'Listening...' : 'Tap the microphone and speak your answer'}
                            </p>
                          )}
                        </div>
                        <div className="flex justify-center">
                          <button
                            type="button"
                            onClick={() => {
                              if (isListening) {
                                recognitionRef.current?.stop();
                              } else {
                                setTypedAnswer('');
                                recognitionRef.current?.start();
                              }
                            }}
                            disabled={!recognitionRef.current}
                            className={`min-h-[52px] rounded-full px-6 inline-flex items-center justify-center gap-2 text-base font-bold text-white transition-colors ring-8 ring-pw-red-soft disabled:opacity-40 focus-visible:outline-none focus-visible:ring-pw-red ${isListening ? 'bg-pw-red-ink' : 'bg-pw-red hover:bg-pw-red-ink'}`}
                          >
                            {isListening ? <MicOff className="w-5 h-5" aria-hidden="true" /> : <Mic className="w-5 h-5" aria-hidden="true" />}
                            {isListening ? 'Stop Listening' : 'Start Speaking'}
                          </button>
                        </div>
                      </div>
                    ) : !showAnswer ? (
                      <Input
                        placeholder="Type your answer here..."
                        aria-label="Your answer"
                        value={typedAnswer}
                        onChange={(e) => setTypedAnswer(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !showAnswer && typedAnswer.trim()) {
                            checkAnswer();
                          }
                        }}
                        className="text-base"
                      />
                    ) : null}

                    {!showAnswer ? (
                      <div className="space-y-2">
                        <Button
                          onClick={checkAnswer}
                          disabled={!typedAnswer.trim() || verifying}
                          size="lg"
                          className="w-full"
                        >
                          {verifying ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Verifying...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Submit Answer
                            </>
                          )}
                        </Button>
                        {!selfCheckMode && (
                          <button
                            type="button"
                            onClick={() => setSelfCheckMode(true)}
                            className="min-h-[44px] w-full text-sm font-bold text-pw-muted hover:text-pw-navy underline underline-offset-4 decoration-pw-line"
                          >
                            Having trouble? Reveal answer to self-check
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {!selfCheckMode && verificationResult ? (
                          verificationResult.is_correct ? (
                            <div className="space-y-4">
                              <div className="p-4 rounded-2xl bg-pw-green-soft text-pw-green-ink">
                                <div className="flex items-center gap-2 mb-1">
                                  <CheckCircle className="w-5 h-5" aria-hidden="true" />
                                  <span className="text-lg font-extrabold">Correct!</span>
                                </div>
                                {verificationResult.feedback && <p className="text-base">{verificationResult.feedback}</p>}
                              </div>
                              <Button onClick={markCorrect} size="lg" className="w-full">
                                Next Question
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 rounded-2xl bg-pw-red-soft text-pw-red-ink">
                                <div className="flex items-center gap-2 mb-1">
                                  <AlertCircle className="w-5 h-5" aria-hidden="true" />
                                  <span className="text-lg font-extrabold">Not quite right</span>
                                </div>
                                {verificationResult.feedback && <p className="text-base mb-3">{verificationResult.feedback}</p>}
                                <div className="mt-3 rounded-xl bg-white p-3">
                                  <p className="text-sm font-bold text-pw-muted mb-1">Official answer:</p>
                                  <p className="text-base font-bold text-pw-navy [overflow-wrap:anywhere]">{displayQuizzes[currentQuestion].answer}</p>
                                </div>
                              </div>
                              <QuizExplanationPanel
                                loadingExplanation={loadingExplanation}
                                explanation={explanation}
                                relatedLessons={relatedLessons}
                                onNavigate={handleNavigate}
                                onContinue={handleContinueFromExplanation}
                              />
                            </div>
                          )
                        ) : (
                          <>
                            <div className="p-4 rounded-2xl bg-pw-blue-soft text-pw-blue-ink">
                              <div className="flex items-center gap-2 mb-1">
                                <EyeOff className="w-4 h-4" aria-hidden="true" />
                                <span className="text-sm font-bold">Official Answer:</span>
                              </div>
                              <p className="text-lg font-extrabold text-pw-navy [overflow-wrap:anywhere]">{displayQuizzes[currentQuestion].answer}</p>
                            </div>
                            <div className={optionRow}>
                              <p className="text-sm font-bold text-pw-muted mb-1">Your answer:</p>
                              <p className="text-base text-pw-navy [overflow-wrap:anywhere]">{typedAnswer}</p>
                            </div>
                            {showExplanation ? (
                              <QuizExplanationPanel
                                loadingExplanation={loadingExplanation}
                                explanation={explanation}
                                relatedLessons={relatedLessons}
                                onNavigate={handleNavigate}
                                onContinue={handleContinueFromExplanation}
                              />
                            ) : (
                              <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
                                <Button onClick={markCorrect} className="w-full sm:w-auto">
                                  <CheckCircle className="w-4 h-4" />
                                  I got it right
                                </Button>
                                <Button onClick={markIncorrect} variant="outline" className="w-full sm:w-auto text-pw-red-ink">
                                  <RotateCcw className="w-4 h-4" />
                                  I need to practice this
                                </Button>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Quiz Results */
              <div className="text-center py-4 space-y-4">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${
                  resultPct >= 80 ? 'bg-pw-green-soft text-pw-green-ink' :
                  resultPct >= 60 ? 'bg-pw-blue-soft text-pw-blue-ink' : 'bg-pw-red-soft text-pw-red-ink'
                }`}>
                  <span className="text-3xl font-extrabold">{Math.round((score / displayQuizzes.length) * 100)}%</span>
                </div>
                <h3 className="text-2xl font-extrabold">Practice Complete!</h3>
                <p className="text-lg text-pw-muted">
                  You got {score} out of {displayQuizzes.length} correct
                </p>
                
                <div className="bg-pw-blue-soft rounded-2xl p-4 max-w-md mx-auto text-left">
                  <p className="text-base text-pw-blue-ink">
                    <strong>Remember:</strong> In the real USCIS interview, an officer will ask you these questions 
                    verbally. Your answers don't need to be word-for-word — as long as you convey the correct 
                    meaning, you'll pass!
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  {!flashcardsViewed && displayFlashcards.length > 0 && (
                    <div className="bg-pw-red-soft rounded-2xl p-3 text-base text-pw-red-ink flex items-center gap-2 max-w-md mx-auto text-left">
                      <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
                      Review the flashcards tab before marking this lesson complete.
                    </div>
                  )}
                  <div className="flex flex-col sm:flex-row sm:justify-center gap-3">
                    <Button variant="outline" onClick={startQuiz} className="w-full sm:w-auto">
                      <RotateCcw className="w-4 h-4" />
                      Retry Practice
                    </Button>
                    <Button 
                      onClick={handleMarkComplete} 
                      className="w-full sm:w-auto"
                      disabled={!flashcardsViewed && displayFlashcards.length > 0}
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Complete
                    </Button>
                    {nextLesson && (
                      <Button onClick={() => handleNavigate(nextLesson)} variant="secondary" className="w-full sm:w-auto">
                        Next Lesson
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </RaisedCard>
        </TabsContent>

      </Tabs>

      {/* Lesson Navigation */}
      {lessons && lessons.length > 1 && (
        <nav aria-label="Lesson navigation" className="space-y-3 pt-6 border-t border-pw-line">
          <div className="grid grid-cols-2 gap-3">
            {prevLesson ? (
              <button
                type="button"
                onClick={() => handleNavigate(prevLesson)}
                className={`${optionRow} flex items-center gap-2 text-left hover:border-pw-navy transition-colors min-w-0`}
              >
                <ChevronLeft className="w-5 h-5 shrink-0" aria-hidden="true" />
                <div className="overflow-hidden min-w-0">
                  <div className="text-sm font-bold text-pw-muted">Previous</div>
                  <div className="text-base font-bold truncate">{prevLesson.title}</div>
                </div>
              </button>
            ) : <div />}

            {nextLesson ? (
              <button
                type="button"
                onClick={() => handleNavigate(nextLesson)}
                className="w-full min-h-[44px] rounded-2xl bg-pw-navy text-white p-4 flex items-center justify-end gap-2 text-right hover:bg-[#0F1B36] transition-colors min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
              >
                <div className="overflow-hidden min-w-0">
                  <div className="text-sm font-bold text-white/75">Next</div>
                  <div className="text-base font-bold truncate">{nextLesson.title}</div>
                </div>
                <ChevronRight className="w-5 h-5 shrink-0" aria-hidden="true" />
              </button>
            ) : <div />}
          </div>

          <Button variant="ghost" onClick={onBack} className="w-full">
            All Lessons
          </Button>
        </nav>
      )}
    </div>
  );
}
