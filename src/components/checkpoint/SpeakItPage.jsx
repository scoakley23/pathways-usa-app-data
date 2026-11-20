import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, Check, Volume2 } from 'lucide-react';
import { Amio, AmioSays } from '@/components/pathways/Amio';
import { Button, MAIN_LINK } from '@/components/pathways/ui';
import { useJourney } from '@/components/course/courseShared';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { speakText } from '@/components/utils/textToSpeech';
import { gradeCivics } from '@/components/lesson/lessonParts';
import { isRepeatRequest } from '@/lib/repeatRequest';
import { checkpoints as checkpointsApi } from '@/api/checkpoints';
import { passMark, speakItQuestions, speakItScore, unitFinishedBy } from '@/lib/checkpoints';
import { CheckpointHeader, ProgressDots, RingMic, useCheckpointText } from '@/components/checkpoint/checkpointParts';

// Speak it! (Prompt 8, frames R33SpeakIntro, R33SpeakAsk, R33SpeakResult):
// 6 of the section's questions (picked each try) out loud, no hints. The only help is "Could you
// repeat that, please?" (and a small "Type instead"). Pass = all but one
// right; answers the app can't check yet count neither way. Saves (Supabase
// only) one checkpoint_results row and puts missed questions in review at
// box 1. Never what the learner said.

