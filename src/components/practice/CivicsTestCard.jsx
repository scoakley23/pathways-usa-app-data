import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Globe, Keyboard, Loader2, Mic, MicOff, Volume2 } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import ExplainSheet from '@/components/practice/ExplainSheet';
import AnswerFeedback from '@/components/practice/AnswerFeedback';
import RunTopBar from '@/components/practice/RunTopBar';
import { Button, Chip, CreamSheet, NavyTop } from '@/components/pathways/ui';
import { stopReading } from '@/components/persona/useAutoRead';
import { toast } from "sonner";
import { base44 } from '@/api/base44Client';
import { checkCivicsAnswer, officeholderCheck } from '@/components/civics/checkCivicsAnswer';
import OfficeholderNote from '@/components/civics/OfficeholderNote';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { matchOfficialAnswer, splitOfficialAnswers } from '@/lib/practiceChecks';
import { officeholderAnswerFor, officeholderAnswerLine } from '@/lib/officeholderQuestions';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import useAppLanguage from '@/hooks/useAppLanguage';

// A civics question (The Road): the navy top says WHAT (label, the question,
// "Hear it" and "In my language"); the cream sheet holds what you DO ("Say
// it", "Type it", "I don't know, show me") and then the result: Correct /
// Not correct (AnswerFeedback) with the official answers only.
//
// Grading and saving are unchanged: officeholder / capital questions are
// graded on the device from the officeholders table (never the AI); answers
// that clearly match an accepted answer are checked on the device; the rest
// go to the AI (checkCivicsAnswer, identifiers removed). Each question is
// saved once (onComplete): the first answer counts, so "Try again" after a
// wrong answer is practice only. "I don't know, show me" counts as missed.
// A result that can't be graded (is_correct null) moves on with
// onNext({ uncounted: true }) and no onComplete.
//
// `testMode` (Interview Day): one answer per question, no translation, no
// Try again, no explanation, "I don't know" moves on as missed. `onClose`
// adds the run's top bar (close, road progress, "4/10") to the navy part.
// `embedded`: inside another page's padding (rounded instead of full width).
export default function CivicsTestCard({ question, onComplete, onNext, testMode = false, index = 0, total = 0, onClose = null, embedded = false }) {
  const [appLanguage] = useAppLanguage();
  const [explainOpen, setExplainOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [translation, setTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selfCheckMode, setSelfCheckMode] = useState(false); // the AI check failed: show the answer, ask how it went
  const [dontKnow, setDontKnow] = useState(false);
  const [recorded, setRecorded] = useState(false); // this question's result is already saved (before Try again)
  const [inputMode, setInputMode] = useState('speak');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // Refs don't trigger re-renders, so track recognizer readiness in state for the mic button
  const [srReady, setSrReady] = useState(false);
  const { location } = useLearnerLocation();

  const myLanguage = !testMode && appLanguage && appLanguage !== 'en'
    ? LANGUAGES.find((l) => l.value === appLanguage)
    : null;

  const stopListening = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch (e) { /* already stopped */ } }
  };

  // Reset when the question changes
  useEffect(() => {
    setIsPlaying(false);
    setTranslation('');
    setUserAnswer('');
    setVerifying(false);
    setVerificationResult(null);
    setSelfCheckMode(false);
    setDontKnow(false);
    setRecorded(false);
    setExplainOpen(false);
    stopListening();
    // Keep "In my language" on or off
  }, [question]);

  // Translate the question (and answer) into the app language when asked
  useEffect(() => {
    if (showTranslation && myLanguage && !translation) fetchTranslation();
  }, [showTranslation, question]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTranslation = async () => {
    if (!question || !myLanguage) return;
    setIsTranslating(true);
    try {
      const prompt = `Translate the following Civics Question and Answer into ${myLanguage.label}.

      Question: "${question.question}"
      Answer: "${question.answer}"

      Return ONLY the translation in this format:
      Question: [Translated Question]
      Answer: [Translated Answer]`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      setTranslation(res);
    } catch (error) {
      console.error("Translation error", error);
      setTranslation("Translation unavailable");
    } finally {
      setIsTranslating(false);
    }
  };

  // Officeholder / capital questions: the answer comes from the table only.
  const officeholder = officeholderAnswerFor(question, location);
  const spokenAnswer = officeholder ? officeholderAnswerLine(officeholder) : question.answer;

  // Speech recognition setup
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setInputMode('type'); return; }
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e) => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('');
      setUserAnswer(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    setSrReady(true);
    return () => stopListening();
  }, []);

  const checkAnswer = async () => {
    if (!userAnswer.trim()) return;
    stopListening();
    // Officeholder questions: graded from the table on the device, never the AI.
    const local = officeholderCheck(question, userAnswer, location);
    if (local) {
      setVerificationResult(local);
      return;
    }
    // Answers that clearly match an accepted answer are checked on the
    // device; only the rest go to the AI (which judges meaning).
    if (matchOfficialAnswer(userAnswer, question.answer).isCorrect) {
      setVerificationResult({ is_correct: true, feedback: '' });
      return;
    }
    setVerifying(true);
    try {
      const result = await checkCivicsAnswer(question, userAnswer, { location });
      setVerificationResult(result);
    } catch (e) {
      console.error('Failed to verify answer:', e);
      setSelfCheckMode(true);
    } finally {
      setVerifying(false);
    }
  };

  // Next: save this question's result once (unless "Try again" already
  // saved it), then move on. null = can't be graded: not counted.
  const finish = (isCorrect) => {
    if (isCorrect === null) { onNext({ uncounted: true }); return; }
    if (!recorded) onComplete(isCorrect);
    onNext();
  };

  // Try again: the wrong answer is saved now (as today); the next try is
  // practice only.
  const tryAgain = () => {
    if (!recorded) { onComplete(false); setRecorded(true); }
    setVerificationResult(null);
    setUserAnswer('');
    setExplainOpen(false);
  };

  const iDontKnow = () => {
    stopListening();
    if (testMode) { finish(false); return; }
    setDontKnow(true);
  };

  const speak = (text) => {
    speakText(text, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  const startListening = () => {
    if (!recognitionRef.current) { toast.error('Voice input is not supported in this browser'); return; }
    stopReading();
    setInputMode('speak');
    setUserAnswer('');
    try { recognitionRef.current.start(); } catch (e) { /* already started */ }
  };

  // The official answers (never AI-written).
  const accepted = officeholder
    ? [officeholderAnswerLine(officeholder)]
    : (splitOfficialAnswers(question.answer).length ? splitOfficialAnswers(question.answer) : [question.answer]);
  const status = dontKnow ? 'not-correct'
    : verificationResult ? (verificationResult.is_correct === null ? 'neutral' : verificationResult.is_correct ? 'correct' : 'not-correct')
      : selfCheckMode ? 'neutral' : null;
  const done = !!status;
  const translatedQuestion = translation ? translation.split('Answer:')[0].replace('Question:', '').trim() : '';
  const translatedAnswer = translation.includes('Answer:') ? translation.split('Answer:')[1].trim() : '';
  const label = testMode ? 'Civics test' : ['Civics', question.category].filter(Boolean).join(' · ');

  return (
    <div className={embedded ? 'w-full max-w-2xl mx-auto' : ''}>
      {/* NAVY TOP: the question */}
      <NavyTop className={`pb-12 ${embedded ? 'rounded-card' : ''}`}>
        <div className="mx-auto max-w-2xl space-y-4">
          {onClose && <RunTopBar onClose={onClose} index={index} total={total} answered={done} />}
          <p className="text-label uppercase text-on-navy">{label}</p>
          <h2 className={`font-display leading-[1.08] transition-[font-size] ${done ? 'text-[30px]' : 'text-[38px] sm:text-[40px]'}`}>
            {question.question}
          </h2>
          <div className="flex flex-wrap gap-2">
            <Chip onNavy onClick={() => speak(question.question)} aria-label="Hear the question" className={isPlaying ? 'bg-navy-line' : ''}>
              <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> Hear it
            </Chip>
            {myLanguage && (
              <Chip onNavy onClick={() => setShowTranslation((v) => !v)} aria-pressed={showTranslation}>
                <Globe className="w-5 h-5 shrink-0" aria-hidden="true" /> In my language
              </Chip>
            )}
          </div>
          {showTranslation && myLanguage && (
            isTranslating ? (
              <p className="flex items-center gap-2 text-base text-on-navy"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> Translating…</p>
            ) : translatedQuestion && (
              <p lang={myLanguage.value} dir="auto" className="border-s-2 border-navy-line ps-4 text-lg text-on-navy">{translatedQuestion}</p>
            )
          )}
        </div>
      </NavyTop>

      {/* CREAM SHEET: answer, then the result */}
      <CreamSheet className={embedded ? 'rounded-b-card' : 'min-h-[50vh]'}>
        <div className="mx-auto max-w-2xl space-y-5 pb-6">
          {!done && (
            <>
              <p className="text-base font-semibold text-ink">Answer out loud, in English</p>

              {inputMode === 'type' && (
                <input
                  placeholder="Type your answer here…"
                  aria-label="Your answer"
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && userAnswer.trim() && !verifying) checkAnswer(); }}
                  className="w-full min-h-[56px] rounded-card border border-card-line bg-white px-4 text-lg text-ink placeholder:text-ink-2 focus:outline-none focus:ring-2 focus:ring-navy"
                />
              )}

              {inputMode === 'speak' && (isListening || userAnswer) && (
                <div aria-live="polite" className="rounded-card bg-white border border-card-line p-4">
                  <p className="text-label uppercase text-ink-label">{isListening ? 'Listening…' : 'You said'}</p>
                  <p className="mt-1 text-xl leading-snug text-ink min-h-[1.5em]">{userAnswer ? `“${userAnswer}”` : ''}</p>
                </div>
              )}

              {/* One main action at a time */}
              <div className="flex flex-col sm:flex-row gap-3">
                {isListening ? (
                  <Button variant="main" className="min-h-[60px] flex-1" onClick={stopListening}>
                    <MicOff className="w-6 h-6" aria-hidden="true" /> Stop
                  </Button>
                ) : userAnswer.trim() ? (
                  <Button variant="main" className="min-h-[60px] flex-1" onClick={checkAnswer} disabled={verifying}>
                    {verifying && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                    {verifying ? 'Checking…' : 'Check my answer'}
                  </Button>
                ) : srReady ? (
                  <Button variant="main" className="min-h-[60px] flex-1" onClick={startListening}>
                    <Mic className="w-6 h-6" aria-hidden="true" /> Say it
                  </Button>
                ) : null}
                {!isListening && inputMode === 'speak' && (
                  <Button variant="second" className="min-h-[60px] flex-1" onClick={() => { stopListening(); setInputMode('type'); }}>
                    <Keyboard className="w-5 h-5" aria-hidden="true" /> Type it
                  </Button>
                )}
                {!isListening && inputMode === 'type' && srReady && (
                  <Button variant="second" className="min-h-[60px] flex-1" onClick={startListening}>
                    <Mic className="w-5 h-5" aria-hidden="true" /> Say it instead
                  </Button>
                )}
              </div>

              <p className="text-[15px] text-ink-2">Answer only the civics question. Don&apos;t include personal information.</p>

              <Button variant="link" className="px-0" onClick={iDontKnow} disabled={verifying}>
                {testMode ? 'I don’t know' : 'I don’t know, show me'}
              </Button>
            </>
          )}

          {status === 'correct' && (
            <AnswerFeedback
              status="correct"
              sub="You moved one step down the road."
              youSaid={userAnswer}
              accepted={accepted}
              acceptedLabel="The officer accepts"
              onHearAnswer={() => speak(spokenAnswer)}
              acceptedExtra={<OfficeholderNote answer={verificationResult.officeholder} className="mt-3" />}
            >
              {translatedAnswer && showTranslation && <p lang={myLanguage?.value} dir="auto" className="text-base text-ink-2">{translatedAnswer}</p>}
              <div className="flex flex-col items-start gap-2">
                <Button variant="next" className="w-full min-h-[52px]" onClick={() => finish(true)}>
                  Next question <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
                </Button>
                {!testMode && (
                  <Button variant="link" className="px-0" aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)}>
                    Why? Explain it simply
                  </Button>
                )}
              </div>
            </AnswerFeedback>
          )}

          {status === 'not-correct' && (
            <AnswerFeedback
              status="not-correct"
              sub="Not yet, but you’re close."
              youSaid={dontKnow ? '' : userAnswer}
              reason={dontKnow ? '' : verificationResult?.feedback}
              accepted={accepted}
              acceptedLabel={accepted.length > 1 ? 'The officer accepts any one' : 'The officer accepts'}
              onHearAnswer={() => speak(spokenAnswer)}
              acceptedExtra={<OfficeholderNote answer={verificationResult?.officeholder} className="mt-3" />}
            >
              {translatedAnswer && showTranslation && <p lang={myLanguage?.value} dir="auto" className="text-base text-ink-2">{translatedAnswer}</p>}
              <div className="flex flex-col items-start gap-2">
                <div className="grid w-full grid-cols-2 gap-3">
                  {!testMode && !dontKnow ? (
                    <Button variant="next" className="min-h-[52px]" onClick={tryAgain}>Try again</Button>
                  ) : null}
                  <Button variant={!testMode && !dontKnow ? 'second' : 'next'} className={`min-h-[52px] ${!testMode && !dontKnow ? '' : 'col-span-2'}`} onClick={() => finish(false)}>
                    Next question
                  </Button>
                </div>
                {!testMode && (
                  <Button variant="link" className="px-0" aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)}>
                    Why? Explain it simply
                  </Button>
                )}
              </div>
            </AnswerFeedback>
          )}

          {status === 'neutral' && (
            <AnswerFeedback
              status="neutral"
              title={selfCheckMode ? 'We couldn’t check your answer' : 'We can’t check this one yet'}
              sub={selfCheckMode ? 'Compare it with the answers below. How did you do?' : null}
              youSaid={userAnswer}
              accepted={accepted}
              acceptedLabel={accepted.length > 1 ? 'The officer accepts any one' : 'The officer accepts'}
              onHearAnswer={() => speak(spokenAnswer)}
              acceptedExtra={<OfficeholderNote answer={verificationResult?.officeholder || (selfCheckMode ? officeholder : null)} graded={!selfCheckMode} className="mt-3" />}
            >
              {selfCheckMode ? (
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="next" className="min-h-[52px]" onClick={() => finish(true)}>I knew it</Button>
                  <Button variant="second" className="min-h-[52px]" onClick={() => finish(false)}>I missed it</Button>
                </div>
              ) : (
                <Button variant="next" className="w-full min-h-[52px]" onClick={() => finish(null)}>
                  Next question <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
                </Button>
              )}
            </AnswerFeedback>
          )}

          {done && explainOpen && !testMode && (
            <ExplainSheet question={question.question} answer={spokenAnswer} aiFallback={!officeholder} />
          )}
        </div>
      </CreamSheet>
    </div>
  );
}
