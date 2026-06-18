import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Play, CheckCircle, RotateCcw, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Input } from "@/components/ui/input";
import ReactMarkdown from 'react-markdown';
import FlashcardView from '@/components/lessons/FlashcardView';
import KeyPointsDisplay from '@/components/lessons/KeyPointsDisplay';
import { toast } from "sonner";

export default function LessonDetail({ lesson, onBack, onComplete }) {
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
  const questionVersion = quizzes.length > 0 ? quizzes[0].version : '2008';

  useEffect(() => {
    loadData();
  }, [lesson?.id]);

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
  };

  const checkAnswer = () => {
    if (!typedAnswer.trim()) return;
    setShowAnswer(true);
    const newAnsweredCount = answeredCount + 1;
    setAnsweredCount(newAnsweredCount);
  };

  const advanceQuestion = (newScore) => {
    const totalAnswered = answeredCount; // answeredCount was already incremented in checkAnswer
    if (currentQuestion + 1 < quizzes.length) {
      setCurrentQuestion(currentQuestion + 1);
      setTypedAnswer('');
      setShowAnswer(false);
    } else {
      finishQuiz(totalAnswered > 0 ? (newScore / quizzes.length) * 100 : 0);
    }
  };

  const markCorrect = () => {
    const newScore = score + 1;
    setScore(newScore);
    advanceQuestion(newScore);
  };

  const markIncorrect = () => {
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
        total_questions: quizzes.length,
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
        total_questions: quizzes.length,
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
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <Button variant="ghost" onClick={onBack} className="text-slate-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lessons
        </Button>
        {lessonProgress?.completed && lessonProgress?.quiz_attempts > 0 ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-700 font-medium">Lesson Completed</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-slate-500 text-sm">Complete the flashcards and quiz to finish</span>
          </div>
        )}
      </div>

      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{lesson.title}</h1>
        {lesson.description && (
          <p className="text-slate-600 mt-2">{lesson.description}</p>
        )}
      </div>

      {/* Video */}
      {videoId ? (
        <div className="w-full rounded-xl overflow-hidden shadow-lg bg-black">
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
          <div className="w-full rounded-xl bg-slate-100 p-8 text-center text-slate-500">
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
            {flashcardsViewed && <CheckCircle className="w-3 h-3 text-green-500" />}
          </TabsTrigger>
          <TabsTrigger value="quiz" className="flex items-center gap-1.5">
            Quiz
            {quizCompleted && lessonProgress?.best_score > 0 && (
              <span className="text-xs text-green-600 font-medium ml-0.5">{Math.round(lessonProgress.best_score)}%</span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6 mt-4">
          {lesson.key_points && lesson.key_points.length > 0 && (
            <KeyPointsDisplay keyPoints={lesson.key_points} />
          )}

          {lesson.content && (
            <Card className="p-6">
              <div className="prose prose-slate max-w-none">
                <ReactMarkdown>{lesson.content}</ReactMarkdown>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Flashcards Tab */}
        <TabsContent value="flashcards" className="mt-4">
          <Card className="p-6">
            <FlashcardView flashcards={flashcards} />
          </Card>
        </TabsContent>

        {/* Quiz Tab */}
        <TabsContent value="quiz" className="mt-4">
          <Card className="p-6">
            {quizzes.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No USCIS civics questions available for this topic yet.
              </div>
            ) : !quizStarted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Oral Civics Practice</h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Just like the real USCIS interview — read the question aloud, then type or speak your answer. 
                  The officer won't give you multiple choice options!
                </p>
                <p className="text-sm text-slate-500">
                  {quizzes.length} questions from the {questionVersion} civics test
                </p>
                {lessonProgress && lessonProgress.quiz_attempts > 0 && (
                  <p className="text-sm text-slate-500">
                    Previous best: {Math.round(lessonProgress.best_score)}% ({lessonProgress.quiz_attempts} attempt{lessonProgress.quiz_attempts > 1 ? 's' : ''})
                  </p>
                )}
                <Button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700">
                  Start Practice
                </Button>
              </div>
            ) : currentQuestion < quizzes.length ? (
              <div className="space-y-6">
                {/* Progress */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Question {currentQuestion + 1} of {quizzes.length}</span>
                  <span>Score: {score}/{answeredCount}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentQuestion + (showAnswer ? 1 : 0)) / quizzes.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700 font-medium">
                      {quizzes[currentQuestion].version} Test
                    </span>
                    {quizzes[currentQuestion].difficulty && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                        {quizzes[currentQuestion].difficulty}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {quizzes[currentQuestion].question}
                  </h3>
                  
                  {/* Typed answer input */}
                  <div className="space-y-3">
                    <Input
                      placeholder="Type your answer here..."
                      value={typedAnswer}
                      onChange={(e) => setTypedAnswer(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !showAnswer && typedAnswer.trim()) {
                          checkAnswer();
                        }
                      }}
                      disabled={showAnswer}
                      className="text-base"
                    />
                    {!showAnswer ? (
                      <Button 
                        onClick={checkAnswer} 
                        disabled={!typedAnswer.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Check Answer
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        {/* Correct answer reveal */}
                        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <EyeOff className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-blue-800">Official Answer:</span>
                          </div>
                          <p className="text-blue-900 font-medium">{quizzes[currentQuestion].answer}</p>
                        </div>

                        {/* User's answer */}
                        <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                          <p className="text-sm text-slate-500 mb-1">Your answer:</p>
                          <p className="text-slate-800">{typedAnswer}</p>
                        </div>

                        {/* Self-evaluation */}
                        <div className="flex gap-3 justify-center">
                          <Button 
                            onClick={markCorrect}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            I got it right
                          </Button>
                          <Button 
                            onClick={markIncorrect}
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" />
                            I need to practice this
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* Quiz Results */
              <div className="text-center py-8 space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${
                  (score / quizzes.length) * 100 >= 80 ? 'bg-green-100' :
                  (score / quizzes.length) * 100 >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                }`}>
                  <span className="text-2xl font-bold">{Math.round((score / quizzes.length) * 100)}%</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Practice Complete!</h3>
                <p className="text-slate-600">
                  You got {score} out of {quizzes.length} correct
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto text-left">
                  <p className="text-sm text-blue-800">
                    <strong>Remember:</strong> In the real USCIS interview, an officer will ask you these questions 
                    verbally. Your answers don't need to be word-for-word — as long as you convey the correct 
                    meaning, you'll pass!
                  </p>
                </div>

                <div className="space-y-4 pt-4">
                  {!flashcardsViewed && flashcards.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2 max-w-md mx-auto">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Review the flashcards tab before marking this lesson complete.
                    </div>
                  )}
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={startQuiz}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retry Practice
                    </Button>
                    <Button 
                      onClick={handleMarkComplete} 
                      className="bg-green-600 hover:bg-green-700"
                      disabled={!flashcardsViewed && flashcards.length > 0}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}