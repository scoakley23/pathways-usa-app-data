import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Play, CheckCircle, RotateCcw, AlertCircle } from 'lucide-react';
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
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [flashcardsViewed, setFlashcardsViewed] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  useEffect(() => {
    loadData();
  }, [lesson?.id]);

  const loadData = async () => {
    if (!lesson?.id) return;
    setLoading(true);
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);

      const [lessonFlashcards, lessonQuizzes, progressList] = await Promise.all([
        base44.entities.LessonFlashcard.filter({ lesson_id: lesson.id }, null, 200),
        base44.entities.LessonQuiz.filter({ lesson_id: lesson.id }, null, 100),
        currentUser?.email ? base44.entities.LessonProgress.filter(
          { user_email: currentUser.email, lesson_id: lesson.id }, null, 1
        ) : Promise.resolve([])
      ]);

      setFlashcards(lessonFlashcards);
      setQuizzes(lessonQuizzes);
      if (progressList.length > 0) {
        setLessonProgress(progressList[0]);
        setQuizCompleted(progressList[0].quiz_attempts > 0);
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
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
  };

  const handleAnswer = (option) => {
    if (showResult) return;
    setSelectedAnswer(option);
    const isCorrect = option === quizzes[currentQuestion].correct_answer;
    
    setShowResult(true);
    const newScore = isCorrect ? score + 1 : score;
    setScore(newScore);
    setAnswers([...answers, {
      question: quizzes[currentQuestion].question,
      selected: option,
      correct: quizzes[currentQuestion].correct_answer,
      isCorrect
    }]);
  };

  const nextQuestion = () => {
    if (currentQuestion + 1 < quizzes.length) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz complete
      finishQuiz(answers.length > 0 ? (score / quizzes.length) * 100 : 0);
    }
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
      setLessonProgress(prev => ({ ...prev, quiz_attempts: (prev?.quiz_attempts || 0) + 1, best_score: Math.max(prev?.best_score || 0, finalScore), last_score: finalScore }));
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
              <span className="text-xs text-green-600 font-medium ml-0.5">{lessonProgress.best_score}%</span>
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
                No quiz available for this lesson.
              </div>
            ) : !quizStarted ? (
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Play className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900">Lesson Quiz</h3>
                <p className="text-slate-600">{quizzes.length} questions to test your knowledge</p>
                {lessonProgress && lessonProgress.quiz_attempts > 0 && (
                  <p className="text-sm text-slate-500">
                    Previous best: {lessonProgress.best_score}% ({lessonProgress.quiz_attempts} attempt{lessonProgress.quiz_attempts > 1 ? 's' : ''})
                  </p>
                )}
                <Button onClick={startQuiz} className="bg-blue-600 hover:bg-blue-700">
                  Start Quiz
                </Button>
              </div>
            ) : currentQuestion < quizzes.length ? (
              <div className="space-y-6">
                {/* Progress */}
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Question {currentQuestion + 1} of {quizzes.length}</span>
                  <span>Score: {score}/{currentQuestion + (showResult ? 1 : 0)}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${((currentQuestion + (showResult ? 1 : 0)) / quizzes.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {quizzes[currentQuestion].question}
                  </h3>
                  <div className="space-y-2">
                    {quizzes[currentQuestion].options.map((option, idx) => {
                      let btnClass = "w-full text-left p-3 rounded-lg border transition-colors ";
                      if (!showResult) {
                        btnClass += "hover:bg-blue-50 hover:border-blue-300 cursor-pointer";
                      } else if (option === quizzes[currentQuestion].correct_answer) {
                        btnClass += "bg-green-50 border-green-500 text-green-800";
                      } else if (option === selectedAnswer && option !== quizzes[currentQuestion].correct_answer) {
                        btnClass += "bg-red-50 border-red-500 text-red-800";
                      } else {
                        btnClass += "opacity-60";
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => handleAnswer(option)}
                          disabled={showResult}
                          className={btnClass}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Result feedback */}
                {showResult && (
                  <div className={`p-4 rounded-lg ${
                    selectedAnswer === quizzes[currentQuestion].correct_answer
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      {selectedAnswer === quizzes[currentQuestion].correct_answer ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className={`font-semibold ${
                        selectedAnswer === quizzes[currentQuestion].correct_answer
                          ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {selectedAnswer === quizzes[currentQuestion].correct_answer ? 'Correct!' : 'Incorrect'}
                      </span>
                    </div>
                    {quizzes[currentQuestion].explanation && (
                      <p className="text-sm text-slate-700 mt-1">
                        {quizzes[currentQuestion].explanation}
                      </p>
                    )}
                  </div>
                )}

                {showResult && (
                  <div className="flex justify-end">
                    <Button onClick={nextQuestion} className="bg-blue-600 hover:bg-blue-700">
                      {currentQuestion + 1 < quizzes.length ? 'Next Question' : 'See Results'}
                    </Button>
                  </div>
                )}
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
                <h3 className="text-xl font-semibold text-slate-900">Quiz Complete!</h3>
                <p className="text-slate-600">
                  You got {score} out of {quizzes.length} correct
                </p>

                {/* Answer review */}
                <div className="text-left space-y-3 mt-6 max-w-lg mx-auto">
                  {answers.map((answer, idx) => (
                    <div key={idx} className={`p-3 rounded-lg border ${
                      answer.isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                    }`}>
                      <div className="flex items-start gap-2">
                        {answer.isCorrect ? (
                          <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-900">{answer.question}</p>
                          <p className="text-xs text-slate-600 mt-1">
                            Your answer: <span className={answer.isCorrect ? 'text-green-700' : 'text-red-700'}>{answer.selected}</span>
                          </p>
                          {!answer.isCorrect && (
                            <p className="text-xs text-green-700 mt-0.5">
                              Correct: {answer.correct}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-4">
                  {!flashcardsViewed && flashcards.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      Review the flashcards tab before marking this lesson complete.
                    </div>
                  )}
                  <div className="flex justify-center gap-3">
                    <Button variant="outline" onClick={startQuiz}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Retry Quiz
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