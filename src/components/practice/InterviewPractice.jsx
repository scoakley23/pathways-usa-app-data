import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Volume2, ArrowRight, Check, X, Loader2, MessageSquare } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { base44 } from '@/api/base44Client';
import { speakText } from "@/components/utils/textToSpeech";
import { toast } from "sonner";

export default function InterviewPractice({ onComplete, onNext }) {
  // All hooks must be declared first, before any conditional returns
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [score, setScore] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  
  const recognitionRef = useRef(null);
  const responseRef = useRef('');

  useEffect(() => {
    const init = async () => {
      await loadQuestions();
      initializeSpeechRecognition();
    };
    init();
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const allQuestions = await base44.entities.InterviewQuestion.list('-order', 100);
      
      // Select mix of questions from different sections
      const smallTalk = allQuestions.filter(q => q.section === 'small_talk').slice(0, 3);
      const personalInfo = allQuestions.filter(q => q.section === 'personal_info').slice(0, 4);
      const moralsEthics = allQuestions.filter(q => q.section === 'morals_ethics').slice(0, 6);
      const oathReqs = allQuestions.filter(q => q.section === 'oath_requirements');
      
      const selected = [...smallTalk, ...personalInfo, ...moralsEthics, ...oathReqs];
      setQuestions(selected);
    } catch (error) {
      console.error('Failed to load questions:', error);
      toast.error('Failed to load questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const initializeSpeechRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setUserResponse('');
        responseRef.current = '';
      };

      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        setUserResponse(transcript);
        responseRef.current = transcript;
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  };

  const speakQuestion = () => {
    if (questions[currentIndex]) {
      speakText(questions[currentIndex].question, 'en', { randomVoice: true });
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserResponse('');
      setFeedback(null);
      responseRef.current = '';
      recognitionRef.current.start();
    }
  };

  const analyzeResponse = async () => {
    const response = responseRef.current || userResponse;
    if (!response.trim()) {
      toast.error('Please provide a response first');
      return;
    }

    setIsAnalyzing(true);
    const currentQ = questions[currentIndex];

    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an experienced USCIS citizenship interview officer and ESL instructor evaluating a candidate's response.

QUESTION: "${currentQ.question}"
EXPECTED RESPONSE: "${currentQ.expected_response}"
CANDIDATE'S RESPONSE: "${response}"
RESPONSE TYPE: ${currentQ.response_type}

Provide comprehensive feedback on 4 dimensions:

1. CONTENT ACCEPTABILITY:
   - For open_ended: Any reasonable, coherent answer showing understanding is acceptable
   - For yes_no: Must be clear yes/no with appropriate context
   - For specific_answer: Must contain key information from expected response

2. PRONUNCIATION & CLARITY:
   - Analyze word clarity based on the transcribed text
   - Note any potential pronunciation issues common for non-native speakers (e.g., th/s/z sounds, -ed endings, stress patterns)
   - Comment on overall clarity and understandability

3. GRAMMAR & SENTENCE STRUCTURE:
   - Identify any grammatical errors (subject-verb agreement, tense usage, article usage, etc.)
   - Note common ESL errors like missing articles, incorrect prepositions, or word order issues
   - Assess sentence completeness and coherence

4. FLUENCY & NATURALNESS:
   - Evaluate how natural and conversational the response sounds
   - Comment on sentence flow and transitions
   - Note if the response sounds memorized vs. conversational

Be encouraging but specific. Give actionable advice for improvement.`,
        response_json_schema: {
          type: "object",
          properties: {
            is_acceptable: { type: "boolean" },
            score: { type: "number", description: "0-100" },
            content_feedback: { type: "string", description: "Feedback on content accuracy and completeness" },
            pronunciation_feedback: { type: "string", description: "Specific feedback on pronunciation and clarity issues" },
            grammar_feedback: { type: "string", description: "Grammar errors and corrections with examples" },
            fluency_feedback: { type: "string", description: "Feedback on natural flow and conversational quality" },
            common_esl_mistakes: { type: "string", description: "Common mistakes non-native speakers make with this type of question" },
            improvement_tips: { type: "string", description: "Specific actionable suggestions for improvement" },
            corrected_version: { type: "string", description: "An improved version of their response" }
          }
        }
      });

      setFeedback(result);
      if (result.is_acceptable) {
        setScore(prev => prev + 1);
      }
    } catch (error) {
      console.error('Analysis failed', error);
      toast.error('Failed to analyze response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setUserResponse('');
      setFeedback(null);
      responseRef.current = '';
    } else {
      onComplete(score >= questions.length * 0.7);
    }
  };

  const handleSkip = () => {
    setFeedback({
      is_acceptable: false,
      score: 0,
      content_feedback: "Question skipped - practice this type of question more.",
      improvement_tips: questions[currentIndex]?.tips || "Review the expected response and try again later.",
      common_esl_mistakes: "Skipping questions during the interview is not recommended. Practice answering every question, even if you need to ask for clarification."
    });
  };

  if (isLoadingQuestions) {
    return (
      <Card className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-indigo-600" />
        <p className="text-slate-600">Loading interview questions...</p>
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-slate-600 mb-4">No interview questions found. Please contact admin to add questions.</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Reload Page
        </Button>
      </Card>
    );
  }

  if (!sessionStarted) {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-0 shadow-xl">
          <CardContent className="p-12 text-center space-y-6">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-3">Mock Interview Practice</h2>
              <p className="text-lg text-slate-600 max-w-xl mx-auto">
                Practice for your citizenship interview with realistic questions from all sections of the N-400 interview
              </p>
            </div>

            <div className="bg-white rounded-xl p-6 max-w-md mx-auto text-left space-y-3">
              <h3 className="font-bold text-slate-900 mb-2">What to expect:</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <p>✓ Small talk and basic questions</p>
                <p>✓ Personal information verification</p>
                <p>✓ Morals and ethics questions</p>
                <p>✓ Oath of allegiance questions</p>
                <p>✓ AI-powered feedback on your answers</p>
              </div>
            </div>

            <Button 
              onClick={() => {
                setSessionStarted(true);
                setTimeout(() => speakQuestion(), 500);
              }}
              size="lg"
              className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg"
            >
              Start Interview
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      {/* Progress */}
      <div className="bg-white rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-700">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span className="text-sm text-slate-500">Score: {score}/{questions.length}</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Question Card */}
      <Card className="bg-white shadow-xl border-0">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        
        <CardContent className="p-8 md:p-12">
          <div className="space-y-8">
            {/* Section Badge */}
            <div className="flex items-center justify-between">
              <span className="inline-block px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
                {currentQuestion.section.replace('_', ' ')}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={speakQuestion}
                className="text-indigo-600 hover:text-indigo-700"
              >
                <Volume2 className="w-4 h-4 mr-1" /> Hear Question
              </Button>
            </div>

            {/* Question */}
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                {currentQuestion.question}
              </h3>
              {currentQuestion.tips && !feedback && (
                <p className="text-sm text-slate-500 mt-3 italic">💡 Tip: {currentQuestion.tips}</p>
              )}
            </div>

            {/* Response Area */}
            <div className="min-h-[200px] flex flex-col justify-center items-center bg-slate-50 rounded-xl p-6">
              {isAnalyzing ? (
                <div className="text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
                  <p className="text-slate-600 font-medium">Evaluating your response...</p>
                </div>
              ) : feedback ? (
                <div className="w-full space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      feedback.is_acceptable ? 'bg-green-100' : 'bg-orange-100'
                    }`}>
                      {feedback.is_acceptable ? 
                        <Check className="w-7 h-7 text-green-600" /> : 
                        <X className="w-7 h-7 text-orange-600" />
                      }
                    </div>
                    <div>
                      <p className="font-bold text-lg text-slate-900">
                        {feedback.is_acceptable ? 'Good Answer!' : 'Practice More'}
                      </p>
                      <p className="text-sm text-slate-600">Score: {feedback.score}/100</p>
                    </div>
                  </div>
                  
                  {/* Simple Summary - Easy to read */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 p-5 rounded-xl">
                    <h4 className="font-bold text-indigo-900 mb-3 text-base flex items-center gap-2">
                      📋 Quick Summary
                    </h4>
                    <div className="space-y-3 text-base leading-relaxed">
                      {feedback.content_feedback && (
                        <div>
                          <span className="inline-block w-6 h-6 rounded-full bg-blue-500 text-white text-center leading-6 mr-2 shrink-0">✓</span>
                          <span className="text-slate-800">{feedback.content_feedback.split('.')[0]}.</span>
                        </div>
                      )}
                      {feedback.corrected_version && (
                        <div className="mt-3 pt-3 border-t border-indigo-200">
                          <p className="text-sm font-bold text-indigo-900 mb-2">Better way to say it:</p>
                          <p className="text-base text-slate-700 bg-white p-3 rounded-lg italic">"{feedback.corrected_version}"</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Full Details */}
                  <details className="group">
                    <summary className="cursor-pointer list-none">
                      <div className="flex items-center justify-between bg-slate-100 hover:bg-slate-200 p-4 rounded-lg transition-colors">
                        <span className="font-semibold text-slate-700">📖 Read All Details</span>
                        <ArrowRight className="w-5 h-5 text-slate-500 group-open:rotate-90 transition-transform" />
                      </div>
                    </summary>

                    <div className="mt-4 space-y-3">
                      {/* Pronunciation Feedback */}
                      {feedback.pronunciation_feedback && (
                        <div className="bg-white p-4 rounded-lg border-l-4 border-purple-500">
                          <p className="text-sm font-semibold text-purple-900 mb-1 flex items-center gap-2">
                            <span>🗣️</span> How You Sound
                          </p>
                          <p className="text-sm text-slate-700">{feedback.pronunciation_feedback}</p>
                        </div>
                      )}

                      {/* Grammar Feedback */}
                      {feedback.grammar_feedback && (
                        <div className="bg-white p-4 rounded-lg border-l-4 border-indigo-500">
                          <p className="text-sm font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                            <span>📖</span> Grammar
                          </p>
                          <p className="text-sm text-slate-700">{feedback.grammar_feedback}</p>
                        </div>
                      )}

                      {/* Fluency Feedback */}
                      {feedback.fluency_feedback && (
                        <div className="bg-white p-4 rounded-lg border-l-4 border-teal-500">
                          <p className="text-sm font-semibold text-teal-900 mb-1 flex items-center gap-2">
                            <span>💬</span> How Natural It Sounds
                          </p>
                          <p className="text-sm text-slate-700">{feedback.fluency_feedback}</p>
                        </div>
                      )}

                      {/* Improvement Tips */}
                      {feedback.improvement_tips && (
                        <div className="bg-indigo-50 p-4 rounded-lg border-2 border-indigo-200">
                          <p className="text-sm font-semibold text-indigo-900 mb-1 flex items-center gap-2">
                            <span>💡</span> What to Practice
                          </p>
                          <p className="text-sm text-indigo-800">{feedback.improvement_tips}</p>
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {feedback.common_esl_mistakes && (
                        <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                          <p className="text-sm font-semibold text-amber-900 mb-1 flex items-center gap-2">
                            <span>⚠️</span> Common Mistakes
                          </p>
                          <p className="text-sm text-slate-700">{feedback.common_esl_mistakes}</p>
                        </div>
                      )}
                    </div>
                  </details>

                  <div className="bg-slate-100 p-3 rounded-lg">
                    <p className="text-xs font-semibold text-slate-600 mb-1">Expected Response:</p>
                    <p className="text-sm text-slate-700 italic">{currentQuestion.expected_response}</p>
                  </div>
                </div>
              ) : userResponse ? (
                <div className="w-full">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Your Response:</p>
                  <p className="text-lg text-slate-800 bg-white p-4 rounded-lg border border-slate-200">
                    "{userResponse}"
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Mic className={`w-12 h-12 mx-auto mb-3 ${isListening ? 'text-red-500 animate-pulse' : 'text-slate-400'}`} />
                  <p className="text-slate-600">
                    {isListening ? 'Listening... Speak your answer' : 'Click microphone to respond'}
                  </p>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-col gap-3">
              {!feedback ? (
                <>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={toggleListening}
                      size="lg"
                      variant={isListening ? "destructive" : "default"}
                      className="min-w-[160px]"
                      disabled={isAnalyzing}
                    >
                      {isListening ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                      {isListening ? 'Stop' : 'Record Answer'}
                    </Button>

                    {userResponse && !isListening && (
                      <Button
                        onClick={analyzeResponse}
                        size="lg"
                        className="bg-indigo-600 hover:bg-indigo-700 min-w-[160px]"
                      >
                        Submit Answer
                      </Button>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    onClick={handleSkip}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Skip Question
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleNext}
                  size="lg"
                  className="bg-indigo-600 hover:bg-indigo-700 w-full"
                >
                  {currentIndex < questions.length - 1 ? (
                    <>Next Question <ArrowRight className="w-5 h-5 ml-2" /></>
                  ) : (
                    <>Complete Interview <Check className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}