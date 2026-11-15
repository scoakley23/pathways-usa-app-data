import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, Headphones, MessageCircle, Package, Pencil, UserRound, ChevronRight } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import StarsPill from '@/components/pathways/StarsPill';
import { Button } from '@/components/pathways/ui';
import { StopIcon } from '@/components/course/courseShared';
import { firstName, timeOfDay } from '@/lib/todayView';
import { amioLineKey } from '@/lib/dailyPlan';
import { coursePlay } from '@/api/coursePlay';
import useToday, { useTodayText } from '@/components/today/useToday';

// Today (Prompt 7, frame R33Today): the plan comes first. On navy: the
// greeting (the sign-in first name, shown only), stars and today's goal bar.
// Below: today's lesson (the current stop of the Course road) in a small
// sky-and-grass scene with Amio's one line, the 5 step chips and Start; the
// Review chest (questions due). No text box. The Holiday bonus card in the
// frame is left out (no data). `sheetTop` holds the pilot check-in card.

const STEP_CHIPS = [
  ['step_listen', Headphones], ['step_teach', MessageCircle], ['step_read', Eye], ['step_write', Pencil], ['step_officer', UserRound],
];

function GoalBar({ goal, done, t, saves }) {
  if (!goal) {
    return (
      <Link to="/plan" className="self-start min-h-tap inline-flex items-center gap-1 rounded-full px-1 text-base font-semibold text-on-navy underline underline-offset-4 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        {t('set_goal')}
      </Link>
    );
  }
  const label = saves
    ? (goal === 1 ? t('goal_bar_1', { done }) : t('goal_bar', { goal, done }))
    : (goal === 1 ? t('goal_only_1') : t('goal_only', { goal }));
  return (
    <Link to="/plan" className="flex items-center gap-3 rounded-2xl -mx-1 px-1 min-h-tap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white" aria-label={`${label}. ${t('your_plan')}`}>
      <span className="flex gap-1.5 shrink-0" aria-hidden="true">
        {Array.from({ length: goal }).map((_, i) => (
          <span key={i} className={`h-2.5 w-10 rounded-full ${i < done ? 'bg-gold' : 'bg-white'}`} />
        ))}
      </span>
      <span className="text-base text-on-navy">{label}</span>
    </Link>
  );
}

function Scene({ unitIcon, line }) {
  return (
    <div className="relative h-44 bg-sky overflow-hidden" aria-hidden="true">
      <svg className="absolute inset-x-0 bottom-0 w-full h-20" viewBox="0 0 100 40" preserveAspectRatio="none" focusable="false">
        <path d="M0 18 C30 6 60 4 100 14 L100 40 L0 40 Z" className="fill-grass" />
      </svg>
      <svg viewBox="0 0 60 24" className="absolute w-14 h-6 top-5 start-[38%]" focusable="false">
        <path d="M10 22h40a8 8 0 0 0 0-16 12 12 0 0 0-22-2 9 9 0 0 0-18 4 7 7 0 0 0 0 14z" className="fill-white" />
      </svg>
      <span className="absolute start-6 top-1/2 -translate-y-1/2 grid place-items-center w-20 h-20 rounded-full bg-red text-navy ring-4 ring-red ring-offset-4 ring-offset-sky">
        <StopIcon type="lesson" unitIcon={unitIcon} className="w-8 h-8" />
      </span>
      <div className="absolute end-4 top-4 flex flex-col items-end gap-1 max-w-[58%]">
        <p className="rounded-2xl border-2 border-red bg-white px-3 py-2 text-[15px] font-semibold leading-snug text-navy">{line}</p>
        <Amio mood="happy" size={56} />
      </div>
    </div>
  );
}

export default function TodayPage({ user, sheetTop, quickCheckFirst = false }) {
  const navigate = useNavigate();
  const { t, rtl } = useTodayText();
  const day = useToday();
  const name = firstName(user);
  const greeting = name ? t(`good_${timeOfDay(new Date())}`, { name }) : t('welcome');
  const line = amioLineKey(day.goal, day.doneToday);
  const lesson = day.lesson;

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-page">
      <header className="bg-navy text-white px-5 pt-6 pb-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-title font-bold break-words min-w-0" dir="auto">{greeting}</h1>
          <StarsPill count={day.stars} label={t('stars_n', { n: day.stars })} />
        </div>
        {!day.loading && <GoalBar goal={day.goal} done={day.doneToday} t={t} saves={coursePlay.saves} />}
      </header>

      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-4">
        {sheetTop}

        {quickCheckFirst && (
          <section className="rounded-card bg-white border border-line p-5 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-navy">{t('quick_check_title')}</h2>
            <p className="text-base text-muted">{t('quick_check_body')}</p>
            <Button variant="main" className="w-full" onClick={() => navigate('/quick-check')}>{t('quick_check')}</Button>
          </section>
        )}

        {!day.loading && lesson && (
          <>
            <section className="rounded-card bg-white border border-line overflow-hidden">
              <Scene unitIcon={lesson.unit.icon} line={t(line.key, line.vars)} />
              <div className="p-5 flex flex-col gap-3">
                <p className="text-small font-semibold uppercase tracking-wide text-muted" dir="auto">
                  {t('lesson_of', { section: lesson.section.title, n: lesson.number, of: lesson.of })}
                  {lesson.lesson.status === 'draft' && ` · ${t('draft')}`}
                </p>
                <h2 className="text-[24px] font-bold text-navy leading-tight" dir="auto">{lesson.lesson.title}</h2>
                <ul className="flex flex-wrap gap-2 list-none m-0 p-0">
                  {STEP_CHIPS.map(([key, Icon]) => (
                    <li key={key} className="inline-flex items-center gap-1.5 rounded-full bg-tint px-3 py-1.5 text-base font-semibold text-navy">
                      <Icon className="w-4 h-4" aria-hidden="true" />{t(key)}
                    </li>
                  ))}
                </ul>
              </div>
            </section>
            {!quickCheckFirst && <Button variant="main" className="w-full" onClick={() => navigate(`/course/lesson/${lesson.lesson.id}`)}>{t('start')}</Button>}
          </>
        )}

        {!day.loading && !lesson && (
          <section className="rounded-card bg-white border border-line p-5 flex items-center gap-4">
            <Amio mood="proud" size={64} className="shrink-0" />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-navy">{t('all_done_title')}</h2>
              <p className="text-base text-muted">{t('all_done_body')}</p>
              <Link to="/study?tab=practice" className="mt-2 inline-flex min-h-tap items-center font-semibold text-denim underline underline-offset-4">{t('practice')}</Link>
            </div>
          </section>
        )}

        <Link
          to="/review-chest"
          className="flex items-center gap-4 rounded-card bg-white border border-line px-4 py-4 hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
        >
          <span className="grid place-items-center w-14 h-14 shrink-0 rounded-2xl bg-stop-chest border-2 border-stop-chest-border text-navy">
            <Package className="w-6 h-6" aria-hidden="true" />
          </span>
          <span className="flex-1 min-w-0">
            <span className="block text-lg font-bold text-navy">{t('review_chest')}</span>
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
