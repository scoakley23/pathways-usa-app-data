import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import MicButton from '@/components/pathways/MicButton';
import { RightPanel } from '@/components/pathways/ResultBanner';
import { Button } from '@/components/pathways/ui';
import Officer from '@/components/interview/Officer';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { speakText } from '@/components/utils/textToSpeech';
import { packText } from '@/lib/translationPack';
import { SaidWithMisses, TryAgain, acceptedAnswers, gradeCivics } from '@/components/lesson/lessonParts';
import { isRepeatRequest } from '@/lib/repeatRequest';
import { KIND_LINES, RIGHT_LINES, nextLine } from '@/lib/amioLines';

// Step 2 · Teach it back and Step 5 · Officer question, in the Amio v2 look
// (frames Speak, Right, NotQuite): a navy screen with Amio's one line (or
// the drawn AI officer), the question as a big headline, and the gold mic
// ("Tap to answer" / "Tap to stop") with "Type instead". After an answer the
// question stays on screen with "You said", and a bottom panel: Right (gold)
// or Not quite (paper, "Say it once more" / "Skip for now"), never red.
// Amio's line takes turns through a few short lines (src/lib/amioLines.js).
// Graded with the existing checks against the official answers only;
// officeholder questions on the device from the official list. What the
// learner said stays in memory only.
//
// `kind`: 'teach' (Hear it again, Hint, In my language) or 'officer' (the
// drawn AI officer, English only, "Could you repeat that, please?").
// onDone(result): 'right' | 'skipped' | 'unchecked'; onMiss(questionId) once
// per wrong answer (for review). No stars are shown (Amio v2); `showStar` is
// kept for callers and ignored.

