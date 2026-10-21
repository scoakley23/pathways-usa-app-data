import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Loader2, RotateCcw, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import TopicArt, { TOPIC_ART } from '@/components/art/TopicArt';
import TutorLesson from '@/components/persona/TutorLesson';
import TutorMessage from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import { languageNameFor } from '@/components/persona/languageName';
import { Eyebrow, PrimaryButton, RaisedCard, Tag } from '@/components/pathways/ui';
import useAppLanguage from '@/hooks/useAppLanguage';
import { splitOfficialAnswers } from '@/lib/practiceChecks';
import { dueForReview, nextReviewDate, nextSchedule } from '@/lib/spacedReview';

const linkClass = 'min-h-[52px] w-full rounded-2xl font-bold text-lg inline-flex items-center justify-center px-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2';

const say = (t, language) => ({ en: t.en, mine: language === 'es' ? t.es : null });

const LINES = {
  intro: (n) => ({
    en: `Let's check ${n === 1 ? '1 question' : `${n} questions`} you learned before. Answer each one out loud, in English. I'll show you how you did at the end.`,
    es: `Vamos a repasar ${n === 1 ? '1 pregunta' : `${n} preguntas`} que aprendió antes. Conteste cada una en voz alta, en inglés. Al final le muestro cómo le fue.`,
  }),
  nothingDue: {
    en: "Nothing to review today. That's fine: steady practice works best. You can learn a new question instead.",
    es: 'Hoy no hay nada que repasar. Está bien: practicar con calma funciona mejor. Puede aprender una pregunta nueva.',
  },
  done: (right, total) => ({
    en: right === total
      ? `Well done. You answered all ${total} correctly. I'll space them out a little more next time.`
      : `Thank you. You answered ${right} of ${total} correctly. Look at the answers below; we'll practice the others again soon.`,
    es: right === total
      ? `Muy bien. Contestó bien las ${total}. La próxima vez se las preguntaré con más tiempo entre repasos.`
      : `Gracias. Contestó bien ${right} de ${total}. Mire las respuestas abajo; pronto practicaremos las otras otra vez.`,
  }),
};

const whenLabel = (days) => (days <= 0 ? 'Again soon' : days === 1 ? 'Next check: tomorrow' : `Next check: in ${days} days`);

function SignInMessage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center space-y-4 px-4">
      <div className="w-20 h-20 rounded-3xl bg-pw-blue-soft flex items-center justify-center" aria-hidden="true">
        <CalendarCheck className="w-10 h-10 text-pw-blue-ink" />
      </div>
      <h2 className="text-2xl font-extrabold text-pw-navy">Sign in to review civics</h2>
      <p className="text-base text-pw-muted">Questions you learned come back when it&apos;s time to review them.</p>
    </div>
  );
}

