import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Eyebrow, PrimaryButton, RaisedCard, SecondaryButton, Tag } from '@/components/pathways/ui';
import AnswerFeedback from './AnswerFeedback';
import { Link } from 'react-router-dom';
import { Mic, Volume2, ArrowRight, Check, Loader2, ChevronDown, ChevronUp, FileText, Bot, BarChart3, Scale, X } from 'lucide-react';
import { interviewSessions as interviewSessionsApi } from '@/api/interview';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { speakText, stopSpeaking, getRandomVoice } from "@/components/utils/textToSpeech";
import { toast } from "sonner";
import { isAiLimit } from '@/api/ai';
import { AI_LIMIT_MESSAGE } from '@/lib/aiRequests';
import { isRepeatRequest } from '@/lib/repeatRequest';
import InterviewReport from './InterviewReport';
import { evaluateInterviewAnswer, evaluateUnderstanding, isUnderstandingSection } from './evaluateInterviewAnswer';
import InterviewHistory from './InterviewHistory';
import CallFrame, { EndCallButton } from '@/components/interview/CallFrame';
import Officer from '@/components/interview/Officer';
import MicButton from '@/components/pathways/MicButton';
import { INTERVIEW_PARTS } from '@/lib/interviewReadiness';
import { splitOfficialAnswers } from '@/lib/practiceChecks';
import { civicsInterviewResult } from './civicsInterviewResult';
import PreInterviewQuestion from '@/components/pilot/PreInterviewQuestion';
import { loadMyCheckIns } from '@/components/pilot/checkInData';
import { loadPreInterviewSkip } from '@/lib/pilot';
import { shouldAskPreInterview } from '@/lib/pilotCheckIns';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { INTERVIEW_INTRO_LINES } from './interviewIntroStrings';
import usePracticeText from './usePracticeText';

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
// The practice call (frame R30Call): the AI officer drawing (never a photo),
// the question with live captions, "Repeat, please", the big mic, "Type
// instead" and End call; the result (AnswerFeedback) under the question; the
// end is the practice interview report (InterviewReport). In Interview Day (rehearsal) it sits
// framed inside that page. `learnerName` = first name for "Nice work, Ana."
// `civicsQuestions` ([{ id, question, answer }], Prompt 8): a unit practice
// interview adds a Civics part with these official questions after the usual
// ones, graded like lessons (on the device first, then the AI for spoken
// answers), with official answers only.
export default function InterviewPractice({ onComplete, onNext, rehearsal = null, onClose = null, onBack = null, learnerName = '', civicsQuestions = null, day = null }) {
  const { t: pt } = usePracticeText();
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [askedAgain, setAskedAgain] = useState(false); // "Could you repeat that?" (not an answer)
  const [feedback, setFeedback] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [sessionResults, setSessionResults] = useState([]);
  const [showReport, setShowReport] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  // Conversational UI state
  const [interviewerState, setInterviewerState] = useState('idle');
  const [conversation, setConversation] = useState([]);
  const [showTyping, setShowTyping] = useState(false);
  const [varyOfficer, setVaryOfficer] = useState(false);
  // Typing instead of speaking (rule 1: a small "Type instead" link), and the
  // call's clock. Both in memory only.
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
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
  const streamRef = useRef(null);
  const transcriptRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const officerVoiceRef = useRef(null);

  useEffect(() => {
    loadQuestions();
    initializeSpeechRecognition();
    return () => {
      stopAudioAnalysis();
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
      const all = await content.interviewQuestions({ sort: '-order', limit: 100 });
      const smallTalk = all.filter(q => q.section === 'small_talk').slice(0, 2);
      const personalInfo = all.filter(q => q.section === 'personal_info').slice(0, 3);
      const morals = all.filter(q => q.section === 'morals_ethics').slice(0, 4);
      const oath = all.filter(q => q.section === 'oath_requirements').slice(0, 3);
      const civics = (civicsQuestions || []).map((q) => ({
        id: q.id, question: q.question, section: 'civics', civics: q, expected_response: splitOfficialAnswers(q.answer)[0] || '',
      }));
      const standard = [...smallTalk, ...personalInfo, ...morals, ...oath, ...civics];
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

    recognitionRef.current.onstart = () => { setIsListening(true); resetSilenceTimer(); };
    recognitionRef.current.onresult = (e) => {
      const t = Array.from(e.results).map(r => r[0].transcript).join('');
      setUserResponse(t);
      responseRef.current = t;
      resetSilenceTimer();
    };
    recognitionRef.current.onerror = () => {
      setIsListening(false); stopAudioAnalysis();
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    };
    recognitionRef.current.onend = () => {
      setIsListening(false); stopAudioAnalysis();
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
    setAskedAgain(false);
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
    auth.me()
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
  }, [isLoadingQuestions]);  

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
    // Asking the officer to repeat is allowed and is not an answer: the
    // officer asks again; nothing is scored, saved or sent to the AI.
    if (isRepeatRequest(response)) {
      setUserResponse('');
      responseRef.current = '';
      setAskedAgain(true);
      speakQuestion();
      return;
    }
    setAskedAgain(false);

    setConversation(prev => [...prev, { role: 'user', text: response, id: `u_${currentIndex}` }]);
    setInterviewerState('thinking');
    setIsAnalyzing(true);

    const q = questions[currentIndex];
    const understanding = isUnderstandingSection(q);
    try {
      const result = q.civics
        ? await civicsInterviewResult(q.civics, response)
        : understanding ? await evaluateUnderstanding(q, response) : await evaluateInterviewAnswer(q, response);
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
      toast.error(isAiLimit(e) ? AI_LIMIT_MESSAGE : 'Failed to analyze response');
      setInterviewerState('listening');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveSession = async (results) => {
    try {
      const scored = results.filter(r => typeof r.overall_score === 'number');
      const overall = scored.length ? Math.round(scored.reduce((s, r) => s + r.overall_score, 0) / scored.length) : 0;
      const passedCount = results.filter(r => r.is_acceptable).length;
      await interviewSessionsApi.create({
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


  // Screens before and after the questions keep a padded page with a close
  // button (in Practice); Interview Day brings its own page.
  const embedded = !!rehearsal;
  const padded = (children) => (embedded ? children : (
    <div className="container max-w-3xl mx-auto px-4 pt-6 pb-8 space-y-4">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label={pt('close')}
          className="w-11 h-11 rounded-full bg-white border border-line grid place-items-center text-navy hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>
      )}
      {children}
    </div>
  ));

  if (isLoadingQuestions) return padded(
    <RaisedCard padding="p-10" className="text-center text-navy">
      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4 text-navy" aria-hidden="true" />
      <p className="font-semibold text-muted" dir="auto">{pt('loading_questions')}</p>
    </RaisedCard>
  );

  if (questions.length === 0) return padded(
    <RaisedCard padding="p-10" className="text-center text-navy">
      <p className="text-muted mb-4" dir="auto">{pt('no_questions')}</p>
      <SecondaryButton onClick={() => window.location.reload()}>{pt('reload')}</SecondaryButton>
    </RaisedCard>
  );

  if (showReport) return (
    <InterviewReport
      results={sessionResults}
      name={learnerName}
      onRestart={handleRestart}
      onClose={onClose}
      onBack={onBack || onClose}
    />
  );

  if (!sessionStarted && rehearsal) return (
    <RaisedCard padding="p-10" className="text-center text-navy">
      <Loader2 className="w-10 h-10 animate-spin mx-auto text-navy" aria-label="Starting" />
    </RaisedCard>
  );

  if (!sessionStarted && askingReady) return padded(
    <div className="w-full max-w-3xl mx-auto">
      <PreInterviewQuestion
        email={pilot.email}
        onDone={() => { setAskingReady(false); setPilot(null); startInterview(); }}
      />
    </div>
  );

  if (!sessionStarted) return padded(
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
  const understanding = isUnderstandingSection(current);
  const partIndex = INTERVIEW_PARTS.findIndex((p) => p.id === current.section);
  const partLabel = INTERVIEW_PARTS[partIndex] ? pt(`ipart_${current.section}`) : current.section;

  const statusText = {
    speaking: pt('officer_speaking'),
    listening: understanding ? pt('your_turn_understand') : pt('your_turn'),
    thinking: pt('checking_answer'),
    idle: feedback ? pt('how_you_did') : pt('ready_when'),
  }[interviewerState];

  const nextLabel = currentIndex < questions.length - 1
    ? <>{pt('next_question')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /></>
    : rehearsal
      ? <>{pt('continue')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" /></>
      : <><FileText className="w-5 h-5" aria-hidden="true" /> {pt('see_report')}</>;
  const questionOf = pt('question_of', { n: currentIndex + 1, total: questions.length });

  // The practice call (frame R30Call): the part (no timer: no clocks anywhere), one dash per
  // question, the AI officer in a light room, the question with live
  // captions of what the learner says (kept in memory only), then "Repeat,
  // please", the big mic and End call. How it works and what it saves are
  // unchanged.
  return (
    <CallFrame
      title={day ? day.title : pt('interview_title', { n: partIndex + 1, part: partLabel })}
      dashes={day ? { total: day.total, current: day.current, currentDone: false } : { total: questions.length, current: currentIndex, currentDone: !!feedback }}
      dashLabel={day ? day.dashLabel : questionOf}
      speaking={interviewerState === 'speaking'}
      small={!!feedback}
      status={statusText}
      onClose={onClose}
      closeLabel={day ? day.closeLabel : pt('close')}
    >

        {/* Questions about the learner's history: understanding only */}
        {understanding && (
          <Card padding="p-4" className="space-y-1.5">
            <p className="text-base font-semibold" dir="auto">{pt('dont_answer')}</p>
            <p className="text-base text-muted" dir="auto">{pt('for_lawyer')}</p>
            <Link to="/lawyer-first" className="inline-flex min-h-tap items-center gap-2 font-semibold text-navy underline underline-offset-4" dir="auto">
              <Scale className="w-5 h-5" aria-hidden="true" /> {pt('talk_lawyer')}
            </Link>
          </Card>
        )}

        {/* The question, with live captions */}
        <Card>
          <p className="text-small font-semibold text-muted" dir="auto">{questionOf}</p>
          <h2 className={`mt-1 font-bold leading-snug ${feedback ? 'text-[1.375rem]' : 'text-question'}`} lang="en" dir="ltr">{current.question}</h2>
          {askedAgain && !userResponse && !isListening && <p className="mt-2 text-base text-navy" role="status" dir="auto">{pt('asked_again')}</p>}
          {(isListening || userResponse) && (
            <p className="mt-2 text-base font-semibold text-denim break-words" aria-live="polite">
              {isListening && !userResponse ? pt('listening') : pt('you_colon', { text: userResponse })}
            </p>
          )}
        </Card>

        {!feedback && (
          <>
            {userResponse && !isListening ? (
              <div className="space-y-2">
                <Button variant="main" className="w-full" onClick={analyzeResponse} disabled={isAnalyzing}>
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" /> : <Check className="w-5 h-5" aria-hidden="true" />}
                  {isAnalyzing ? pt('checking') : pt('check_answer')}
                </Button>
                <Button variant="second" className="w-full" onClick={() => { setTyping(false); toggleListening(); }} disabled={isAnalyzing}>
                  <Mic className="w-5 h-5" aria-hidden="true" /> {pt('say_again')}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={speakQuestion}
                  disabled={interviewerState === 'speaking'}
                  className="min-h-tap rounded-button border border-line bg-white px-4 text-base font-semibold text-navy hover:border-denim disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
                >
                  {pt('repeat_please')}
                </button>
                <MicButton
                  listening={isListening}
                  onStart={() => { setTyping(false); toggleListening(); }}
                  onStop={toggleListening}
                  label={pt('answer_out_loud')}
                  disabled={isAnalyzing}
                />
                {onClose ? <EndCallButton onClick={onClose} label={day ? day.endLabel : pt('end_call')} /> : <span className="w-14 shrink-0" aria-hidden="true" />}
              </div>
            )}

            {typing ? (
              <form
                onSubmit={(e) => { e.preventDefault(); if (typed.trim()) { responseRef.current = typed.trim(); setUserResponse(typed.trim()); setTyped(''); setTyping(false); } }}
                className="space-y-2"
              >
                <label htmlFor="interview-type" className="block text-small font-semibold" dir="auto">{pt('type_answer')}</label>
                <div className="flex items-center gap-2">
                  <input
                    id="interview-type"
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    autoFocus
                    className="flex-1 min-w-0 h-[52px] rounded-button border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim"
                  />
                  <Button variant="second" type="submit" disabled={!typed.trim()} className="shrink-0 min-h-[52px] px-5">{pt('done')}</Button>
                </div>
              </form>
            ) : !isListening && !userResponse && (
              <div className="text-center">
                <button type="button" onClick={() => setTyping(true)} className="min-h-tap px-3 text-small font-semibold text-denim underline underline-offset-4 decoration-denim/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy rounded">
                  {pt('type_instead')}
                </button>
              </div>
            )}
            <div className="text-center">
              <Button variant="link" onClick={handleSkip}>{pt('skip_question')}</Button>
            </div>
          </>
        )}

        {feedback && (
          <AnswerFeedback
            status={feedback.is_acceptable ? 'correct' : 'not-correct'}
            sub={understanding
              ? pt(feedback.is_acceptable ? 'understood' : 'close_score', { score: feedback.overall_score })
              : pt(feedback.is_acceptable ? 'would_pass' : 'close_score', { score: feedback.overall_score })}
            youSaid={userResponse}
          >
            <FeedbackPanel feedback={feedback} understanding={understanding} t={pt} />
            <Button variant="main" className="w-full" onClick={() => handleNext()}>{nextLabel}</Button>
          </AnswerFeedback>
        )}
    </CallFrame>
  );
}

const scoreColor = (s) => s >= 80 ? 'text-correct' : s >= 60 ? 'text-navy' : 'text-not-yet';
const barColor = (s) => s >= 80 ? 'bg-correct' : s >= 60 ? 'bg-navy' : 'bg-not-yet';

// The details under the poster: the three scores, the suggested wording on
// ruled paper, and the full feedback behind a toggle. The verdict itself is
// on the poster.
function FeedbackPanel({ feedback, understanding = false, t }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="w-full space-y-3 animate-in fade-in slide-in-from-bottom-2">
      {!feedback.civics && <div className="grid grid-cols-3 gap-2">
        {[
          { label: understanding ? t('score_understanding') : t('score_content'), score: feedback.content_score },
          { label: t('score_grammar'), score: feedback.grammar_score },
          { label: t('score_fluency'), score: feedback.fluency_score },
        ].map(({ label, score }) => (
          <div key={label} className="bg-white rounded-card p-3 border border-line text-center">
            <p className={`font-display text-[2.125rem] leading-none ${scoreColor(score)}`}>{score}</p>
            <div className="w-full bg-tint rounded-[3px] h-1.5 my-1.5">
              <div className={`h-1.5 rounded-[3px] ${barColor(score)}`} style={{ width: `${score}%` }} />
            </div>
            <p className="text-sm text-muted font-semibold" dir="auto">{label}</p>
          </div>
        ))}
      </div>}

      {feedback.corrected_version && (
        <div className="rounded-card bg-white border border-line p-4">
          <p className="text-[0.8125rem] font-semibold text-muted" dir="auto">{feedback.civics ? t('accepts') : understanding ? t('what_asking') : t('better_way')}</p>
          <p className="mt-1 font-medium text-[1.25rem] leading-snug" lang="en" dir="ltr">“{feedback.corrected_version}”</p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="w-full min-h-[48px] flex items-center justify-between bg-white border border-line hover:bg-tint px-4 py-3 rounded-card transition-colors text-base font-bold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      >
        <span dir="auto">{t('detailed_feedback')}</span>
        {expanded ? <ChevronUp className="w-5 h-5" aria-hidden="true" /> : <ChevronDown className="w-5 h-5" aria-hidden="true" />}
      </button>

      {expanded && (
        <RaisedCard className="space-y-4 animate-in fade-in slide-in-from-top-2">
          {[
            { title: understanding ? t('score_understanding') : t('score_content'), text: feedback.content_feedback },
            feedback.grammar_feedback && { title: t('score_grammar'), text: feedback.grammar_feedback },
            feedback.fluency_feedback && { title: t('score_fluency'), text: feedback.fluency_feedback },
            feedback.pronunciation_notes && { title: t('score_pronunciation'), text: feedback.pronunciation_notes },
            { title: t('tips_improve'), text: feedback.improvement_tips },
          ].filter(Boolean).map(({ title, text }) => (
            <div key={title}>
              <p className="mb-1 text-small font-semibold text-muted" dir="auto">{title}</p>
              <p className="text-base text-navy leading-relaxed">{text}</p>
            </div>
          ))}
        </RaisedCard>
      )}
    </div>
  );
}

function InterviewIntro({ questions, onStart, varyOfficer, onToggleVary }) {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(INTERVIEW_INTRO_LINES, language, { cacheKey: 'interview_intro_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || INTERVIEW_INTRO_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const sections = [...new Set(questions.map(q => q.section))];

  return (
    <div dir={dir} className="w-full max-w-2xl mx-auto space-y-4 text-navy">
      <RaisedCard>
        {/* The AI officer: a drawing, never a photo */}
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-tint p-1"><Officer size={80} /></div>
          <div className="min-w-0">
            <p className="font-bold text-lg">{t('officer')}</p>
            <p className="text-sm text-muted">{t('not_real')}</p>
          </div>
        </div>

        <h1 className="text-[2rem] font-display leading-tight mt-5 mb-2" dir="auto">{t('title')}</h1>
        <p dir="auto" className="text-base text-muted leading-relaxed">{t('intro')}</p>

        <div className="grid grid-cols-2 gap-2 mt-5">
          {[
            { Icon: Mic, key: 'n', text: t('n_questions', { n: questions.length, s: sections.length }) },
            { Icon: Volume2, key: 'speaks', text: t('speaks') },
            { Icon: Bot, key: 'ai', text: t('ai_checks') },
            { Icon: BarChart3, key: 'scores', text: t('scores') },
          ].map(({ Icon, key, text }) => (
            <div key={key} className="flex flex-col gap-2 bg-tint p-3 rounded-2xl">
              <Icon className="w-5 h-5 text-navy shrink-0" aria-hidden="true" />
              <p dir="auto" className="text-sm font-semibold leading-snug">{text}</p>
            </div>
          ))}
        </div>

        <div className="mt-5">
          <Eyebrow className="mb-2">{t('sections')}</Eyebrow>
          <div className="flex flex-wrap gap-2">
            {sections.map(s => (
              <Tag key={s} tone="blue">{INTERVIEW_INTRO_LINES[s] ? t(s) : s}</Tag>
            ))}
          </div>
        </div>
      </RaisedCard>

      {questions.some(isUnderstandingSection) && (
        <RaisedCard className="space-y-2">
          <Eyebrow>{t('application_title')}</Eyebrow>
          <p dir="auto" className="text-base leading-relaxed">{t('application_body')}</p>
          <p dir="auto" className="text-base">{t('lawyer_lead')} <Link to="/lawyer-first" className="font-semibold underline underline-offset-4">{t('lawyer_link')}</Link></p>
        </RaisedCard>
      )}

      {/* Always shown before starting (was also a first-open promise). */}
      <p dir="auto" className="text-base text-muted">{t('privacy')}</p>

      <button
        type="button"
        role="switch"
        aria-checked={varyOfficer}
        onClick={onToggleVary}
        className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 min-h-[56px] border border-line w-full text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
      >
        <span className={`w-11 h-6 rounded-full relative transition-colors shrink-0 ${varyOfficer ? 'bg-navy' : 'bg-line'}`}>
          <span className={`absolute top-0.5 start-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${varyOfficer ? 'translate-x-5 rtl:-translate-x-5' : ''}`} />
        </span>
        <span className="text-base font-semibold">{t('vary_voice')}</span>
      </button>

      <PrimaryButton large onClick={onStart} className="w-full">
        {t('start')}
      </PrimaryButton>
    </div>
  );
}
