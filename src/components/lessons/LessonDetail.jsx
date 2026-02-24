import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, CheckCircle, XCircle, RotateCcw, BookOpen, CreditCard, Brain, Globe, Volume2 } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FlashcardView from '@/components/lessons/FlashcardView';
import KeyPointsDisplay from '@/components/lessons/KeyPointsDisplay';
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';

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
  const [translatedContent, setTranslatedContent] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

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
    
    // Handle already embedded URLs
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=)([^&\s]+)/,
      /(?:youtube\.com\/embed\/)([^&\s]+)/,
      /(?:youtu\.be\/)([^&\s]+)/,
      /(?:youtube\.com\/v\/)([^&\s]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return `https://www.youtube.com/embed/${match[1]}`;
      }
    }
    
    return null;
  };

  const translateContent = async (language) => {
    if (language === 'en') {
      setTranslatedContent(null);
      setTargetLanguage('en');
      return;
    }

    setIsTranslating(true);
    try {
      const keyPointsText = lesson.key_points?.map(kp => typeof kp === 'string' ? kp : kp.text).join('\n') || '';
      
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Translate the following lesson content to ${language}. Maintain all markdown formatting, structure, and headings. Keep technical terms and proper nouns in English when appropriate.

Title: ${lesson.title}
Content: ${lesson.content}

Key Points:
${keyPointsText}`,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            content: { type: "string" },
            key_points: { type: "array", items: { type: "string" } }
          }
        }
      });

      setTranslatedContent(result);
      setTargetLanguage(language);
      toast.success('Content translated successfully');
    } catch (error) {
      console.error('Translation error:', error);
      toast.error('Failed to translate content');
    } finally {
      setIsTranslating(false);
    }
  };

  const speakContent = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      if (isSpeaking) {
        setIsSpeaking(false);
        return;
      }

      const cleanText = text.replace(/#{1,6}\s/g, '').replace(/\[.*?\]/g, '').replace(/!\[.*?\]\(.*?\)/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      
      // Use Samantha voice if available
      const voices = window.speechSynthesis.getVoices();
      const samanthaVoice = voices.find(v => v.name.includes('Samantha'));
      if (samanthaVoice) {
        utterance.voice = samanthaVoice;
      } else {
        const googleVoice = voices.find(v => v.name === 'Google US English');
        if (googleVoice) {
          utterance.voice = googleVoice;
        }
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    } else {
      toast.error('Text-to-speech not supported in your browser');
    }
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
  
  const displayContent = translatedContent || { 
    title: lesson.title,
    content: lesson.content,
    key_points: lesson.key_points
  };

  // Quiz completed screen
  if (quizCompleted) {
    const percentage = Math.round((score / quizQuestions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-2 shadow-lg">
          <CardContent className="p-12 text-center space-y-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto ${passed ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {passed ? (
                <CheckCircle className="w-12 h-12 text-green-600" />
              ) : (
                <AlertCircle className="w-12 h-12 text-yellow-600" />
              )}
            </div>

            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                {passed ? 'Great Job!' : 'Good Effort!'}
              </h2>
              <p className="text-slate-600 text-lg">
                You scored {score} out of {quizQuestions.length} ({percentage}%)
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border-2 border-blue-300">
              <Progress value={percentage} className="h-3 mb-3" />
              <p className={`font-semibold ${passed ? 'text-green-700' : 'text-yellow-700'}`}>
                {passed ? 'You passed the quiz!' : 'Review the material and try again'}
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
          </CardContent>
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

            {showResult && (
              <div>
                {selectedAnswer === currentQuestion.correct_answer ? (
                  <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                    <p className="text-green-800 font-semibold">Correct!</p>
                    {currentQuestion.explanation && (
                      <p className="text-green-700 mt-2 text-sm">{currentQuestion.explanation}</p>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                    <p className="text-red-800 font-semibold">Incorrect</p>
                    <p className="text-red-700 mt-1 text-sm">The correct answer is: <strong>{currentQuestion.correct_answer}</strong></p>
                    {currentQuestion.explanation && (
                      <p className="text-red-700 mt-2 text-sm">{currentQuestion.explanation}</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <Button 
              onClick={handleNext} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-12"
              disabled={!showResult}
            >
              {currentQuestionIndex === quizQuestions.length - 1 ? 'See Results' : 'Next Question'}
              {currentQuestionIndex < quizQuestions.length - 1 && <ArrowRight className="w-4 h-4 ml-2" />}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button onClick={onBack} variant="ghost">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Lessons
      </Button>

      <Card className="border-2 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-slate-900">{lesson.title}</h1>
            <p className="text-slate-600 text-lg">{lesson.description}</p>
            
            {targetLanguage !== 'en' && (
              <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium">
                <Globe className="w-4 h-4" />
                Viewing in {['es', 'ar', 'am', 'pt', 'zh', 'vi', 'fr'].includes(targetLanguage) ? 
                  ({es: 'Spanish', ar: 'Arabic', am: 'Amharic', pt: 'Portuguese', zh: 'Chinese', vi: 'Vietnamese', fr: 'French'}[targetLanguage]) : 
                  targetLanguage}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
              <div className="flex gap-2">
                <Select value={targetLanguage} onValueChange={translateContent}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Translate..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="ar">Arabic</SelectItem>
                    <SelectItem value="am">Amharic</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="vi">Vietnamese</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button 
                onClick={() => speakContent(displayContent.content)}
                size="sm"
                className="shrink-0"
                title="Listen to lesson"
              >
                <Volume2 className={`w-5 h-5 ${isSpeaking ? 'text-blue-600 animate-pulse' : ''}`} />
              </Button>
            </div>
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
                <div className="aspect-video rounded-xl overflow-hidden shadow-lg bg-slate-900 border-2 border-slate-200">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {isTranslating && (
                <div className="flex items-center justify-center p-8 bg-blue-50 rounded-lg border-2 border-blue-200">
                  <div className="animate-spin w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full mr-3" />
                  <span className="text-blue-700 font-medium">Translating content...</span>
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-slate prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <h2 className="text-2xl font-bold text-slate-900 mt-8 mb-4 border-b-2 border-slate-200 pb-2">{children}</h2>,
                    h3: ({ children }) => <h3 className="text-xl font-semibold text-slate-800 mt-6 mb-3">{children}</h3>,
                    p: ({ children }) => <p className="text-slate-700 leading-relaxed mb-4 text-lg">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-2 mb-4 ml-4">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 mb-4 ml-4">{children}</ol>,
                    li: ({ children }) => <li className="text-slate-700 leading-relaxed">{children}</li>,
                    strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
                    em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-slate-600 my-6 bg-blue-50 py-2 rounded-r-lg">
                        {children}
                      </blockquote>
                    ),
                    img: ({ src, alt }) => (
                      <img src={src} alt={alt} className="rounded-xl shadow-lg my-6 w-full object-cover max-h-96 border-2 border-slate-200" />
                    ),
                    code: ({ inline, children }) => 
                      inline ? (
                        <code className="bg-slate-100 text-slate-800 px-2 py-1 rounded text-sm">{children}</code>
                      ) : (
                        <code className="block bg-slate-100 text-slate-800 p-4 rounded-lg my-4">{children}</code>
                      )
                  }}
                >
                  {displayContent.content}
                </ReactMarkdown>
              </div>

              {/* Key Points */}
              <KeyPointsDisplay keyPoints={displayContent.key_points} />

              {quizQuestions.length > 0 && (
                <Button 
                  onClick={() => setShowQuiz(true)} 
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 h-14 text-lg"
                  size="lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Take Practice Quiz ({quizQuestions.length} Questions)
                </Button>
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

import { AlertCircle } from 'lucide-react';
import { ArrowRight } from 'lucide-react';