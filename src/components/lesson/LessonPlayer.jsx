import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { auth } from '@/api/auth';
import { coursePlay } from '@/api/coursePlay';
import { UNITS, findLesson, questionRecord } from '@/lib/course';
import { canSeeDrafts, visibleCourse } from '@/lib/journey';
import { STEPS, starsFor } from '@/lib/lessonPlayer';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { AmioSays } from '@/components/pathways/Amio';
import { LESSON_LINES } from '@/components/lesson/lessonStrings';
import { LessonHeader } from '@/components/lesson/lessonParts';
import ListenStep, { useLessonTranslation } from '@/components/lesson/ListenStep';
import QuestionStep from '@/components/lesson/QuestionStep';
import ReadItStep from '@/components/lesson/ReadItStep';
import WriteItStep from '@/components/lesson/WriteItStep';
import { LessonDone, LessonStart } from '@/components/lesson/LessonStartDone';
import usePackLookup from '@/components/course/usePackLookup';

// The 5-step lesson player (Prompt 6, /course/lesson/:lessonId): Lesson start
// → Listen → Teach it back → Read it → Write it → Officer question → Lesson
// complete, with "Step N of 5" on the navy banner. Learners open only
// reviewed lessons; admins also drafts. Saves (Supabase only, via
// src/api/coursePlay.js) the lesson's progress after each step, missed
// questions into review at box 1, and the Write it level. Never audio or
// what the learner said.

export default function LessonPlayer() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LESSON_LINES, language, { cacheKey: 'lesson_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || LESSON_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const rtl = RTL_LANGUAGES.includes(language);

  const tx = usePackLookup(language);
  const found = findLesson(lessonId);
  const [user, setUser] = useState(undefined);
  const [phase, setPhase] = useState('start'); // start | step | done
  const [stepIndex, setStepIndex] = useState(0);
  const [results, setResults] = useState({});
  const [writeLevel, setWriteLevel] = useState(1);
  const [goal, setGoal] = useState(null);
  const wrotePass = useRef(false);

  useEffect(() => {
    let active = true;
    auth.me().then((u) => { if (active) setUser(u || null); }).catch(() => { if (active) setUser(null); });
    coursePlay.writeLevel().then((w) => { if (active) setWriteLevel(w.write_level); }).catch(() => {});
    return () => { active = false; };
  }, []);

  // Reset when moving to another lesson ("Keep going").
  useEffect(() => {
    setPhase('start'); setStepIndex(0); setResults({}); setGoal(null); wrotePass.current = false;
  }, [lessonId]);

  const lesson = found?.lesson;
  const mine = useLessonTranslation(lesson || { id: 'none', steps: { listen: { facts: [], newWords: [] } } }, lesson ? language : 'en');
  const showDrafts = canSeeDrafts(user);

  const nextLessonId = useMemo(() => {
    if (!lesson) return null;
    const all = visibleCourse(UNITS, { showDrafts }).flatMap((u) => u.sections.flatMap((s) => s.lessons.map((l) => l.id)));
    const i = all.indexOf(lesson.id);
    return i >= 0 ? all[i + 1] || null : null;
  }, [lesson, showDrafts]);

  const back = () => navigate(found ? `/course?unit=${found.unit.id}` : '/course');

  if (user === undefined) return <div className="min-h-screen bg-page" />;

  if (!lesson || (lesson.status !== 'reviewed' && !showDrafts)) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-page">
        <LessonHeader title={t('not_found')} onClose={back} closeLabel={t('close')} />
        <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-6">
          <AmioSays mood="kind" size={64}>{t('not_found')}</AmioSays>
          <Link to="/course" className="min-h-main inline-flex items-center justify-center rounded-button bg-denim px-6 text-base font-bold text-white shadow-lip">{t('back_to_road')}</Link>
        </div>
      </div>
    );
  }

  const unitNo = found.unit.number;
  const sectionNo = found.section.number || found.unit.sections.indexOf(found.section) + 1;
  const lessonNo = found.section.lessons.indexOf(lesson) + 1;
  const subtitle = [t('unit_section_lesson', { unit: unitNo, section: sectionNo, lesson: lessonNo }), lesson.status === 'draft' ? t('draft') : null].filter(Boolean).join(' · ');
  const teachQ = questionRecord(lesson.steps.teachBack.questionId);
  const officerQ = questionRecord(lesson.steps.officer.questionId);
  const hint = (mine && mine.f0) || lesson.steps.listen.facts[0] || '';

  const finishStep = (result) => {
    const step = STEPS[stepIndex];
    const next = { ...results, [step]: result };
    setResults(next);
    coursePlay.saveRun(lesson.id, next).catch(() => {});
    if (stepIndex + 1 < STEPS.length) {
      setStepIndex(stepIndex + 1);
      window.scrollTo?.(0, 0);
      return;
    }
    setPhase('done');
    window.scrollTo?.(0, 0);
    const ids = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).map((l) => l.id)));
    coursePlay.todayGoal(ids).then(setGoal).catch(() => {});
  };
  const missed = (questionId) => { coursePlay.missed(questionId).catch(() => {}); };
  const written = (passed) => {
    if (!passed || wrotePass.current) return;
    wrotePass.current = true;
    coursePlay.afterWriteIt(true).catch(() => {});
  };

  let body;
  const lessonTitle = tx ? tx(lesson.title) : lesson.title;
  let header = { title: lessonTitle, subtitle, step: null };
  if (phase === 'start') {
    body = (
      <LessonStart
        lesson={lesson}
        question={teachQ?.question}
        results={results}
        t={t}
        onStart={() => { setStepIndex(Math.max(0, STEPS.findIndex((s) => !results[s]))); setPhase('step'); }}
      />
    );
  } else if (phase === 'done') {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-page">
        <LessonDone
          lesson={{ ...lesson, title: lessonTitle }}
          results={results}
          stars={starsFor(results)}
          goal={goal}
          saves={coursePlay.saves}
          t={t}
          onDoneForToday={() => navigate('/done-today')}
          onKeepGoing={nextLessonId ? () => navigate(`/course/lesson/${nextLessonId}`) : null}
        />
      </div>
    );
  } else {
    const step = STEPS[stepIndex];
    header = { title: t('step_of', { n: stepIndex + 1, name: t(`step_${step}`) }), subtitle: lessonTitle, step: stepIndex + 1 };
    const k = `${lesson.id}-${step}`;
    const common = { t, onDone: finishStep };
    if (step === 'listen') body = <ListenStep key={k} {...common} lesson={lesson} language={language} />;
    if (step === 'teachBack') body = <QuestionStep key={k} {...common} kind="teach" question={teachQ} hint={hint} language={language} savesReview={coursePlay.saves} onMiss={missed} />;
    if (step === 'readIt') body = <ReadItStep key={k} {...common} lesson={lesson} />;
    if (step === 'writeIt') body = <WriteItStep key={k} {...common} lesson={lesson} level={writeLevel} onWritten={written} />;
    if (step === 'officer') body = <QuestionStep key={k} {...common} kind="officer" question={officerQ} language={language} savesReview={coursePlay.saves} onMiss={missed} />;
  }

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-page flex flex-col">
      <LessonHeader title={header.title} subtitle={header.subtitle} step={header.step} onClose={back} closeLabel={t('close')} />
      <div className="flex-1 flex flex-col">{body}</div>
    </div>
  );
}
