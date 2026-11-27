import React, { useState, useEffect, useRef } from 'react';
import { ArrowRight, Globe, Loader2, Mic, Volume2 } from 'lucide-react';
import { speakText } from "@/components/utils/textToSpeech";
import ExplainSheet from '@/components/practice/ExplainSheet';
import AnswerFeedback from '@/components/practice/AnswerFeedback';
import RunTopBar from '@/components/practice/RunTopBar';
import RunScreen, { NavyChip, SaidBox } from '@/components/practice/RunScreen';
import { KeyHints } from '@/components/pathways/Stage';
import useShortcuts from '@/components/pathways/useShortcuts';
import usePracticeText from '@/components/practice/usePracticeText';
import MicButton from '@/components/pathways/MicButton';
import { Button } from '@/components/pathways/ui';
import { stopReading } from '@/components/persona/useAutoRead';
import { toast } from "sonner";
import { ai } from '@/api/ai';
import { checkCivicsAnswer, officeholderCheck } from '@/components/civics/checkCivicsAnswer';
import { isRepeatRequest } from '@/lib/repeatRequest';
import OfficeholderNote from '@/components/civics/OfficeholderNote';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { splitOfficialAnswers } from '@/lib/practiceChecks';
import { matchCivicsAnswer } from '@/lib/answerVariants';
import { officeholderAnswerFor, officeholderAnswerLine } from '@/lib/officeholderQuestions';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import useAppLanguage from '@/hooks/useAppLanguage';
import { PACK_ONLY, packText } from '@/lib/translationPack';

