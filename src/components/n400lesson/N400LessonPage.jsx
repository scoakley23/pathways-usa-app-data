import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { BookOpen, Check, FileSearch, Hand, MessageCircle, Scale, Users } from 'lucide-react';
import { auth } from '@/api/auth';
import { coursePlay } from '@/api/coursePlay';
import { n400Progress } from '@/api/interview';
import { UNITS } from '@/lib/course';
import { canSeeDrafts } from '@/lib/journey';
import { lawyerIf } from '@/lib/n400View';
import { CONFETTI_COLORS } from '@/lib/theme';
import {
  N400_LESSON_STEPS, N400_RULES, findN400Lesson, lessonSection, n400LessonVisible, n400StarsFor, questionName,
} from '@/lib/n400Lessons';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import usePackLookup from '@/components/course/usePackLookup';
import { Amio, AmioSays } from '@/components/pathways/Amio';
import { Button, MAIN_LINK } from '@/components/pathways/ui';
import { LessonHeader } from '@/components/lesson/lessonParts';
import { N400_LESSON_LINES } from '@/components/n400lesson/n400LessonStrings';
import { AskForHelp, ListenN400, SameQuestion, SayWhatItAsks, SpotWord } from '@/components/n400lesson/N400Steps';

// An N-400 lesson (/course/n400/:lessonId), full screen like the course's
// lesson player: start → Listen → Same question? → Spot the word → Say what
// it asks → Ask for help → finish. Teaches understanding the questions only:
// nothing about the learner is asked, and what they say is never kept.
// Saves (Supabase only, src/api/coursePlay.js) the lesson's steps and stars
// after each step, and on finishing marks the guide section read.

const ICONS = { listen: BookOpen, same: Users, spot: FileSearch, say: MessageCircle, help: Hand };

