import React, { useEffect, useState } from 'react';
import { Amio } from '@/components/pathways/Amio';
import MicButton from '@/components/pathways/MicButton';
import { SuccessBanner } from '@/components/pathways/ResultBanner';
import { Button } from '@/components/pathways/ui';
import Officer from '@/components/interview/Officer';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { speakText } from '@/components/utils/textToSpeech';
import { packText } from '@/lib/translationPack';
import { TryAgain, acceptedAnswers, gradeCivics } from '@/components/lesson/lessonParts';

// Step 2 · Teach it back (frame R33Teach) and Step 5 · Officer question
// (frame R33Officer). The learner answers out loud in English (the big mic)
// or types ("Type instead"). Graded with the existing checks against the
// official answers only; officeholder questions on the device from the
// official list. What the learner said stays in memory only.
//
// `kind`: 'teach' (Amio curious, chips: Hear it again, Hint, In my language)
// or 'officer' (the drawn AI officer, English only, "Could you repeat that,
// please?"). onDone(result): 'right' | 'skipped' | 'unchecked';
// onMiss(questionId) once per wrong answer (for review).

export default function QuestionStep({ kind, question, hint, language, t, savesReview, onDone, onMiss }) {
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

  const grade = async (answer, { typedAnswer = false } = {}) => {
    const text = String(answer || '').trim();
    if (!text) return;
    setSaid(text);
    setMode('checking');
    try {
      const r = await gradeCivics(question, text, { location, typed: typedAnswer });
      setGraded(r.graded);
      if (r.correct === null) setMode('unchecked');
      else if (r.correct) setMode('right');
      else {
        setMode('wrong');
        if (!missed) { setMissed(true); onMiss?.(question.id); }
      }
    } catch (e) {
      setGraded(null);
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

  if (mode === 'wrong') {
    const accepted = acceptedAnswers(question, graded);
    return (
      <TryAgain
        t={t}
        askedLabel={kind === 'officer' ? t('officer_asked') : t('amio_asked')}
        asked={question.question}
        saidLabel={t('you_said')}
        said={said}
        accepted={accepted}
        amioLine={t('amio_kind')}
        sayLabel={t('say_it_like_this')}
        sayText={accepted[0] || ''}
        savesReview={savesReview}
        onTryAgain={reset}
        onSkip={() => onDone('skipped')}
      />
    );
  }

  const chip = 'min-h-tap rounded-full border border-line bg-white px-4 text-base font-semibold text-navy hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim';

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col items-center gap-5 max-w-lg w-full mx-auto">
        {kind === 'teach' ? (
          <>
            <section className="w-full rounded-card bg-white border-2 border-red px-5 py-4 text-center">
              <p className="text-base text-muted" dir="auto">{t('forgot')}</p>
              <p className="mt-1 text-question font-bold text-navy leading-snug" lang="en" dir="ltr">{question.question}</p>
              {showMine && mine && <p className="mt-2 text-base text-muted" dir="auto" lang={language}>{mine}</p>}
            </section>
            <Amio mood="curious" size={96} />
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" className={chip} onClick={() => speakText(question.question, 'en')}>{t('hear_again')}</button>
              {hint && <button type="button" className={chip} aria-expanded={showHint} onClick={() => setShowHint((v) => !v)}>{t('hint')}</button>}
              {mine && <button type="button" className={chip} aria-pressed={showMine} onClick={() => setShowMine((v) => !v)}>{t('in_my_language')}</button>}
            </div>
            {showHint && hint && <p className="w-full rounded-card bg-tint px-4 py-3 text-base text-navy" dir="auto">{hint}</p>}
          </>
        ) : (
          <>
            <section className="w-full rounded-card bg-navy px-5 py-6 text-center text-white flex flex-col items-center gap-3">
              <Officer size={120} />
              <p className="text-small text-on-navy">{t('officer_label')}</p>
              <p className="text-question font-bold leading-snug" lang="en" dir="ltr">{question.question}</p>
              <p className="text-small text-on-navy">{t('english_only')}</p>
            </section>
            <button type="button" className={chip} onClick={() => speakText(question.question, 'en')}>{t('repeat_please')}</button>
          </>
        )}

        <div className="mt-auto w-full flex flex-col items-center gap-3 pt-4">
          {mode === 'checking' && <p className="text-base text-muted" role="status">{t('checking')}</p>}
          {mode === 'ask' && !typing && (
            <>
              {speech.listening && speech.transcript && <p className="text-base text-navy text-center" lang="en" dir="ltr">“{speech.transcript}”</p>}
              <MicButton
                listening={speech.listening}
                onStart={speech.start}
                onStop={speech.stop}
                label={t('answer_in_english')}
                listeningLabel={t('listening')}
                onTypeInstead={() => setTyping(true)}
                typeInsteadLabel={t('type_instead')}
                disabled={!speech.supported}
              />
            </>
          )}
          {mode === 'ask' && typing && (
            <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); grade(typed, { typedAnswer: true }); }}>
              <label htmlFor="lesson-typed" className="text-base font-semibold text-navy">{t('type_answer')}</label>
              <input id="lesson-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
              <Button variant="main" type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
            </form>
          )}
          {mode === 'unchecked' && (
            <div className="w-full flex flex-col gap-3">
              <p className="rounded-card bg-tint px-4 py-3 text-base text-navy">{t('cant_check')}</p>
              <Button variant="main" className="w-full" onClick={() => onDone('unchecked')}>{t('next')}</Button>
            </div>
          )}
        </div>
      </div>
      {mode === 'right' && (
        <SuccessBanner title={kind === 'teach' ? t('great_teaching') : t('officer_right')} actionLabel={t('next')} onAction={() => onDone('right')} className="sticky bottom-0">
          <span lang="en" dir="ltr">“{said}”</span> <strong>{t('plus_star')}</strong>
        </SuccessBanner>
      )}
    </div>
  );
}