function Ask({ question, index, total, results, t, onAnswer, onClose }) {
  const { location } = useLearnerLocation();
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const [checking, setChecking] = useState(false);
  const [askedAgain, setAskedAgain] = useState(false);

  const grade = async (answer, typedAnswer = false) => {
    const said = String(answer || '').trim();
    if (!said) return;
    // Asking the officer to repeat is allowed and is not an answer.
    if (isRepeatRequest(said)) {
      setTyped(''); speech.reset(); setAskedAgain(true);
      speakText(question.question, 'en');
      return;
    }
    setChecking(true);
    let correct = false;
    try { correct = (await gradeCivics(question, said, { location, typed: typedAnswer })).correct; } catch (e) { correct = false; }
    onAnswer({ question, said, correct });
  };
  const speech = useSpeechCapture((transcript) => grade(transcript));

  useEffect(() => { speakText(question.question, 'en'); }, [question.question]);

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <CheckpointHeader title={t('question_of', { n: index + 1, total })} onClose={onClose} closeLabel={t('close')}>
        <ProgressDots total={total} results={results} current={index} label={t('progress_label', { n: index + 1, total })} />
      </CheckpointHeader>
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-5 flex flex-col items-center gap-4">
        <section className="w-full rounded-card bg-navy px-5 py-6 text-center text-white">
          <p className="inline-flex items-center gap-2 text-base text-on-navy"><Volume2 className="w-5 h-5" aria-hidden="true" />{t('officer_asks')}</p>
          <p className="mt-2 text-question font-bold leading-snug" lang="en" dir="ltr">{question.question}</p>
        </section>
        <button type="button" onClick={() => speakText(question.question, 'en')} className="min-h-tap rounded-button border border-line bg-white px-5 text-base font-semibold text-navy hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          {t('repeat_please')}
        </button>
        <p className="text-base text-muted text-center">{t('no_hints')}</p>

        <div className="mt-auto w-full flex flex-col items-center gap-3 pt-8">
          {checking && <p className="text-base text-muted" role="status">{t('checking')}</p>}
          {!checking && askedAgain && <p className="text-base text-navy text-center" role="status">{t('asked_again')}</p>}
          {!checking && !typing && (
            <>
              {speech.listening && speech.transcript && <p className="text-base text-navy text-center" lang="en" dir="ltr">“{speech.transcript}”</p>}
              <RingMic
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
          {!checking && typing && (
            <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); grade(typed, true); }}>
              <label htmlFor="speak-typed" className="text-base font-semibold text-navy">{t('type_answer')}</label>
              <input id="speak-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
              <Button variant="main" type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function Result({ section, answers, score, t, onContinue, onTryAgain }) {
  const missed = answers.filter((a) => a.correct === false).length;
  const amioLine = missed === 0 ? t('amio_all_right') : missed === 1 ? t('amio_missed_1') : t('amio_missed_n');
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <section className="bg-gold text-navy px-4 pt-10 pb-8 flex flex-col items-center gap-2 text-center">
        {score.passed ? (
          <>
            {/* No badge or stars shown (Amio v2); the pass is still saved and counted. */}
            <Amio mood="cheering" size={96} />
            <h1 className="text-celebrate font-extrabold" dir="auto">{t('passed_title', { section: section.title })}</h1>
            <p className="text-lg">{t('score_only', { correct: score.correct, total: score.total })}</p>
          </>
        ) : (
          <>
            <Amio mood="kind" size={96} />
            <h1 className="text-celebrate font-extrabold">{t('not_yet_title')}</h1>
            <p className="text-lg">{t('score_only', { correct: score.correct, total: score.total })}</p>
            <p className="text-base">{t('need_to_pass', { need: passMark(score.total), total: score.total })}</p>
          </>
        )}
      </section>
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-5 flex flex-col gap-4">
        <ul className="rounded-card bg-white border border-line px-4 list-none m-0">
          {answers.map((a) => (
            <li key={a.question.id} className="flex items-start gap-3 py-3 border-b border-line last:border-b-0">
              {a.correct === true
                ? <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-correct text-white"><Check className="w-5 h-5" strokeWidth={3} aria-label={t('answer_right')} /></span>
                : <span className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-tint text-not-yet"><AlertCircle className="w-5 h-5" aria-label={a.correct === false ? t('answer_missed') : t('cant_check')} /></span>}
              <span className="min-w-0">
                <span className="block text-base font-bold text-navy" lang="en" dir="ltr">{a.question.question}</span>
                {a.correct === true && <span className="block text-base text-muted" lang="en" dir="ltr">“{a.said}”</span>}
                {a.correct === false && <span className="block text-base text-not-yet">{t('practice_again')}</span>}
                {a.correct === null && <span className="block text-base text-muted">{t('cant_check')}</span>}
              </span>
            </li>
          ))}
        </ul>
        <AmioSays mood={missed ? 'kind' : 'proud'} size={56}>{amioLine}</AmioSays>
        {!checkpointsApi.saves && <p className="text-small text-muted text-center">{t('practice_only')}</p>}
      </div>
      <div className="px-4 pb-6 max-w-lg w-full mx-auto flex flex-col gap-3">
        {score.passed
          ? <Button variant="main" className="w-full" onClick={onContinue}>{t('continue_journey')}</Button>
          : (
            <>
              <Button variant="main" className="w-full" onClick={onTryAgain}>{t('try_again')}</Button>
              <Button variant="second" className="w-full" onClick={onContinue}>{t('back_to_road')}</Button>
            </>
          )}
      </div>
    </div>
  );
}

export default function SpeakItPage() {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { t, rtl } = useCheckpointText();
  const journey = useJourney();
  const [phase, setPhase] = useState('intro'); // intro | ask | result
  const [answers, setAnswers] = useState([]);

  const found = useMemo(() => {
    for (const u of journey.course) for (const s of u.sections) if (s.id === sectionId) return { unit: u, section: s, number: u.sections.indexOf(s) + 1 };
    return null;
  }, [journey.course, sectionId]);
  const [round, setRound] = useState(0); // a new pick of questions each try
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const questions = useMemo(() => (found ? speakItQuestions(found.section) : []), [found?.section.id, round]);
  const back = () => navigate(found ? `/course?unit=${found.unit.id}` : '/course');

  if (journey.loading) return <div className="min-h-screen bg-paper" />;
  if (!found || !questions.length) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper">
        <CheckpointHeader title={t('speak_it')} onClose={back} closeLabel={t('close')} />
        <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
          <AmioSays mood="kind" size={64}>{t('not_found')}</AmioSays>
          <Link to="/course" className={`${MAIN_LINK} px-6 text-base`}>{t('back_to_road')}</Link>
        </div>
      </div>
    );
  }
  const { unit, section } = found;
  const n = questions.length;

  const answered = (a) => {
    const next = [...answers, a];
    setAnswers(next);
    if (a.correct === false) checkpointsApi.missed(a.question.id).catch(() => {});
    if (next.length < n) { window.scrollTo?.(0, 0); return; }
    const score = speakItScore(next);
    checkpointsApi.saveResult(section.id, score).catch(() => {});
    setPhase('result');
    window.scrollTo?.(0, 0);
  };

  let body;
  if (phase === 'intro') {
    body = (
      <div className="min-h-screen bg-paper flex flex-col">
        <CheckpointHeader title={t('speak_it')} subtitle={t('section_checkpoint', { n: found.number })} onClose={back} closeLabel={t('close')} />
        <div className="flex-1 max-w-lg w-full mx-auto px-4 py-5 flex flex-col gap-4">
          <section className="rounded-card bg-white border border-line p-5 flex flex-col gap-2">
            <p className="text-base font-semibold text-muted" dir="auto">{n === 1 ? t('speak_sub_1', { section: section.title }) : t('speak_sub_n', { section: section.title, n })}</p>
            <p className="text-base text-navy">{t('speak_rules')}</p>
          </section>
          <section className="rounded-card bg-white border border-line p-5">
            <h2 className="text-base font-bold text-navy">{t('youll_be_asked')}</h2>
            <ul className="mt-2 flex flex-col gap-2 list-disc ps-5 text-base text-navy" lang="en" dir="ltr">
              {questions.map((q) => <li key={q.id}>{q.question}</li>)}
            </ul>
          </section>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-button bg-gold px-4 py-2 text-base font-bold text-navy">{t('to_pass', { need: passMark(n), n })}</span>
          </div>
        </div>
        <div className="px-4 pb-6 max-w-lg w-full mx-auto">
          <Button variant="main" className="w-full" onClick={() => { setAnswers([]); setPhase('ask'); }}>{t('im_ready')}</Button>
        </div>
      </div>
    );
  } else if (phase === 'ask') {
    const i = answers.length;
    body = <Ask key={`${questions[i].id}-${i}`} question={questions[i]} index={i} total={n} results={answers.map((a) => a.correct)} t={t} onAnswer={answered} onClose={back} />;
  } else {
    const score = speakItScore(answers);
    const finishes = score.passed ? unitFinishedBy(section.id, journey.stops) : null;
    body = (
      <Result
        section={section}
        unit={unit}
        answers={answers}
        score={score}
        t={t}
        onTryAgain={() => { setAnswers([]); setRound((r) => r + 1); setPhase('intro'); }}
        onContinue={() => navigate(finishes ? `/course/unit/${finishes}/done` : `/course?unit=${unit.id}`, finishes ? { state: { justFinished: true } } : undefined)}
      />
    );
  }
  return <div dir={rtl ? 'rtl' : 'ltr'}>{body}</div>;
}