// Spaced review (Prompt 7, step 4): due civics questions as quick checks,
// feedback for the whole set at the end, then the same SM-2 schedule as
// Practice. Saves only scores and the schedule; answers stay in memory.
export default function ReviewCivics() {
  const { profile, loaded } = useTutorProfile();
  const [language] = useAppLanguage();
  const [user, setUser] = useState(undefined);
  const [due, setDue] = useState(null); // [{ row, question }]
  const [nextDate, setNextDate] = useState(null);
  const [stage, setStage] = useState('intro'); // intro | lesson | done
  const [results, setResults] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setDue(null);
    try {
      const [rows, questions] = await Promise.all([
        base44.entities.UserProgress.filter({ user_email: user.email, content_type: 'civics_question' }, null, 1000),
        base44.entities.CivicsQuestion.list(null, 1000),
      ]);
      const byId = new Map(questions.filter((q) => q.answer).map((q) => [q.id, q]));
      const known = rows.filter((r) => byId.has(r.content_id));
      setDue(dueForReview(known).map((row) => ({ row, question: byId.get(row.content_id) })));
      setNextDate(nextReviewDate(known));
    } catch (e) {
      toast.error("Couldn't load your review. Please check your connection.");
      setDue([]);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const lesson = useMemo(() => (due ? {
    id: 'review-civics',
    title: 'Review civics',
    steps: due.map(({ question }) => ({ type: 'practice-speaking', question, mode: 'check', part: 'civics' })),
  } : null), [due]);

  const finish = async ({ states }) => {
    const now = new Date();
    const outcome = due.map(({ row, question }, i) => {
      const correct = !!states[i]?.outcome?.correct;
      return { row, question, correct, heard: states[i]?.heard || null, next: nextSchedule(row, correct, correct ? 100 : 0, now) };
    });
    setResults(outcome);
    setStage('done');
    window.scrollTo({ top: 0 });
    setSaving(true);
    try {
      for (const { row, next } of outcome) await base44.entities.UserProgress.update(row.id, next);
    } catch (e) {
      toast.error("Couldn't save your progress. Please check your connection.");
    } finally {
      setSaving(false);
    }
  };

  if (user === undefined || !loaded) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-pw-navy" />;
  if (!user) return <SignInMessage />;
  if (!lesson) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-16 text-pw-navy" />;

  if (stage === 'lesson') {
    return (
      <TutorLesson
        lesson={lesson}
        profile={profile}
        language={language}
        languageName={languageNameFor(language)}
        onFinish={finish}
        onExit={() => setStage('intro')}
      />
    );
  }

  const art = TOPIC_ART[due[0]?.question.category] || 'compass';
  const right = results.filter((r) => r.correct).length;

  return (
    <div className="max-w-xl mx-auto space-y-5 text-pw-navy">
      <div className="rounded-3xl bg-pw-blue-soft px-4 pt-4 pb-5">
        <TopicArt name={art} />
        <Tag tone="teal" className="mt-2">
          {stage === 'done' ? 'Your results' : due.length ? `${due.length} to review` : 'All caught up'}
        </Tag>
        <h1 className="text-[28px] leading-tight font-extrabold mt-3">Review civics</h1>
      </div>

      {stage === 'intro' && due.length > 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...say(LINES.intro(due.length), language)} />
          <PrimaryButton large className="w-full" onClick={() => { setStage('lesson'); window.scrollTo({ top: 0 }); }}>
            Start
          </PrimaryButton>
          <p className="text-sm text-pw-muted">We save only your scores and when to review. Your voice and your answers are not saved.</p>
          <Link to="/" className={`${linkClass} text-base min-h-[44px] hover:bg-pw-soft`}>Not now</Link>
        </>
      )}

      {stage === 'intro' && due.length === 0 && (
        <>
          <TutorMessage profile={profile} language={language} {...say(LINES.nothingDue, language)} />
          {nextDate && (
            <p className="text-base text-pw-muted">
              Your next review: {nextDate.toLocaleDateString(language === 'en' ? 'en-US' : language, { weekday: 'long', month: 'long', day: 'numeric' })}.
            </p>
          )}
          <Link to="/learn" className={`${linkClass} bg-pw-navy text-white hover:bg-[#0F1B36]`}>Learn a new question</Link>
          <Link to="/" className={`${linkClass} text-base min-h-[44px] hover:bg-pw-soft`}>Back to Today</Link>
        </>
      )}

      {stage === 'done' && (
        <>
          <TutorMessage profile={profile} language={language} {...say(LINES.done(right, results.length), language)} />
          <ul className="space-y-3">
            {results.map(({ question, correct, heard, next }) => (
              <li key={question.id}>
                <RaisedCard>
                  <Tag tone={correct ? 'green' : 'red'}>
                    {correct ? <><Check className="w-4 h-4" aria-hidden="true" /> Correct</> : <><RotateCcw className="w-4 h-4" aria-hidden="true" /> Practice again</>}
                  </Tag>
                  <p className="text-lg font-extrabold leading-snug mt-3">{question.question}</p>
                  {heard && <p className="mt-2 text-pw-muted">You said: <span className="italic">“{heard}”</span></p>}
                  <Eyebrow className="mt-4 mb-2">Accepted answers</Eyebrow>
                  <ul className="space-y-1">
                    {splitOfficialAnswers(question.answer).map((a) => <li key={a} className="font-bold">{a}</li>)}
                  </ul>
                  <p className="text-sm text-pw-muted mt-3">{whenLabel(next.interval)}</p>
                </RaisedCard>
              </li>
            ))}
          </ul>
          <Link to="/" aria-disabled={saving} className={`${linkClass} bg-pw-navy text-white hover:bg-[#0F1B36] ${saving ? 'pointer-events-none opacity-60' : ''}`}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin" aria-label="Saving" /> : 'Back to Today'}
          </Link>
          <Link to="/learn" className={`${linkClass} text-base min-h-[44px] hover:bg-pw-soft`}>Learn a new question</Link>
        </>
      )}
    </div>
  );
}
