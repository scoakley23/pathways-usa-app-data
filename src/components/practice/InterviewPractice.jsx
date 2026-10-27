import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { cardOutcome } from '@/lib/practiceResults';
import { Eyebrow, Poster, PrimaryButton, RaisedCard, RuledPaper, SecondaryButton, Tag, posterBigButton, posterLink, posterSolid, posterTone, posterTool } from '@/components/pathways/ui';
import { Link } from 'react-router-dom';
import { Mic, MicOff, Volume2, ArrowRight, Check, Loader2, ChevronDown, ChevronUp, FileText, Bot, BarChart3 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { speakText, stopSpeaking, getRandomVoice } from "@/components/utils/textToSpeech";
import { toast } from "sonner";
import InterviewReport from './InterviewReport';
import { evaluateInterviewAnswer, evaluateUnderstanding, isUnderstandingSection } from './evaluateInterviewAnswer';
import InterviewHistory from './InterviewHistory';
import VirtualInterviewer, { AVATAR_URL } from './VirtualInterviewer';
import PreInterviewQuestion from '@/components/pilot/PreInterviewQuestion';
import { loadMyCheckIns } from '@/components/pilot/checkInData';
import { loadPreInterviewSkip } from '@/lib/pilot';
import { shouldAskPreInterview } from '../../../base44/shared/pilotCheckIns.js';

// Long text is now spoken in chunks, so the fallback timeout must cover all of them.
const speechTimeoutMs = (text) => {
  const chunks = Math.max(1, Math.ceil((text || '').length / 200));
  return 15000 + (chunks - 1) * 10000;
};

// `rehearsal` ({ onFinish }) is for Interview Day: start right away, save
// nothing, and hand the results to onFinish instead of showing the report.
// Questions about the learner's own history (isUnderstandingSection) are never
// answered: the learner says what the question is asking, and only that
// understanding is checked (evaluateUnderstanding).
export default function InterviewPractice({ onComplete, onNext, rehearsal = null }) {
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

  // Conversational UI state
  const [interviewerState, setInterviewerState] = useState('idle');
  const [conversation, setConversation] = useState([]);
  const [showTyping, setShowTyping] = useState(false);
  const [varyOfficer, setVaryOfficer] = useState(false);
  // Pilot: "How ready do you feel?" once before a Mock Interview when the
  // learner's interview is scheduled. Never in Interview Day (rehearsal).
  const [pilot, setPilot] = useState(null); // { email, rows }
  const [askingReady, setAskingReady] = useState(false);

  const standardQuestionsRef = useRef([]);
  // Guards against the greeting's speech-end and safety-timer paths both
  // scheduling the same question (which made it appear twice in the chat).
  const lastPresentedRef = useRef(null);

  const recognitionRef = useRef(null);
  const responseRef = useRef('');
  const analyzerRef = useRef(null);
  const animFrameRef = useRef(null);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const transcriptRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const officerVoiceRef = useRef(null);

  useEffect(() => {
    loadQuestions();
    initializeSpeechRecognition();
    return () => {
      stopAudioAnalysis();
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
  }, []);

  // Auto-scroll transcript to bottom
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [conversation, showTyping, isListening, isAnalyzing]);

  const loadQuestions = async () => {
    try {
      setIsLoadingQuestions(true);
      const all = await base44.entities.InterviewQuestion.list('-order', 100);
      const smallTalk = all.filter(q => q.section === 'small_talk').slice(0, 2);
      const personalInfo = all.filter(q => q.section === 'personal_info').slice(0, 3);
      const morals = all.filter(q => q.section === 'morals_ethics').slice(0, 4);
      const oath = all.filter(q => q.section === 'oath_requirements').slice(0, 3);
      const standard = [...smallTalk, ...personalInfo, ...morals, ...oath];
      standardQuestionsRef.current = standard;
      setQuestions(standard);
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
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    const resetSilenceTimer = () => {
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (recognitionRef.current) {
          try { recognitionRef.current.stop(); } catch (e) {}
        }
      }, 12000);
    };

    recognitionRef.current.onstart = () => { setIsListening(true); startTimer(); resetSilenceTimer(); };
    recognitionRef.current.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setUserResponse(t);
      responseRef.current = t;
      resetSilenceTimer();
    };
    recognitionRef.current.onerror = () => {
      setIsListening(false); stopTimer(); stopAudioAnalysis();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
    recognitionRef.current.onend = () => {
      setIsListening(false); stopTimer(); stopAudioAnalysis();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
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
      stopSpeaking();
      setInterviewerState('listening');
      setUserResponse('');
      responseRef.current = '';
      setFeedback(null);
      await startAudioAnalysis();
      recognitionRef.current.start();
    }
  };

  const presentQuestion = (index) => {
    const q = questions[index];
    if (!q) return;
    if (lastPresentedRef.current === index) return;
    lastPresentedRef.current = index;

    setUserResponse('');
    setFeedback(null);
    responseRef.current = '';
    setShowTyping(true);
    setInterviewerState('idle');

    const enteringUnderstanding = isUnderstandingSection(q) && !isUnderstandingSection(questions[index - 1]);
    const intro = enteringUnderstanding
      ? "The next questions are about your application. Don't answer them here. Tell me in your own words what each question is asking."
      : q.intro;

    setTimeout(() => {
      const spoken = intro ? `${intro} ${q.question}` : q.question;
      setShowTyping(false);
      setConversation(prev => [...prev, { role: 'interviewer', text: spoken, id: `q_${index}` }]);
      setInterviewerState('speaking');
      speakText(spoken, 'en', {
        voiceName: officerVoiceRef.current || undefined,
        onStart: () => setInterviewerState('speaking'),
        onEnd: () => setInterviewerState('listening')
      });
      // Fallback in case TTS doesn't fire onEnd
      setTimeout(() => setInterviewerState(prev => prev === 'speaking' ? 'listening' : prev), speechTimeoutMs(spoken));
    }, 800);
  };

  const beginSession = async (greeting) => {
    setSessionStarted(true);
    lastPresentedRef.current = null;
    if (varyOfficer) {
      officerVoiceRef.current = await getRandomVoice('en');
    } else {
      officerVoiceRef.current = null;
    }
    setConversation([{ role: 'interviewer', text: greeting, id: 'greeting' }]);
    setInterviewerState('speaking');
    speakText(greeting, 'en', {
      voiceName: officerVoiceRef.current || undefined,
      onStart: () => setInterviewerState('speaking'),
      onEnd: () => {
        setInterviewerState('idle');
        setTimeout(() => presentQuestion(0), 400);
      }
    });
    setTimeout(() => {
      setInterviewerState(prev => {
        if (prev === 'speaking') {
          setTimeout(() => presentQuestion(0), 400);
          return 'idle';
        }
        return prev;
      });
    }, speechTimeoutMs(greeting));
  };

  const startInterview = () => beginSession("Good morning! Welcome to your citizenship interview. Let's get started.");

  useEffect(() => {
    if (rehearsal) return;
    let active = true;
    base44.auth.me()
      .then(async (u) => {
        const rows = await loadMyCheckIns(u.email);
        if (active) setPilot({ email: u.email, rows });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [rehearsal]);

  const handleStart = () => {
    if (!rehearsal && pilot && shouldAskPreInterview({ rows: pilot.rows, skippedAt: loadPreInterviewSkip() })) {
      setAskingReady(true);
      return;
    }
    startInterview();
  };

  // Interview Day starts as soon as the questions are loaded.
  useEffect(() => {
    if (rehearsal && !isLoadingQuestions && questions.length > 0 && !sessionStarted) {
      beginSession("Thank you. Please have a seat. Let's talk for a few minutes, and then I'll go over your application.");
    }
  }, [isLoadingQuestions]); // eslint-disable-line react-hooks/exhaustive-deps

  const speakQuestion = () => {
    const q = questions[currentIndex];
    if (!q) return;
    setInterviewerState('speaking');
    speakText(q.question, 'en', {
      voiceName: officerVoiceRef.current || undefined,
      onStart: () => setInterviewerState('speaking'),
      onEnd: () => setInterviewerState('listening')
    });
  };

  const analyzeResponse = async () => {
    const response = responseRef.current || userResponse;
    if (!response.trim()) { toast.error('Please record a response first'); return; }

    setConversation(prev => [...prev, { role: 'user', text: response, id: `u_${currentIndex}` }]);
    setInterviewerState('thinking');
    setIsAnalyzing(true);

    const q = questions[currentIndex];
    const understanding = isUnderstandingSection(q);
    try {
      const result = understanding ? await evaluateUnderstanding(q, response) : await evaluateInterviewAnswer(q, response);
      setFeedback(result);
      setInterviewerState('idle');
      setSessionResults(prev => [...prev, {
        question: q.question,
        section: q.section,
        response,
        expected: understanding ? null : q.expected_response,
        understanding,
        ...result
      }]);
    } catch (e) {
      toast.error('Failed to analyze response');
      setInterviewerState('listening');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveSession = async (results) => {
    try {
      const user = await base44.auth.me();
      const scored = results.filter(r => typeof r.overall_score === 'number');
      const overall = scored.length ? Math.round(scored.reduce((s, r) => s + r.overall_score, 0) / scored.length) : 0;
      const passedCount = results.filter(r => r.is_acceptable).length;
      await base44.entities.InterviewSession.create({
        user_email: user.email.toLowerCase().trim(),
        overall_score: overall,
        passed: passedCount >= questions.length * 0.7,
        question_count: questions.length,
        passed_count: passedCount,
        // Scores only: the learner's spoken answers (and the AI text built
        // from them) stay in memory for the report and are never saved.
        results: results.map(r => ({
          question: r.question,
          section: r.section,
          content_score: r.content_score,
          grammar_score: r.grammar_score,
          fluency_score: r.fluency_score,
          overall_score: r.overall_score,
          is_acceptable: r.is_acceptable
        }))
      });
    } catch (e) {
      console.error('Failed to save interview session', e);
    }
  };

  // `results` lets Skip pass the list that already includes the skipped question.
  const handleNext = (results = sessionResults) => {
    if (currentIndex < questions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      presentQuestion(nextIndex);
    } else if (rehearsal) {
      stopSpeaking();
      rehearsal.onFinish(results, questions.length);
    } else {
      setShowReport(true);
      saveSession(results);
      if (onComplete) onComplete(results.filter(r => r.is_acceptable).length >= questions.length * 0.7);
    }
  };

  const handleSkip = () => {
    const results = [...sessionResults, {
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
    }];
    setSessionResults(results);
    handleNext(results);
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setUserResponse('');
    setFeedback(null);
    setSessionResults([]);
    setShowReport(false);
    setSessionStarted(false);
    setConversation([]);
    setInterviewerState('idle');
    responseRef.current = '';
    lastPresentedRef.current = null;
    setQuestions(standardQuestionsRef.current);
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  if (isLoadingQuestions) return (
    <RaisedCard padding="p-10" className="text-center text-pw-navy">
      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-pw-navy" aria-hidden="true" />
      <p className="font-semibold text-pw-muted">Loading interview questions...</p>
    </RaisedCard>
  );

  if (questions.length === 0) return (
    <RaisedCard padding="p-10" className="text-center text-pw-navy">
      <p className="text-pw-muted mb-4">No interview questions found.</p>
      <SecondaryButton onClick={() => window.location.reload()}>Reload</SecondaryButton>
    </RaisedCard>
  );

  if (showReport) return (
    <InterviewReport
      results={sessionResults}
      questions={questions}
      onRestart={handleRestart}
    />
  );

  if (!sessionStarted && rehearsal) return (
    <RaisedCard padding="p-10" className="text-center text-pw-navy">
      <Loader2 className="w-10 h-10 animate-spin mx-auto text-pw-navy" aria-label="Starting" />
    </RaisedCard>
  );

  if (!sessionStarted && askingReady) return (
    <div className="w-full max-w-3xl mx-auto">
      <PreInterviewQuestion
        email={pilot.email}
        onDone={() => { setAskingReady(false); setPilot(null); startInterview(); }}
      />
    </div>
  );

  if (!sessionStarted) return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <InterviewIntro
        questions={questions}
        onStart={handleStart}
        varyOfficer={varyOfficer}
        onToggleVary={() => setVaryOfficer(v => !v)}
      />
      <InterviewHistory />
    </div>
  );

  const current = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const sectionLabel = {
    small_talk: 'Small Talk',
    personal_info: 'Personal Info',
    morals_ethics: 'Morals & Ethics',
    oath_requirements: 'Oath Requirements',
  }[current.section] || current.section;

  const statusText = {
    speaking: 'Officer Martinez is speaking...',
    listening: isUnderstandingSection(current) ? 'Your turn — tap the microphone and say what it is asking' : 'Your turn — tap the microphone to answer',
    thinking: 'Officer Martinez is evaluating your response...',
    idle: feedback ? 'Review your feedback below' : 'Ready when you are',
  }[interviewerState];

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4 text-pw-navy">
      {/* Progress: the poster's stars show it; this bar only for runs too long for stars */}
      {questions.length > 24 && <div>
        <div className="flex justify-between items-center gap-3 mb-2 text-sm font-semibold text-pw-muted">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{sessionResults.filter(r => r.is_acceptable).length} passed so far</span>
        </div>
        <div
          className="flex gap-1"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progress)}
          aria-label={`Question ${currentIndex + 1} of ${questions.length}`}
        >
          {questions.map((_, i) => (
            <div key={i} className={`h-2 flex-1 rounded-full transition-colors ${
              i < sessionResults.length
                ? (sessionResults[i]?.is_acceptable ? 'bg-pw-green-ink' : 'bg-pw-red-ink')
                : i === currentIndex ? 'bg-pw-navy' : 'bg-pw-line'
            }`} />
          ))}
        </div>
      </div>}

      {/* Virtual Interviewer */}
      <RaisedCard padding="p-4">
        <VirtualInterviewer state={interviewerState} />
      </RaisedCard>

      {/* The question on a poster, with the microphone (Phase 5) */}
      <Poster
        tone={posterTone(currentIndex)}
        className="-mx-4 sm:mx-0 sm:rounded-[14px]"
        label={`Interview · Card ${currentIndex + 1} of ${questions.length} · ${sectionLabel}`}
        progress={{ index: currentIndex, total: questions.length, results: sessionResults.map((r) => cardOutcome(r.is_acceptable, r.overall_score)) }}
        question={current.question}
      >
        <div className="space-y-4">
          <button type="button" onClick={speakQuestion} disabled={interviewerState === 'speaking'} className={`${posterTool} disabled:opacity-60`}>
            <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Repeat question
          </button>

          {/* Questions about the learner's history: understanding only */}
          {isUnderstandingSection(current) && (
            <div className="border-s-2 border-white/70 ps-4 space-y-1">
              <p className="text-base font-semibold">Don't answer this question. Say in English what the officer is asking.</p>
              <p className="text-base">We explain what questions mean. How they apply to you is for a lawyer. <Link to="/lawyer-first" className="font-semibold underline underline-offset-4">Talk to a lawyer first</Link></p>
            </div>
          )}

          {!feedback && (
            <>
              <div className="flex flex-col items-center pt-2">
                <div className="relative">
                  <span className={`absolute inset-0 rounded-full bg-white/20 transition-transform ${isListening ? 'scale-[1.35] animate-pulse' : 'scale-[1.2]'}`} aria-hidden="true" />
                  <button
                    type="button"
                    onClick={toggleListening}
                    disabled={isAnalyzing}
                    aria-label={isListening ? 'Stop recording' : 'Record your answer'}
                    className={posterBigButton}
                  >
                    {isListening ? <MicOff className="w-10 h-10" aria-hidden="true" /> : <Mic className="w-10 h-10" aria-hidden="true" />}
                  </button>
                </div>
                <p className="mt-5 text-lg font-semibold text-center" aria-live="polite">{statusText}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {userResponse && !isListening && (
                  <button type="button" onClick={analyzeResponse} disabled={isAnalyzing} className={posterSolid}>
                    {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Check className="w-5 h-5" aria-hidden="true" />}
                    {isAnalyzing ? 'Checking…' : 'Check my answer'}
                  </button>
                )}
                <button type="button" onClick={handleSkip} className={posterLink}>Skip this question</button>
              </div>
            </>
          )}

          {/* The verdict stays on the poster, with the way forward */}
          {feedback && (
            <div className="space-y-3" aria-live="polite">
              <p className="text-2xl font-bold">
                {isUnderstandingSection(current)
                  ? (feedback.is_acceptable ? 'You understood the question.' : 'Not quite yet.')
                  : (feedback.is_acceptable ? 'Good answer.' : 'Not quite yet.')}
                {' '}<span className="font-display font-normal text-3xl">{feedback.overall_score}/100</span>
              </p>
              <p className="text-base">
                {isUnderstandingSection(current)
                  ? (feedback.is_acceptable ? 'You know what the officer is asking.' : 'Read what it is asking below.')
                  : (feedback.is_acceptable ? 'This would pass in a real interview.' : 'Look at the feedback below, then go on.')}
              </p>
              <button type="button" onClick={() => handleNext()} className={posterSolid}>
                {currentIndex < questions.length - 1 ? (
                  <>Next question <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /></>
                ) : rehearsal ? (
                  <>Continue <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /></>
                ) : (
                  <><FileText className="w-5 h-5" aria-hidden="true" /> See the full report</>
                )}
              </button>
            </div>
          )}
        </div>
      </Poster>

      {/* Conversation Transcript */}
      <div
        ref={transcriptRef}
        className="rounded-[14px] bg-pw-soft p-3 space-y-3 max-h-[360px] overflow-y-auto"
      >
        {conversation.map((msg) => (
          <MessageBubble key={msg.id} role={msg.role} text={msg.text} />
        ))}
        {showTyping && <TypingIndicator />}

        {/* Live recording bubble */}
        {isListening && (
          <div className="flex justify-end">
            <div className="bg-pw-red-soft rounded-2xl rounded-tr-md px-4 py-3 max-w-[85%]">
              <div className="flex items-center gap-1 h-8" aria-hidden="true">
                {[...Array(12)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-pw-red-ink rounded-full transition-all duration-75"
                    style={{ height: `${Math.max(6, Math.random() * audioLevel * 0.5 + audioLevel * 0.5)}px`, opacity: 0.6 + Math.random() * 0.4 }}
                  />
                ))}
              </div>
              {userResponse && <p className="text-base text-pw-navy italic mt-1">"{userResponse}"</p>}
              <p className="text-sm text-pw-red-ink font-semibold mt-1">Recording... {formatTime(recordingTime)}</p>
            </div>
          </div>
        )}

        {/* Thinking bubble */}
        {isAnalyzing && <TypingIndicator />}
      </div>

      {/* Feedback */}
      {feedback && <FeedbackPanel feedback={feedback} understanding={isUnderstandingSection(current)} />}
    </div>
  );
}

function OfficerAvatar() {
  return (
    <img src={AVATAR_URL} className="w-11 h-11 rounded-full object-cover shrink-0 border-2 border-white bg-pw-blue-soft shadow-raised" alt="" />
  );
}

// Officer lines look like the tutor's messages; the learner's answers sit on the right in navy.
function MessageBubble({ role, text }) {
  const isInterviewer = role === 'interviewer';
  if (isInterviewer) {
    return (
      <div className="flex items-start gap-3">
        <OfficerAvatar />
        <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white border border-pw-line shadow-raised p-4">
          <p className="text-base leading-relaxed text-pw-navy">{text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-pw-navy text-white px-4 py-3 text-base leading-relaxed">
        {text}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <OfficerAvatar />
      <div className="rounded-2xl rounded-tl-md bg-white border border-pw-line shadow-raised px-4 py-4 flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-2 h-2 bg-pw-muted rounded-full"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  );
}

const scoreColor = (s) => s >= 80 ? 'text-pw-green-ink' : s >= 60 ? 'text-pw-blue-ink' : 'text-pw-red-ink';
const barColor = (s) => s >= 80 ? 'bg-pw-green-ink' : s >= 60 ? 'bg-pw-blue-ink' : 'bg-pw-red-ink';

// The details under the poster: the three scores, the suggested wording on
// ruled paper, and the full feedback behind a toggle. The verdict itself is
// on the poster.
function FeedbackPanel({ feedback, understanding = false }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2">
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: understanding ? 'Understanding' : 'Content', score: feedback.content_score },
          { label: 'Grammar', score: feedback.grammar_score },
          { label: 'Fluency', score: feedback.fluency_score },
        ].map(({ label, score }) => (
          <div key={label} className="bg-white rounded-2xl p-3 border border-pw-line shadow-raised text-center">
            <p className={`font-display text-[34px] leading-none ${scoreColor(score)}`}>{score}</p>
            <div className="w-full bg-pw-soft rounded-full h-1.5 my-1.5">
              <div className={`h-1.5 rounded-full ${barColor(score)}`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-sm text-pw-muted font-semibold">{label}</p>
          </div>
        ))}
      </div>

      {feedback.corrected_version && (
        <RuledPaper>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] leading-[36px] text-pw-muted">{understanding ? 'What the question is asking' : 'A better way to say it'}</p>
          <p className="font-display italic text-[22px] leading-[36px]">“{feedback.corrected_version}”</p>
        </RuledPaper>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full min-h-[48px] flex items-center justify-between bg-white border border-pw-line hover:bg-pw-soft px-4 py-3 rounded-2xl transition-colors text-base font-bold text-pw-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
      >
        <span>Detailed feedback</span>
        {expanded ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
      </button>

      {expanded && (
        <RaisedCard className="space-y-4 animate-in fade-in slide-in-from-top-2">
          {[
            { title: understanding ? 'Understanding' : 'Content', text: feedback.content_feedback },
            feedback.grammar_feedback && { title: 'Grammar', text: feedback.grammar_feedback },
            feedback.fluency_feedback && { title: 'Fluency', text: feedback.fluency_feedback },
            feedback.pronunciation_notes && { title: 'Pronunciation Notes', text: feedback.pronunciation_notes },
            { title: 'Tips to Improve', text: feedback.improvement_tips },
          ].filter(Boolean).map(({ title, text }) => (
            <div key={title}>
              <Eyebrow className="mb-1">{title}</Eyebrow>
              <p className="text-base text-pw-navy leading-relaxed">{text}</p>
            </div>
          ))}
        </RaisedCard>
      )}
    </div>
  );
}

function InterviewIntro({ questions, onStart, varyOfficer, onToggleVary }) {
  const sections = [...new Set(questions.map(q => q.section))];
  const sectionNames = { small_talk: 'Small Talk', personal_info: 'Personal Information', morals_ethics: 'Morals & Ethics', oath_requirements: 'Oath Requirements' };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 text-pw-navy">
      <RaisedCard>
        {/* Avatar preview */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0">
            <motion.div
              className="absolute -inset-1.5 rounded-full ring-4 ring-pw-blue-soft"
              animate={{ scale: [1, 1.05, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <img
              src={AVATAR_URL}
              alt="Officer Martinez"
              className="w-20 h-20 rounded-full object-cover border-4 border-white bg-pw-blue-soft shadow-raised relative z-10"
            />
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-lg">Officer Martinez</p>
            <p className="text-sm text-pw-muted">Your practice USCIS Interviewer</p>
          </div>
        </div>

        <h2 className="text-[32px] font-display font-normal leading-tight mt-5 mb-2">Mock Interview</h2>
        <p className="text-base text-pw-muted leading-relaxed">
          Have a conversation with Officer Martinez. She'll ask you real interview questions and evaluate your responses.
        </p>

        <div className="grid grid-cols-2 gap-2 mt-5">
          {[
            { Icon: Mic, text: `${questions.length} questions across ${sections.length} sections` },
            { Icon: Volume2, text: 'Officer speaks questions aloud' },
            { Icon: Bot, text: 'Real-time AI evaluation' },
            { Icon: BarChart3, text: 'Content, grammar & fluency scores' },
          ].map(({ Icon, text }) => (
            <div key={text} className="flex flex-col gap-2 bg-pw-soft p-3 rounded-2xl">
              <Icon className="w-5 h-5 text-pw-navy shrink-0" aria-hidden="true" />
              <p className="text-sm font-semibold leading-snug">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <Eyebrow className="mb-2">Sections Covered</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {sections.map(s => (
              <Tag key={s} tone="blue">{sectionNames[s] || s}</Tag>
            ))}
          </div>
        </div>
      </RaisedCard>

      {questions.some(isUnderstandingSection) && (
        <RaisedCard className="space-y-2">
          <Eyebrow>Questions about your application</Eyebrow>
          <p className="text-base leading-relaxed">For personal information and "Have you ever…" questions, you don't answer. You say in your own words what the officer is asking, and we check that you understood. We never ask about your own history.</p>
          <p className="text-base">How a question applies to you is for a lawyer. <Link to="/lawyer-first" className="font-semibold underline underline-offset-4">Talk to a lawyer first</Link></p>
        </RaisedCard>
      )}

      <button
        type="button"
        role="switch"
        aria-checked={varyOfficer}
        onClick={onToggleVary}
        className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 min-h-[56px] border border-pw-line w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
      >
        <span className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${varyOfficer ? 'bg-pw-navy' : 'bg-pw-line'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${varyOfficer ? 'translate-x-5' : ''}`} />
        </span>
        <span className="text-base font-semibold">Different officer voice each interview</span>
      </button>

      <PrimaryButton large onClick={onStart} className="w-full">
        Start Interview
      </PrimaryButton>
    </div>
  );
}
