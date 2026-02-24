import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, CheckCircle, XCircle, RotateCcw, BookOpen, CreditCard, Brain } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import FlashcardView from '@/components/lessons/FlashcardView';
import { toast } from "sonner";

export default function LessonDetail({ lesson, onBack, onComplete }) {
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('lesson');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      // Mark lesson as viewed
      if (currentUser?.email) {
        updateProgress(currentUser.email, { completed: true });
      }
    } catch (error) {
      console.error('Not authenticated');
    }
  };

  useEffect(() => {
    loadFlashcards();
  }, [lesson.id]);

  useEffect(() => {
    if (showQuiz && quizQuestions.length === 0) {
      loadQuizQuestions();
    }
  }, [showQuiz]);

  const loadFlashcards = async () => {
    try {
      const cards = await base44.entities.LessonFlashcard.list({ 
        query: { lesson_id: lesson.id },
        limit: 100
      });
      setFlashcards(cards);
    } catch (error) {
      console.error('Failed to load flashcards:', error);
    }
  };

  const loadQuizQuestions = async () => {
    try {
      setLoading(true);
      const questions = await base44.entities.LessonQuiz.list({ 
        query: { lesson_id: lesson.id },
        limit: 100
      });
      setQuizQuestions(questions);
    } catch (error) {
      console.error('Failed to load quiz:', error);
      toast.error('Failed to load quiz questions');
    } finally {
      setLoading(false);
    }
  };

  const getYoutubeEmbedUrl = (url) => {
    if (!url) return null;
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const handleAnswerSelect = (answer) => {
    setSelectedAnswer(answer);
    setShowResult(true);
    
    const isCorrect = answer === quizQuestions[currentQuestionIndex].correct_answer;
    if (isCorrect) {
      setScore(score + 1);
    }
  };

  const updateProgress = async (userEmail, updates) => {
    if (!userEmail) return;

    try {
      const existing = await base44.entities.LessonProgress.list({
        query: { user_email: userEmail, lesson_id: lesson.id },
        limit: 1
      });

      if (existing.length > 0) {
        await base44.entities.LessonProgress.update(existing[0].id, updates);
      } else {
        await base44.entities.LessonProgress.create({
          user_email: userEmail,
          lesson_id: lesson.id,
          topic: lesson.topic,
          ...updates
        });
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Save quiz results
      const percentage = Math.round((score / quizQuestions.length) * 100);
      if (user?.email) {
        const existing = base44.entities.LessonProgress.list({
          query: { user_email: user.email, lesson_id: lesson.id },
          limit: 1
        }).then(res => {
          const current = res[0];
          const attempts = (current?.quiz_attempts || 0) + 1;
          const bestScore = Math.max(current?.best_score || 0, percentage);
          
          updateProgress(user.email, {
            quiz_attempts: attempts,
            best_score: bestScore,
            last_score: percentage,
            total_questions: quizQuestions.length,
            last_attempt_date: new Date().toISOString(),
            needs_review: percentage < 70
          });
        });
      }
      
      setQuizCompleted(true);
    }
  };

  const handleRetakeQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizCompleted(false);
  };

  const embedUrl = getYoutubeEmbedUrl(lesson.video_url);
  const currentQuestion = quizQuestions[currentQuestionIndex];
  const progressPercent = quizQuestions.length > 0 ? ((currentQuestionIndex + 1) / quizQuestions.length) * 100 : 0;

  if (showQuiz && quizCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="text-center p-8">
          <div className="space-y-6">
            <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
              passed ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {passed ? 
                <CheckCircle className="w-12 h-12 text-green-600" /> : 
                <XCircle className="w-12 h-12 text-orange-600" />
              }
            </div>
            
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {passed ? 'Great Job!' : 'Keep Practicing!'}
              </h2>
              <p className="text-lg text-slate-600">
                You scored {score} out of {quizQuestions.length} ({percentage}%)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleRetakeQuiz} variant="outline" size="lg">
                <RotateCcw className="w-5 h-5 mr-2" />
                Retake Quiz
              </Button>
              <Button onClick={onBack} size="lg" className="bg-blue-600 hover:bg-blue-700">
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Lessons
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (showQuiz && quizQuestions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Button onClick={() => setShowQuiz(false)} variant="ghost">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Lesson
        </Button>

        <Card>
          <CardHeader>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium text-slate-700">
                  Question {currentQuestionIndex + 1} of {quizQuestions.length}
                </span>
                <span className="text-slate-500">Score: {score}/{quizQuestions.length}</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <h3 className="text-xl font-bold text-slate-900">
              {currentQuestion.question}
            </h3>

            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedAnswer === option;
                const isCorrect = option === currentQuestion.correct_answer;
                const showCorrect = showResult && isCorrect;
                const showWrong = showResult && isSelected && !isCorrect;

                return (
                  <button
                    key={idx}
                    onClick={() => !showResult && handleAnswerSelect(option)}
                    disabled={showResult}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      showCorrect ? 'border-green-500 bg-green-50' :
                      showWrong ? 'border-red-500 bg-red-50' :
                      isSelected ? 'border-blue-500 bg-blue-50' :
                      'border-slate-200 hover:border-blue-300 bg-white'
                    } ${showResult ? 'cursor-default' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{option}</span>
                      {showCorrect && <CheckCircle className="w-5 h-5 text-green-600" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && currentQuestion.explanation && (
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-blue-900 mb-1">Explanation:</p>
                <p className="text-sm text-slate-700">{currentQuestion.explanation}</p>
              </div>
            )}

            {showResult && (
              <Button 
                onClick={handleNext}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {currentQuestionIndex < quizQuestions.length - 1 ? 'Next Question' : 'See Results'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button onClick={onBack} variant="ghost">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lessons
      </Button>

      {/* Lesson Content with Tabs */}
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <span className="text-sm font-semibold text-blue-600">{lesson.topic}</span>
            <CardTitle className="text-3xl">{lesson.title}</CardTitle>
            {lesson.description && (
              <p className="text-slate-600">{lesson.description}</p>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="lesson" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Lesson
              </TabsTrigger>
              <TabsTrigger value="flashcards" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Flashcards {flashcards.length > 0 && `(${flashcards.length})`}
              </TabsTrigger>
              <TabsTrigger value="quiz" className="flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Quiz {quizQuestions.length > 0 && `(${quizQuestions.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lesson" className="space-y-6">
              {/* Video */}
              {embedUrl && (
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg bg-slate-900">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-slate max-w-none">
                <div className="text-slate-700 leading-relaxed whitespace-pre-line">
                  {lesson.content}
                </div>
              </div>

              {/* Key Points */}
              {lesson.key_points && lesson.key_points.length > 0 && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">Key Points to Remember:</h3>
                  <ul className="space-y-2">
                    {lesson.key_points.map((point, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <span className="text-slate-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </TabsContent>

            <TabsContent value="flashcards" className="py-4">
              <FlashcardView flashcards={flashcards} />
            </TabsContent>

            <TabsContent value="quiz" className="py-4">
              <div className="text-center space-y-4">
                <p className="text-slate-600">
                  Test your understanding with {quizQuestions.length || 'practice'} questions
                </p>
                <Button 
                  onClick={() => setShowQuiz(true)}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700"
                  disabled={loading || quizQuestions.length === 0}
                >
                  {loading ? 'Loading Quiz...' : 
                   quizQuestions.length === 0 ? 'No Quiz Available' : 
                   'Start Quiz'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}