import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ChevronRight } from 'lucide-react';
import { Amio, AmioSays } from '@/components/pathways/Amio';
import { Button, MAIN_PRESS } from '@/components/pathways/ui';
import { firstName, timeOfDay } from '@/lib/todayView';
import { amioLineKey } from '@/lib/dailyPlan';
import { readinessTiles } from '@/lib/interviewReadiness';
import { coursePlay } from '@/api/coursePlay';
import useToday, { useTodayText } from '@/components/today/useToday';
import useReadinessData from '@/components/shell/useReadinessData';
import { PROCESSING_TIMES, canSeeSampleOffices, savedRange } from '@/lib/interviewEstimate';

// Today (Amio v2, frame Today): the plan comes first. Amio greets the learner
// (the sign-in first name, shown only) with one line, then today's lesson
// (the current stop of the Course road) on a navy card with a gold Start,
// then the four parts of the test as tiles from what the app already saves
// (src/lib/interviewReadiness.js): Civics = civics answers mastered of 128,
// Speaking = the latest practice interview score, Reading and Writing = the
// quick-check level in words. "Today" marks today's lesson's part (the
// course is civics). Then the Review chest. No stars, no minutes, no
// "interview likely" line yet (a later prompt adds it). `sheetTop` holds the
// pilot check-in card.

const TILE_LOOK = {
  reading: ['bg-denim text-white', 'border-denim'],
  writing: ['bg-gold text-navy', 'border-gold'],
  civics: ['bg-sky text-navy', 'border-sky'],
  speaking: ['bg-white text-navy', 'border-line'],
};

function GoalBar({ goal, done, t, saves }) {
  if (!goal) {
    return (
      <Link to="/plan" className="self-start min-h-tap inline-flex items-center px-1 text-base font-semibold text-denim underline underline-offset-4 hover:text-navy rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
        {t('set_goal')}
      </Link>
    );
  }
  const label = saves
    ? (goal === 1 ? t('goal_bar_1', { done }) : t('goal_bar', { goal, done }))
    : (goal === 1 ? t('goal_only_1') : t('goal_only', { goal }));
  return (
    <Link to="/plan" className="flex items-center gap-3 rounded-button -mx-1 px-1 min-h-tap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim" aria-label={`${label}. ${t('your_plan')}`}>
      <span className="flex gap-1.5 shrink-0" aria-hidden="true">
        {Array.from({ length: goal }).map((_, i) => (
          <span key={i} className={`h-2.5 w-10 rounded-full ${i < done ? 'bg-gold' : 'bg-line'}`} />
        ))}
      </span>
      <span className="text-base text-muted">{label}</span>
    </Link>
  );
}