// A civics question (Amio v2, frame Speak): a navy screen with the question
// (English, word for word), Hear it and In my language, the gold mic ("Tap to
// answer", "Type instead") and "I don't know, show me"; the result is a
// bottom panel (AnswerFeedback: Right! / Not quite) with the official answers
// only.
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
// `onClose` adds the run's top bar (close, the step bar, "4/10").
export default function CivicsTestCard({ question, onComplete, onNext, index = 0, total = 0, onClose = null }) {
  const [appLanguage] = useAppLanguage();
  const { t } = usePracticeText();
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
  const [askedAgain, setAskedAgain] = useState(false); // "Could you repeat that?" (not an answer)
  const [recorded, setRecorded] = useState(false); // this question's result is already saved (before Try again)
  const [inputMode, setInputMode] = useState('speak');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // Refs don't trigger re-renders, so track recognizer readiness in state for the mic button
  const [srReady, setSrReady] = useState(false);
  const { location } = useLearnerLocation();

  const myLanguage = appLanguage && appLanguage !== 'en'
    ? LANGUAGES.find((l) => l.value === appLanguage)
    : null;

  const stopListening = () => {
    if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch { /* already stopped */ } }
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
    setAskedAgain(false);
    setRecorded(false);
    setExplainOpen(false);
    stopListening();
    // Keep "In my language" on or off
  }, [question]);

  // Translate the question (and answer) into the app language when asked
  useEffect(() => {
    if (showTranslation && myLanguage && !translation) fetchTranslation();
  }, [showTranslation, question]);

  const fetchTranslation = async () => {
    if (!question || !myLanguage) return;
    setIsTranslating(true);
    try {
      // The translation pack first; live AI only when it doesn't have this
      // question, and never when PACK_ONLY (the switch on).
      const [q, a] = await Promise.all([packText(myLanguage.value, question.question), packText(myLanguage.value, question.answer)]);
      if (q && a) {
        setTranslation(`Question: ${q}\nAnswer: ${a}`);
        return;
      }
      if (PACK_ONLY) {
        setTranslation(t('translation_unavailable'));
        return;
      }
      const prompt = `Translate the following Civics Question and Answer into ${myLanguage.label}.

      Question: "${question.question}"
      Answer: "${question.answer}"

      Return ONLY the translation in this format:
      Question: [Translated Question]
      Answer: [Translated Answer]`;
      const res = await ai.translate({ prompt });
      setTranslation(res);
    } catch (error) {
      console.error("Translation error", error);
      setTranslation(t('translation_unavailable'));
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
    // Asking the officer to repeat is allowed and is not an answer: the
    // question is read again; nothing is graded, counted or sent to the AI.
    if (isRepeatRequest(userAnswer)) {
      setUserAnswer('');
      setAskedAgain(true);
      speak(question.question);
      return;
    }
    setAskedAgain(false);
    // Officeholder questions: graded from the table on the device, never the AI.
    const local = officeholderCheck(question, userAnswer, location);
    if (local) {
      setVerificationResult(local);
      return;
    }
    // Answers that clearly match an accepted answer are checked on the
    // device; only the rest go to the AI (which judges meaning).
    if (matchCivicsAnswer(userAnswer, question).sure) {
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
    setDontKnow(true);
  };

  const speak = (text) => {
    speakText(text, 'en', {
      onStart: () => setIsPlaying(true),
      onEnd: () => setIsPlaying(false),
    });
  };

  const startListening = () => {
    if (!recognitionRef.current) { toast.error(t('cant_listen')); return; }
    stopReading();
    setInputMode('speak');
    setUserAnswer('');
    try { recognitionRef.current.start(); } catch { /* already started */ }
  };

  // The official answers (never AI-written).
  const accepted = officeholder
    ? [officeholderAnswerLine(officeholder)]
    : (splitOfficialAnswers(question.answer).length ? splitOfficialAnswers(question.answer) : [question.answer]);
  const status = dontKnow ? 'not-correct'
    : verificationResult ? (verificationResult.is_correct === null ? 'neutral' : verificationResult.is_correct ? 'correct' : 'not-correct')
      : selfCheckMode ? 'neutral' : null;
  const done = !!status;
  // Desktop keys (vision C): R = hear it again; Space is the mic's, Esc the top bar's close.
  useShortcuts({ r: () => speak(question.question) }, !done);
  const translatedQuestion = translation ? translation.split('Answer:')[0].replace('Question:', '').trim() : '';
  const translatedAnswer = translation.includes('Answer:') ? translation.split('Answer:')[1].trim() : '';

  const resultButtons = (status === 'correct') ? (
    <div className="flex flex-col items-start gap-2">
      <Button variant="main" className="w-full" onClick={() => finish(true)}>
        {t('next_question')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
      </Button>
      <Button variant="link" className="px-0" aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)}>{t('why')}</Button>
    </div>
  ) : status === 'not-correct' ? (
    <div className="flex flex-col items-start gap-2">
      <div className="grid w-full grid-cols-2 gap-3">
        {!dontKnow && <Button variant="main" className="px-3" onClick={tryAgain}>{t('try_again')}</Button>}
        <Button variant="second" className={dontKnow ? 'col-span-2' : ''} onClick={() => finish(false)}>{t('next_question')}</Button>
      </div>
      <Button variant="link" className="px-0" aria-expanded={explainOpen} onClick={() => setExplainOpen((v) => !v)}>{t('why')}</Button>
    </div>
  ) : selfCheckMode ? (
    <div className="grid grid-cols-2 gap-3">
      <Button variant="main" className="px-3" onClick={() => finish(true)}>{t('i_knew')}</Button>
      <Button variant="second" onClick={() => finish(false)}>{t('i_missed')}</Button>
    </div>
  ) : (
    <Button variant="main" className="w-full" onClick={() => finish(null)}>
      {t('next_question')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
    </Button>
  );

  const panel = done && (
    <AnswerFeedback
      status={status}
      title={status === 'neutral' ? (selfCheckMode ? t('couldnt_check') : t('cant_check')) : undefined}
      sub={status === 'correct' ? t('civics_right_sub') : status === 'not-correct' ? t('civics_close') : selfCheckMode ? t('compare') : null}
      youSaid={dontKnow ? '' : userAnswer}
      reason={dontKnow ? '' : verificationResult?.feedback}
      accepted={accepted}
      acceptedLabel={accepted.length > 1 && status !== 'correct' ? t('accepts_any') : t('accepts')}
      onHearAnswer={() => speak(spokenAnswer)}
      acceptedExtra={<OfficeholderNote answer={verificationResult?.officeholder || (selfCheckMode ? officeholder : null)} graded={!selfCheckMode} className="mt-3" />}
    >
      {translatedAnswer && showTranslation && <p lang={myLanguage?.value} dir="auto" className="text-base text-muted">{translatedAnswer}</p>}
      {resultButtons}
      {explainOpen && status !== 'neutral' && (
        <ExplainSheet question={question.question} answer={spokenAnswer} aiFallback={!officeholder} />
      )}
    </AnswerFeedback>
  );

  // The answer controls; on desktop they stand on the right (vision C).
  const answerControls = (
        <div className="flex flex-col gap-4 pt-2">
          <p className="text-base font-semibold text-on-navy lg:text-center" dir="auto">{t('answer_aloud')}</p>
          {askedAgain && !userAnswer && <p role="status" className="rounded-card bg-navy-2 px-4 py-3 text-base" dir="auto">{t('asked_again')}</p>}

          {inputMode === 'type' && (
            <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (userAnswer.trim() && !verifying) checkAnswer(); }}>
              <label htmlFor="civics-typed" className="text-base font-semibold" dir="auto">{t('type_answer')}</label>
              <input
                id="civics-typed"
                lang="en"
                dir="ltr"
                autoComplete="off"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                className="w-full min-h-[3.5rem] rounded-button border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-white"
              />
              <Button variant="main" onNavy type="submit" className="w-full" disabled={!userAnswer.trim() || verifying}>
                {verifying && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                {verifying ? t('checking') : t('check_answer')}
              </Button>
              {srReady && (
                <Button variant="link" onNavy className="self-center" onClick={startListening}>
                  <Mic className="w-5 h-5" aria-hidden="true" /> {t('say_instead')}
                </Button>
              )}
            </form>
          )}

          {inputMode === 'speak' && (isListening || userAnswer) && (
            <SaidBox label={isListening ? t('listening') : t('you_said')}>{userAnswer ? `“${userAnswer}”` : ''}</SaidBox>
          )}

          {inputMode === 'speak' && (userAnswer.trim() && !isListening ? (
            <div className="flex flex-col gap-3">
              <Button variant="main" onNavy className="w-full" onClick={checkAnswer} disabled={verifying}>
                {verifying && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                {verifying ? t('checking') : t('check_answer')}
              </Button>
              <Button variant="second" onNavy className="w-full" onClick={startListening} disabled={verifying}>
                <Mic className="w-5 h-5" aria-hidden="true" /> {t('say_again')}
              </Button>
            </div>
          ) : srReady ? (
            <MicButton
              tone="gold"
              listening={isListening}
              onStart={startListening}
              onStop={stopListening}
              label={t('tap_answer')}
              listeningLabel={t('tap_stop')}
              onTypeInstead={() => { stopListening(); setInputMode('type'); }}
              typeInsteadLabel={t('type_instead')}
            />
          ) : null)}

          <p className="text-base text-on-navy" dir="auto">{t('civics_private')}</p>
          <Button variant="link" onNavy className="self-start px-0" onClick={iDontKnow} disabled={verifying}>{t('dont_know')}</Button>
        </div>
  );

  return (
    <RunScreen
      topBar={onClose && <RunTopBar onClose={onClose} index={index} total={total} answered={done} />}
      label={question.category ? <><bdi>{t('civics_label')}</bdi> · <bdi lang="en">{question.category}</bdi></> : t('civics_label')}
      panel={panel}
      side={done ? false : answerControls}
    >
      <h2 className={`font-display leading-[1.08] ${done ? 'text-[1.75rem] lg:text-[2.5rem]' : 'text-[2.25rem] lg:text-[3.75rem] lg:leading-[1.02]'}`} lang="en" dir="ltr">
        {question.question}
      </h2>
      <div className="flex flex-wrap gap-2">
        <NavyChip onClick={() => speak(question.question)} pressed={isPlaying}>
          <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {t('hear_it')}
        </NavyChip>
        {myLanguage && (
          <NavyChip onClick={() => setShowTranslation((v) => !v)} pressed={showTranslation}>
            <Globe className="w-5 h-5 shrink-0" aria-hidden="true" /> {t('in_my_language')}
          </NavyChip>
        )}
      </div>
      {showTranslation && myLanguage && (
        isTranslating ? (
          <p className="flex items-center gap-2 text-base text-on-navy"><Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> {t('translating')}</p>
        ) : translatedQuestion && (
          <p lang={myLanguage.value} dir="auto" className="border-s-2 border-navy-line ps-4 text-lg text-on-navy">{translatedQuestion}</p>
        )
      )}

      {!done && <KeyHints keys={['space', 'r', 'escape']} />}
    </RunScreen>
  );
}