function Start({ section, results, t, onStart }) {
  const at = N400_LESSON_STEPS.findIndex((s) => !results[s]);
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-3 max-w-lg w-full mx-auto">
        <section className="rounded-card bg-white border border-line p-5 flex items-start gap-4">
          <Amio mood="happy" size={64} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-base text-muted">{t('today_learn')}</p>
            <ul className="mt-1 list-disc ps-5 text-base font-semibold text-navy" lang="en" dir="ltr">
              {section.questions.slice(0, 4).map((q) => <li key={q.id}>{questionName(q.id)}</li>)}
              {section.questions.length > 4 && <li>…</li>}
            </ul>
          </div>
        </section>
        <p className="rounded-card bg-tint px-4 py-3 text-base text-navy">{t('never_answers')}</p>
        <ol className="list-none m-0 p-0 flex flex-col gap-3">
          {N400_LESSON_STEPS.map((s, i) => {
            const done = !!results[s];
            const current = i === at;
            const Icon = ICONS[s];
            return (
              <li key={s} aria-current={current ? 'step' : undefined} className={`flex items-center gap-4 rounded-card bg-white px-4 py-3 border-2 ${current ? 'border-gold' : 'border-line'}`}>
                <span className={`grid place-items-center w-12 h-12 shrink-0 rounded-2xl ${done ? 'bg-denim text-white' : 'bg-tint text-denim'}`}>
                  {done ? <Check className="w-6 h-6" strokeWidth={3} aria-hidden="true" /> : <Icon className="w-6 h-6" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-navy">{i + 1} · {t(`step_${s}`)}</span>
                  <span className="block text-base text-muted break-words" dir="auto">{t(`sub_${s}`)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onStart}>
          {at > 0 ? t('continue_step', { step: t(`step_${N400_LESSON_STEPS[at]}`) }) : t('start_lesson')}
        </Button>
      </div>
    </div>
  );
}

// The finish's truth line: "If yes might be true…" unless some of the
// section's cards expect a yes (the Oath promises, `lawyerIf: 'no'`).
const truthLine = (section) => ((section?.questions || []).some((q) => lawyerIf(q) === 'no') ? 'amio_truth_mixed' : 'amio_truth');

function Done({ title, results, t, saves, onDoneForToday, onBack, truthKey = 'amio_truth' }) {
  const stars = n400StarsFor(results);
  useEffect(() => {
    if (stars > 0) confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, colors: CONFETTI_COLORS, disableForReducedMotion: true });
  }, [stars]);
  return (
    <div className="flex flex-col min-h-full">
      <section className="bg-navy text-white px-4 pt-10 pb-8 flex flex-col items-center gap-3 text-center">
        <Amio mood="cheer" size={110} onNavy />
        <h1 className="text-celebrate font-extrabold">{t('lesson_complete')}</h1>
        <p className="text-base text-on-navy" dir="auto">{title}</p>
      </section>
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <ul className="rounded-card bg-white border border-line p-5 list-none m-0 flex flex-col gap-4">
          {N400_LESSON_STEPS.map((s) => {
            const ok = results[s] === 'right';
            return (
              <li key={s} className="flex items-center gap-3">
                <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-full ${ok ? 'bg-correct text-white' : 'bg-tint text-muted'}`}>
                  {ok ? <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /> : <span className="w-3 h-0.5 bg-muted rounded" aria-hidden="true" />}
                </span>
                <span className="min-w-0 text-base text-navy break-words" dir="auto">
                  {t(`did_${s}`)}
                  {results[s] === 'skipped' && <span className="block text-small text-muted">{t('skipped')}</span>}
                </span>
              </li>
            );
          })}
        </ul>
        <AmioSays mood="kind" size={56}>{t(truthKey)}</AmioSays>
        <Link to="/lawyer-first" className="min-h-main inline-flex items-center justify-center gap-2 rounded-button border-2 border-not-yet bg-white px-4 text-base font-bold text-navy hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          <Scale className="w-5 h-5" aria-hidden="true" />{t('lawyer')}
        </Link>
        <p className="text-small text-muted text-center">{saves ? t('saved_note') : t('practice_note')}</p>
      </div>
      <div className="px-4 pb-6 flex flex-col gap-3 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onDoneForToday}>{t('done_for_today')}</Button>
        <Button variant="second" className="w-full" onClick={onBack}>{t('back_to_road')}</Button>
      </div>
    </div>
  );
}

export default function N400LessonPage() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(N400_LESSON_LINES, language, { cacheKey: 'n400_lesson_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || N400_LESSON_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const rtl = RTL_LANGUAGES.includes(language);
  const tx = usePackLookup(language);
  const lesson = findN400Lesson(lessonId);
  const section = lesson ? lessonSection(lesson) : null;
  const unit = UNITS.find((u) => u.id === lesson?.unitId);

  const [user, setUser] = useState(undefined);
  const [phase, setPhase] = useState('start'); // start | step | done
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState({});

  useEffect(() => {
    let active = true;
    auth.me().then((u) => { if (active) setUser(u || null); }).catch(() => { if (active) setUser(null); });
    return () => { active = false; };
  }, []);
  useEffect(() => { setPhase('start'); setStepIndex(0); setResults({}); }, [lessonId]);

  const back = () => navigate(unit ? `/course?unit=${unit.id}` : '/course');
  if (user === undefined) return <div className="min-h-screen bg-paper" />;

  if (!lesson || !section || !n400LessonVisible(lesson, canSeeDrafts(user))) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper">
        <LessonHeader title={t('not_found')} onClose={back} closeLabel={t('close')} />
        <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
          <AmioSays mood="kind" size={64}>{t('not_found')}</AmioSays>
          <Link to="/course" className={`${MAIN_LINK} px-6 text-base`}>{t('back_to_road')}</Link>
        </div>
      </div>
    );
  }

  const title = tx ? tx(lesson.title) : lesson.title;
  const subtitle = [unit ? t('unit_label', { unit: unit.number }) : null, lesson.status === 'draft' ? t('draft') : null].filter(Boolean).join(' · ');

  const finishStep = (result) => {
    const step = N400_LESSON_STEPS[stepIndex];
    const next = { ...results, [step]: result };
    setResults(next);
    coursePlay.saveRun(lesson.id, next, new Date(), N400_RULES).catch(() => {});
    if (stepIndex + 1 < N400_LESSON_STEPS.length) {
      setStepIndex(stepIndex + 1);
      window.scrollTo?.(0, 0);
      return;
    }
    setPhase('done');
    window.scrollTo?.(0, 0);
    // Finishing also marks the guide section read (section id and date only).
    if (user) {
      n400Progress.list()
        .then((rows) => n400Progress.markRead(rows.find((r) => r.section_id === section.id) || null, { sectionId: section.id, title: section.title }))
        .catch(() => {});
    }
  };

  if (phase === 'done') {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper">
        <Done title={title} truthKey={truthLine(section)} results={results} t={t} saves={coursePlay.saves} onDoneForToday={() => navigate('/done-today')} onBack={back} />
      </div>
    );
  }

  let header = { title, subtitle, step: null };
  let body;
  if (phase === 'start') {
    body = <Start lesson={lesson} section={section} results={results} t={t} onStart={() => { setStepIndex(Math.max(0, N400_LESSON_STEPS.findIndex((s) => !results[s]))); setPhase('step'); }} />;
  } else {
    const step = N400_LESSON_STEPS[stepIndex];
    header = { title: t('step_of', { n: stepIndex + 1, name: t(`step_${step}`) }), subtitle: title, step: stepIndex + 1 };
    const k = `${lesson.id}-${step}`;
    const common = { lesson, t, onDone: finishStep };
    if (step === 'listen') body = <ListenN400 key={k} {...common} section={section} language={language} />;
    if (step === 'same') body = <SameQuestion key={k} {...common} />;
    if (step === 'spot') body = <SpotWord key={k} {...common} />;
    if (step === 'say') body = <SayWhatItAsks key={k} {...common} />;
    if (step === 'help') body = <AskForHelp key={k} {...common} language={language} />;
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper flex flex-col">
      <LessonHeader title={header.title} subtitle={header.subtitle} step={header.step} onClose={back} closeLabel={t('close')} />
      <div className="flex-1 flex flex-col">{body}</div>
    </div>
  );
}
