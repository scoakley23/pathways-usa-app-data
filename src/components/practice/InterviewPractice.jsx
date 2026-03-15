import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Mic, MicOff, Volume2, ArrowRight, Check, X, Loader2, MessageSquare, ChevronDown, ChevronUp, RotateCcw, FileText } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { speakText } from "@/components/utils/textToSpeech";
import { toast } from "sonner";
import InterviewReport from './InterviewReport';

export default function InterviewPractice({ onComplete, onNext }) {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [sessionResults, setSessionResults] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);

  const recognitionRef = useRef(null);
  const responseRef = useRef('');
  const analyzerRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    loadQuestions();
    initializeSpeechRecognition();
    return () => {
      stopAudioAnalysis();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const loadQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const all = await base44.entities.InterviewQuestion.list('-order', 100);
      const smallTalk = all.filter(q => q.section === 'small_talk').slice(0, 2);
      const personalInfo = all.filter(q => q.section === 'personal_info').slice(0, 3);
      const morals = all.filter(q => q.section === 'morals_ethics').slice(0, 4);
      const oath = all.filter(q => q.section === 'oath_requirements').slice(0, 3);
      setQuestions([...smallTalk, ...personalInfo, ...morals, ...oath]);
    } catch (e) {
      toast.error('Failed to load questions');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const initializeSpeechRecognition = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    recognitionRef.current = new SR();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';
    recognitionRef.current.onstart = () => { setIsListening(true); startTimer(); };
    recognitionRef.current.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setUserResponse(t);
      responseRef.current = t;
    };
    recognitionRef.current.onerror = () => { setIsListening(false); stopTimer(); stopAudioAnalysis(); };
    recognitionRef.current.onend = () => { setIsListening(false); stopTimer(); stopAudioAnalysis(); };
  };

  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyzer = ctx.createAnalyser();
      analyzer.fftSize = 256;
      src.connect(analyzer);
      analyzerRef.current = analyzer;
      const data = new Uint8Array(analyzer.frequencyBinCount);
      const tick = () => {
        analyzer.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAudioLevel(Math.min(100, avg * 2));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) { /* mic denied */ }
  };

  const stopAudioAnalysis = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    setAudioLevel(0);
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) { toast.error('Speech recognition not supported in this browser'); return; }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setUserResponse('');
      responseRef.current = '';
      setFeedback(null);
      await startAudioAnalysis();
      recognitionRef.current.start();
    }
  };

  const speakQuestion = () => {
    if (questions[currentIndex]) speakText(questions[currentIndex].question, 'en');
  };

  const analyzeResponse = async () => {
    const response = responseRef.current || userResponse;
    if (!response.trim()) { toast.error('Please record a response first'); return; }
    setIsAnalyzing(true);
    const q = questions[currentIndex];
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are an experienced USCIS citizenship interview officer and ESL instructor evaluating a naturalization candidate.

INTERVIEW QUESTION: "${q.question}"
EXPECTED RESPONSE: "${q.expected_response}"
CANDIDATE'S SPOKEN RESPONSE: "${response}"
RESPONSE TYPE: ${q.response_type}

Evaluate on 4 dimensions. Be honest but encouraging.

CONTENT (0-100): Does the answer address the question correctly and completely?
GRAMMAR (0-100): Are sentences grammatically correct? Note specific errors.
FLUENCY (0-100): Does it sound natural and conversational?
PRONUNCIATION NOTES: Based on the transcribed text, note any likely pronunciation issues for non-native speakers.

Also provide:
- A corrected/improved version of their response
- 2-3 specific, actionable improvement tips
- Whether this answer would pass the actual interview`,
        response_json_schema: {
          type: "object",
          properties: {
            content_score: { type: "number" },
            grammar_score: { type: "number" },
            fluency_score: { type: "number" },
            overall_score: { type: "number" },
            is_acceptable: { type: "boolean" },
            content_feedback: { type: "string" },
            grammar_feedback: { type: "string" },
            fluency_feedback: { type: "string" },
            pronunciation_notes: { type: "string" },
            corrected_version: { type: "string" },
            improvement_tips: { type: "string" }
          },
          required: ["content_score", "grammar_score", "fluency_score", "overall_score", "is_acceptable", "content_feedback", "grammar_feedback", "fluency_feedback", "corrected_version", "improvement_tips"]
        }
      });
      setFeedback(result);
      setSessionResults(prev => [...prev, {
        question: q.question,
        section: q.section,
        response,
        expected: q.expected_response,
        ...result
      }]);
    } catch (e) {
      toast.error('Failed to analyze response');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setUserResponse('');
      setFeedback(null);
      responseRef.current = '';
      setTimeout(speakQuestion, 600);
    } else {
      setShowReport(true);
      if (onComplete) onComplete(sessionResults.filter(r => r.is_acceptable).length >= questions.length * 0.7);
    }
  };

  const handleSkip = () => {
    setSessionResults(prev => [...prev, {
      question: questions[currentIndex].question,
      section: questions[currentIndex].section,
      response: '(skipped)',
      expected: questions[currentIndex].expected_response,
      content_score: 0, grammar_score: 0, fluency_score: 0, overall_score: 0,
      is_acceptable: false,
      content_feedback: 'Question was skipped.',
      grammar_feedback: '', fluency_feedback: '',
      corrected_version: questions[currentIndex].expected_response,
      improvement_tips: 'Practice answering every question during the interview.'
    }]);
    handleNext();
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserResponse('');
    setFeedback(null);
    setSessionResults([]);
    setShowReport(false);
    setSessionStarted(false);
    responseRef.current = '';
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (isLoadingQuestions) return (
    <Card className="p-12 text-center">
      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-indigo-600" />
      <p className="text-slate-600 font-medium">Loading interview questions...</p>
    </Card>
  );

  if (questions.length === 0) return (
    <Card className="p-12 text-center">
      <p className="text-slate-600 mb-4">No interview questions found.</p>
      <Button onClick={() => window.location.reload()} variant="outline">Reload</Button>
    </Card>
  );

  if (showReport) return (
    <InterviewReport
      results={sessionResults}
      questions={questions}
      onRestart={handleRestart}
    />
  );

  if (!sessionStarted) return <InterviewIntro questions={questions} onStart={() => { setSessionStarted(true); setTimeout(speakQuestion, 600); }} />;

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const sectionLabel = { small_talk: 'Small Talk', personal_info: 'Personal Info', morals_ethics: 'Morals & Ethics', oath_requirements: 'Oath Requirements' }[current.section] || current.section;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {/* Progress Bar */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-2 text-sm font-medium text-slate-600">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{sessionResults.filter(r => r.is_acceptable).length} passed so far</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex gap-1 mt-2">
          {questions.map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < sessionResults.length
                ? (sessionResults[i]?.is_acceptable ? 'bg-green-500' : 'bg-red-400')
                : i === currentIndex ? 'bg-indigo-400' : 'bg-slate-200'
            }`} />
          ))}
        </div>
      </div>

      {/* Question Card */}
      <Card className="bg-white shadow-xl border-0 overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <CardContent className="p-8 space-y-6">
          {/* Section + Hear */}
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-wide">
              {sectionLabel}
            </span>
            <Button variant="ghost" size="sm" onClick={speakQuestion} className="text-indigo-500 hover:text-indigo-700 gap-1.5">
              <Volume2 className="w-4 h-4" /> Hear Question
            </Button>
          </div>

          {/* Question Text */}
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 leading-snug">
            {current.question}
          </h3>
          {current.tips && !feedback && (
            <p className="text-sm text-slate-500 italic bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
              💡 {current.tips}
            </p>
          )}

          {/* Recording / Response Area */}
          <div className="min-h-[180px] flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-100 p-6">
            {isAnalyzing ? (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                  </div>
                </div>
                <p className="font-medium text-slate-700">Evaluating your response...</p>
                <p className="text-sm text-slate-400">AI is analyzing content, grammar & fluency</p>
              </div>
            ) : feedback ? (
              <FeedbackPanel feedback={feedback} response={userResponse} expected={current.expected_response} />
            ) : isListening ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-1 h-12">
                  {[...Array(20)].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 bg-indigo-500 rounded-full transition-all duration-75"
                      style={{ height: `${Math.max(8, Math.random() * audioLevel * 0.5 + audioLevel * 0.5)}px`, opacity: 0.6 + Math.random() * 0.4 }}
                    />
                  ))}
                </div>
                <p className="text-indigo-600 font-semibold animate-pulse">Recording... {formatTime(recordingTime)}</p>
                {userResponse && <p className="text-sm text-slate-600 italic text-center max-w-sm">"{userResponse}"</p>}
              </div>
            ) : userResponse ? (
              <div className="w-full text-center">
                <p className="text-xs font-bold text-slate-400 uppercase mb-2">Your Response</p>
                <p className="text-lg text-slate-800 bg-white p-4 rounded-xl border border-slate-200 italic">
                  "{userResponse}"
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Mic className="w-10 h-10" />
                <p className="font-medium">Tap the microphone to begin recording</p>
                <p className="text-sm">Speak clearly as you would in the real interview</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-3">
            {!feedback ? (
              <>
                <div className="flex gap-3">
                  <Button
                    onClick={toggleListening}
                    size="lg"
                    className={`h-14 w-14 rounded-full shadow-lg transition-all ${
                      isListening
                        ? 'bg-red-500 hover:bg-red-600 ring-4 ring-red-100'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'
                    }`}
                    disabled={isAnalyzing}
                  >
                    {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </Button>
                  {userResponse && !isListening && (
                    <Button
                      onClick={analyzeResponse}
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-700 px-6 rounded-xl"
                      disabled={isAnalyzing}
                    >
                      Evaluate Answer
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleSkip} className="text-slate-400 hover:text-slate-600 text-xs">
                  Skip this question
                </Button>
              </>
            ) : (
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 w-full rounded-xl h-12 text-base"
              >
                {currentIndex < questions.length - 1 ? (
                  <><ArrowRight className="w-5 h-5 mr-2" /> Next Question</>
                ) : (
                  <><FileText className="w-5 h-5 mr-2" /> See Full Report</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function FeedbackPanel({ feedback, response, expected }) {
  const [expanded, setExpanded] = useState(false);
  const passed = feedback.is_acceptable;

  const scoreColor = (s) => s >= 80 ? 'text-green-600' : s >= 60 ? 'text-yellow-600' : 'text-red-500';
  const barColor = (s) => s >= 80 ? 'bg-green-500' : s >= 60 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-2">
      {/* Pass/Fail + Overall */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white border border-slate-200">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${passed ? 'bg-green-100' : 'bg-orange-100'}`}>
          {passed ? <Check className="w-7 h-7 text-green-600" /> : <X className="w-7 h-7 text-orange-500" />}
        </div>
        <div className="flex-1">
          <p className="font-bold text-lg text-slate-900">{passed ? 'Good Answer!' : 'Needs Practice'}</p>
          <p className="text-sm text-slate-500">{passed ? 'This would pass in a real interview.' : 'Review the feedback below.'}</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${scoreColor(feedback.overall_score)}`}>{feedback.overall_score}</p>
          <p className="text-xs text-slate-400">/ 100</p>
        </div>
      </div>

      {/* Score Bars */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Content', score: feedback.content_score },
          { label: 'Grammar', score: feedback.grammar_score },
          { label: 'Fluency', score: feedback.fluency_score },
        ].map(({ label, score }) => (
          <div key={label} className="bg-white rounded-xl p-3 border border-slate-100 text-center">
            <p className={`text-2xl font-bold ${scoreColor(score)}`}>{score}</p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 my-1.5">
              <div className={`h-1.5 rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-xs text-slate-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* Corrected Version */}
      {feedback.corrected_version && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
          <p className="text-xs font-bold text-indigo-600 uppercase tracking-wide mb-1">Better Way to Say It</p>
          <p className="text-slate-800 italic">"{feedback.corrected_version}"</p>
        </div>
      )}

      {/* Expandable Details */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between bg-slate-100 hover:bg-slate-200 px-4 py-3 rounded-xl transition-colors text-sm font-semibold text-slate-700"
      >
        <span>📖 Detailed Feedback</span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
          {[
            { emoji: '✅', color: 'border-blue-400', title: 'Content', text: feedback.content_feedback },
            { emoji: '📖', color: 'border-indigo-400', title: 'Grammar', text: feedback.grammar_feedback },
            { emoji: '💬', color: 'border-purple-400', title: 'Fluency', text: feedback.fluency_feedback },
            feedback.pronunciation_notes && { emoji: '🗣️', color: 'border-teal-400', title: 'Pronunciation Notes', text: feedback.pronunciation_notes },
            { emoji: '💡', color: 'border-amber-400', title: 'Tips to Improve', text: feedback.improvement_tips },
          ].filter(Boolean).map(({ emoji, color, title, text }) => (
            <div key={title} className={`bg-white p-4 rounded-xl border-l-4 ${color} shadow-sm`}>
              <p className="text-sm font-bold text-slate-700 mb-1">{emoji} {title}</p>
              <p className="text-sm text-slate-600 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InterviewIntro({ questions, onStart }) {
  const sections = [...new Set(questions.map(q => q.section))];
  const sectionNames = { small_talk: 'Small Talk', personal_info: 'Personal Information', morals_ethics: 'Morals & Ethics', oath_requirements: 'Oath Requirements' };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 border-0 shadow-xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
        <CardContent className="p-10 text-center space-y-8">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg">
            <MessageSquare className="w-10 h-10 text-white" />
          </div>

          <div>
            <h2 className="text-4xl font-bold text-slate-900 mb-3">Mock Interview</h2>
            <p className="text-lg text-slate-500 max-w-md mx-auto">
              Practice your citizenship interview with AI-powered feedback on every answer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-left max-w-sm mx-auto">
            {[
              { icon: '🎤', text: `${questions.length} questions across ${sections.length} sections` },
              { icon: '🤖', text: 'Real-time AI evaluation' },
              { icon: '📊', text: 'Content, grammar & fluency scores' },
              { icon: '📋', text: 'Full report at the end' },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
                <span className="text-lg">{icon}</span>
                <p className="text-sm text-slate-700 font-medium">{text}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl p-4 border border-slate-100 text-left max-w-sm mx-auto">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Sections Covered</p>
            <div className="space-y-1">
              {sections.map(s => (
                <div key={s} className="flex items-center gap-2 text-sm text-slate-700">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  {sectionNames[s] || s}
                </div>
              ))}
            </div>
          </div>

          <Button onClick={onStart} size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-12 text-lg rounded-2xl shadow-lg shadow-indigo-200">
            Start Interview
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}