export default function QuestionStep({ kind, question, hint, language, t, savesReview, onDone, onMiss, showStar: _showStar }) {
  const { location } = useLearnerLocation();
  const [mode, setMode] = useState('ask'); // ask | checking | right | wrong | unchecked
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const [said, setSaid] = useState('');
  const [graded, setGraded] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [mine, setMine] = useState(null); // the question in the learner's language, from the pack only
  const [showMine, setShowMine] = useState(false);
  const [missed, setMissed] = useState(false);
  const [askedAgain, setAskedAgain] = useState(false);
  const [lineKey, setLineKey] = useState(null);

  const grade = async (answer, { typedAnswer = false } = {}) => {
    const text = String(answer || '').trim();
    if (!text) return;
    // "Could you say that again?" is not an answer: the question is asked
    // again, nothing is graded or counted (src/lib/repeatRequest.js).
    if (isRepeatRequest(text)) {
      setTyped(''); speech.reset(); setAskedAgain(true);
      speakText(question.question, 'en');
      return;
    }
    setAskedAgain(false);
    setSaid(text);
    setMode('checking');
    try {
      const r = await gradeCivics(question, text, { location, typed: typedAnswer });
      setGraded(r.graded);
      if (r.correct === null) setMode('unchecked');
      else if (r.correct) { setLineKey(nextLine(RIGHT_LINES)); setMode('right'); }
      else {
        setLineKey(nextLine(KIND_LINES));
        setMode('wrong');
        if (!missed) { setMissed(true); onMiss?.(question.id); }
      }
    } catch {
      setGraded(null);
      setLineKey(nextLine(KIND_LINES));
      setMode('wrong');
    }
  };

  const speech = useSpeechCapture((transcript) => grade(transcript));

  // The officer asks out loud when the step opens.
  useEffect(() => {
    if (kind === 'officer') speakText(question.question, 'en');
  }, [kind, question.question]);

  // "In my language" shows only a translation the app already has (the
  // translation pack). Official questions are never sent to the AI to translate.
  useEffect(() => {
    let active = true;
    if (kind === 'teach' && language && language !== 'en') {
      packText(language, question.question).then((v) => { if (active) setMine(v || null); }).catch(() => {});
    }
    return () => { active = false; };
  }, [kind, language, question.question]);

  const reset = () => {
    setMode('ask'); setSaid(''); setTyped(''); setGraded(null); speech.reset();
  };

  const answered = mode === 'right' || mode === 'wrong';
  const accepted = acceptedAnswers(question, graded);
  const chip = 'min-h-tap rounded-button border border-navy-line px-4 text-base font-semibold text-white hover:border-sky focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white';
  const amioLine = answered ? t(lineKey) : kind === 'teach' ? t('forgot') : null;
  const amioMood = mode === 'right' ? 'cheering' : mode === 'wrong' ? 'tryAgain' : speech.listening ? 'listening' : 'hello';

  return (
    <div className="flex flex-col flex-1 min-h-full bg-navy text-white">
      <div className="flex-1 px-4 py-5 flex flex-col gap-5 max-w-lg w-full mx-auto">
        {kind === 'officer' && (
          <div className="flex items-center gap-3">
            <Officer size={answered ? 64 : 96} />
            <div className="min-w-0">
              <p className="text-small text-on-navy">{t('officer_label')}</p>
              <p className="text-small text-on-navy">{t('english_only')}</p>
            </div>
          </div>
        )}
        {amioLine && <AmioSays mood={amioMood} size={56} onNavy>{amioLine}</AmioSays>}
        {kind === 'teach' && !answered && <p dir="auto" className="text-base text-on-navy">{t('speak_amio')}</p>}

        <p className={`font-display leading-[1.08] tracking-tight ${answered ? 'text-[1.75rem] text-sky' : 'text-[2.25rem] text-white'}`} lang="en" dir="ltr">{question.question}</p>
        {showMine && mine && !answered && <p className="text-base text-sky" dir="auto" lang={language}>{mine}</p>}

        {mode === 'ask' && (
          <div className="flex flex-wrap gap-2">
            {kind === 'teach' ? (
              <>
                <button type="button" className={`${chip} inline-flex items-center gap-2`} onClick={() => speakText(question.question, 'en')}>
                  <Volume2 className="w-5 h-5" aria-hidden="true" />{t('hear_again')}
                </button>
                {hint && <button type="button" className={chip} aria-expanded={showHint} onClick={() => setShowHint((v) => !v)}>{t('hint')}</button>}
                {mine && <button type="button" className={chip} aria-pressed={showMine} onClick={() => setShowMine((v) => !v)}>{t('in_my_language')}</button>}
              </>
            ) : (
              <button type="button" className={chip} onClick={() => speakText(question.question, 'en')}>{t('repeat_please')}</button>
            )}
          </div>
        )}
        {mode === 'ask' && showHint && hint && <p className="rounded-card bg-navy-2 px-4 py-3 text-base text-white" dir="auto">{hint}</p>}

        {answered && (
          <section className="rounded-card bg-navy-2 px-4 py-4">
            <p className="text-small text-on-navy">{t('you_said')}</p>
            <p className="mt-1 font-display text-[1.75rem] leading-tight text-white">
              {mode === 'wrong' && said ? <SaidWithMisses said={said} accepted={accepted} /> : <span lang="en" dir="ltr">“{said || '—'}”</span>}
            </p>
          </section>
        )}

        {!answered && (
          <div className="mt-auto w-full flex flex-col items-center gap-3 pt-4">
            {mode === 'checking' && <p className="text-base text-on-navy" role="status">{t('checking')}</p>}
            {mode === 'ask' && askedAgain && <p className="text-base text-white text-center" role="status">{t('asked_again')}</p>}
            {mode === 'ask' && !typing && (
              <>
                {speech.listening && speech.transcript && <p className="text-base text-white text-center" lang="en" dir="ltr">“{speech.transcript}”</p>}
                <MicButton
                  tone="gold"
                  listening={speech.listening}
                  onStart={speech.start}
                  onStop={speech.stop}
                  label={t('tap_to_answer')}
                  listeningLabel={t('tap_to_stop')}
                  onTypeInstead={() => setTyping(true)}
                  typeInsteadLabel={t('type_instead')}
                  disabled={!speech.supported}
                />
              </>
            )}
            {mode === 'ask' && typing && (
              <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); grade(typed, { typedAnswer: true }); }}>
                <label htmlFor="lesson-typed" className="text-base font-semibold text-white">{t('type_answer')}</label>
                <input id="lesson-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[3.25rem] rounded-button border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-gold" />
                <Button variant="main" onNavy type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
              </form>
            )}
            {mode === 'unchecked' && (
              <div className="w-full flex flex-col gap-3">
                <p className="rounded-card bg-navy-2 px-4 py-3 text-base text-white">{t('cant_check')}</p>
                <Button variant="main" onNavy className="w-full" onClick={() => onDone('unchecked')}>{t('next')}</Button>
              </div>
            )}
          </div>
        )}
      </div>
      {mode === 'right' && (
        <RightPanel title={t('right')} answer={accepted[0] || null} actionLabel={t('continue')} onAction={() => onDone('right')} className="sticky bottom-0" />
      )}
      {mode === 'wrong' && (
        <TryAgain t={t} accepted={accepted} savesReview={savesReview} onTryAgain={reset} onSkip={() => onDone('skipped')} className="sticky bottom-0" />
      )}
    </div>
  );
}