function Tile({ tile, t, today }) {
  let value;
  if (tile.kind === 'level') value = tile.level ? t(`level_${tile.level}`) : t('not_checked');
  else if (tile.kind === 'percent') value = tile.value === null ? t('no_practice_yet') : `${tile.value}%`;
  else value = `${Math.round((tile.value / (tile.total || 128)) * 100)}%`;
  const big = tile.kind !== 'level' && !(tile.kind === 'percent' && tile.value === null);
  return (
    <div className={`min-h-[6.5rem] rounded-card border-[2.5px] p-4 flex flex-col justify-between gap-2 ${TILE_LOOK[tile.id][0]} ${today ? 'border-navy' : TILE_LOOK[tile.id][1]}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-lg font-semibold">{t(`part_${tile.id}`)}</p>
        {today && <span className="shrink-0 rounded-button bg-white px-2 py-0.5 text-small font-bold text-navy">{t('today_tag')}</span>}
      </div>
      <p className={big ? 'font-display text-[2.25rem] leading-none tabular-nums' : 'text-lg font-bold leading-tight'}>{value}</p>
    </div>
  );
}

export default function TodayPage({ user, sheetTop, quickCheckFirst = false }) {
  const navigate = useNavigate();
  const { t, rtl, language } = useTodayText();
  const day = useToday();
  const readiness = useReadinessData();
  const name = firstName(user);
  const greeting = name ? t(`good_${timeOfDay(new Date())}`, { name }) : t('welcome');
  const line = amioLineKey(day.goal, day.doneToday);
  const lesson = day.lesson;
  // "Case likely done …": only when the learner picked a field office and a
  // filing month on this device ("When's my interview?"); estimate only.
  const caseRange = savedRange(PROCESSING_TIMES, { showSamples: canSeeSampleOffices(user) });
  const monthName = (d) => d.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'short', year: 'numeric' });
  const { tiles } = readinessTiles(readiness || {});
  const order = ['reading', 'writing', 'civics', 'speaking'];
  const shown = order.map((id) => tiles.find((x) => x.id === id)).filter(Boolean);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 flex flex-col gap-4">
        <h1 className="sr-only" dir="auto">{greeting}</h1>
        <AmioSays mood="hello" size={64}>{t('amio_greeting', { greeting, line: t(line.key, line.vars) })}</AmioSays>
        {!day.loading && <GoalBar goal={day.goal} done={day.doneToday} t={t} saves={coursePlay.saves} />}

        {sheetTop}

        {quickCheckFirst && (
          <section className="rounded-card bg-white border border-line p-5 flex flex-col gap-3">
            <h2 className="text-lg font-bold">{t('quick_check_title')}</h2>
            <p className="text-base text-muted">{t('quick_check_body')}</p>
            <Button variant="main" className="w-full" onClick={() => navigate('/quick-check')}>{t('quick_check')}</Button>
          </section>
        )}

        {!day.loading && lesson && (
          <section className="rounded-card bg-navy text-white p-5 flex flex-col gap-3">
            <p className="text-base font-semibold text-sky" dir="auto">
              {t('lesson_of', { section: lesson.section.title, n: lesson.number, of: lesson.of })}
              {lesson.lesson.status === 'draft' && ` · ${t('draft')}`}
            </p>
            <h2 className="font-display text-[2.25rem] leading-[1.05] tracking-tight" dir="auto">{lesson.lesson.title}</h2>
            {caseRange && <p className="text-base text-on-navy">{t('case_likely', { from: monthName(caseRange.from), to: monthName(caseRange.to) })}</p>}
            {!quickCheckFirst && (
              <button
                type="button"
                onClick={() => navigate(`/course/lesson/${lesson.lesson.id}`)}
                className={`mt-2 w-full min-h-main mb-[5px] rounded-button bg-gold px-6 text-lg font-extrabold text-navy ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy`}
              >
                {t('start')}
              </button>
            )}
          </section>
        )}

        {!day.loading && !lesson && (
          <section className="rounded-card bg-white border border-line p-5 flex items-center gap-4">
            <Amio mood="proud" size={64} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold">{t('all_done_title')}</h2>
              <p className="text-base text-muted">{t('all_done_body')}</p>
              <Link to="/study?tab=practice" className="mt-2 inline-flex min-h-tap items-center font-semibold text-denim underline underline-offset-4">{t('practice')}</Link>
            </div>
          </section>
        )}

        {readiness && (
          <div className="grid grid-cols-2 gap-2">
            {shown.map((tile) => <Tile key={tile.id} tile={tile} t={t} today={!!lesson && tile.id === 'civics'} />)}
          </div>
        )}

        <Link
          to="/review-chest"
          className="flex items-center gap-4 rounded-card bg-white border border-line px-4 py-4 hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
        >
          <span className="grid place-items-center w-14 h-14 shrink-0 rounded-button bg-stop-chest border-2 border-stop-chest-border text-navy">
            <Package className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-lg font-bold">{t('review_chest')}</span>
            <span className="block text-base text-muted">
              {day.due === 0 ? t('review_none') : day.due === 1 ? t('review_due_1') : t('review_due', { n: day.due })}
            </span>
          </span>
          <ChevronRight className="w-5 h-5 text-muted rtl:rotate-180" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
