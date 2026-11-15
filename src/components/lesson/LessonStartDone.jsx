import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, Eye, Headphones, MessageCircle, Pencil, UserRound } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { StarIcon } from '@/components/pathways/StarsPill';
import { COLORS } from '@/lib/theme';
import { STEPS } from '@/lib/lessonPlayer';

// Lesson start (frame R32Lesson) and Lesson complete (frame R33LessonDone).

const ICONS = { listen: Headphones, teachBack: MessageCircle, readIt: Eye, writeIt: Pencil, officer: UserRound };

export function LessonStart({ lesson, question, results, t, onStart }) {
  const at = STEPS.findIndex((s) => !results[s]);
  const sub = {
    listen: t('sub_listen'),
    teachBack: t('sub_teachBack'),
    readIt: `“${lesson.steps.readIt.sentence}”`,
    writeIt: t('sub_writeIt'),
    officer: t('sub_officer'),
  };
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-3 max-w-lg w-full mx-auto">
        <section className="rounded-card bg-white border border-line p-5 flex items-center gap-4">
          <Amio mood="happy" size={64} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-base text-muted">{t('today_answer')}</p>
            <p className="mt-1 text-lg font-bold text-navy leading-snug" lang="en" dir="ltr">{question}</p>
          </div>
        </section>
        <ol className="list-none m-0 p-0 flex flex-col gap-3">
          {STEPS.map((s, i) => {
            const done = !!results[s];
            const current = i === at;
            const Icon = ICONS[s];
            return (
              <li key={s} aria-current={current ? 'step' : undefined} className={`flex items-center gap-4 rounded-card bg-white px-4 py-3 border-2 ${current ? 'border-red' : 'border-line'}`}>
                <span className={`grid place-items-center w-12 h-12 shrink-0 rounded-2xl ${done ? 'bg-denim text-white' : 'bg-tint text-denim'}`}>
                  {done ? <Check className="w-6 h-6" strokeWidth={3} aria-hidden="true" /> : <Icon className="w-6 h-6" aria-hidden="true" />}
                </span>
                <span className="min-w-0">
                  <span className="block text-lg font-bold text-navy">{i + 1} · {t(`step_${s}`)}</span>
                  <span className="block text-base text-muted break-words" dir="auto" lang={s === 'readIt' ? 'en' : undefined}>{sub[s]}</span>
                </span>
              </li>
            );
          })}
        </ol>
        <p className="mt-1 flex items-center gap-2 text-base text-muted">
          <span className="flex gap-0.5" aria-hidden="true">{[0, 1, 2].map((k) => <StarIcon key={k} className="w-5 h-5 text-gold" />)}</span>
          {t('three_stars')}
        </p>
      </div>
      <div className="sticky bottom-0 bg-page px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onStart}>
          {at > 0 ? t('continue_step', { step: t(`step_${STEPS[at]}`) }) : t('start_lesson')}
        </Button>
      </div>
    </div>
  );
}

export function LessonDone({ lesson, results, stars, goal, saves, t, onDoneForToday, onKeepGoing }) {
  useEffect(() => {
    if (stars > 0) confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, colors: [COLORS.gold, COLORS.red, COLORS.denim, COLORS.white], disableForReducedMotion: true });
  }, [stars]);

  const lines = {
    listen: t('did_listen'),
    teachBack: t('did_teach'),
    readIt: t('did_read', { sentence: lesson.steps.readIt.sentence }),
    writeIt: t('did_write', { sentence: lesson.steps.writeIt.sentence }),
    officer: t('did_officer'),
  };
  return (
    <div className="flex flex-col min-h-full">
      <section className="bg-navy text-white px-4 pt-10 pb-8 flex flex-col items-center gap-3 text-center">
        <Amio mood="cheer" size={110} onNavy />
        <h1 className="text-celebrate font-extrabold">{t('lesson_complete')}</h1>
        <p className="flex gap-2" aria-label={stars === 1 ? t('star_1') : t('stars_n', { n: stars })}>
          {[0, 1, 2].map((k) => <StarIcon key={k} className={`w-10 h-10 ${k < stars ? 'text-gold' : 'text-chip-navy'}`} />)}
        </p>
        <p className="text-base text-on-navy" dir="auto">{lesson.title} · {stars === 1 ? t('star_1') : t('stars_n', { n: stars })}</p>
      </section>
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <ul className="rounded-card bg-white border border-line p-5 list-none m-0 flex flex-col gap-4">
          {STEPS.map((s) => {
            const ok = results[s] === 'right' || results[s] === 'unchecked';
            return (
              <li key={s} className="flex items-center gap-3">
                <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-full ${ok ? 'bg-correct text-white' : 'bg-tint text-muted'}`}>
                  {ok ? <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /> : <span className="w-3 h-0.5 bg-muted rounded" aria-hidden="true" />}
                </span>
                <span className="min-w-0 text-base text-navy break-words" dir="auto">
                  {lines[s]}
                  {!ok && <span className="block text-small text-muted">{t('skipped')}</span>}
                </span>
              </li>
            );
          })}
        </ul>
        {goal && (
          <section className="rounded-card bg-white border border-line p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-navy">{t('todays_goal')}</h2>
              <span className="text-base font-bold text-correct">{t('goal_done', { done: Math.min(goal.done, goal.goal), goal: goal.goal })}</span>
            </div>
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${goal.goal}, minmax(0, 1fr))` }} aria-hidden="true">
              {Array.from({ length: goal.goal }).map((_, i) => <span key={i} className={`h-2.5 rounded-full ${i < goal.done ? 'bg-gold' : 'bg-tint'}`} />)}
            </div>
          </section>
        )}
        <p className="text-small text-muted text-center">{saves ? t('saved_note') : t('practice_note')}</p>
      </div>
      <div className="px-4 pb-6 flex flex-col gap-3 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onDoneForToday}>{t('done_for_today')}</Button>
        {onKeepGoing && <Button variant="second" className="w-full" onClick={onKeepGoing}>{t('keep_going')}</Button>}
      </div>
    </div>
  );
}
