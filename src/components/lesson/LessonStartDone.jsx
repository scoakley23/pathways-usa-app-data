import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, Eye, Headphones, MessageCircle, Pencil, UserRound } from 'lucide-react';
import { Amio, AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { CONFETTI_COLORS } from '@/lib/theme';
import { STEPS, rightOf } from '@/lib/lessonPlayer';
import RedStop from '@/components/pathways/RedStop';
import WeekSquares from '@/components/today/WeekSquares';
import { goalMet } from '@/lib/todayView';

// Lesson start (frame R32Lesson; no stars shown, Amio v2) and Lesson done
// (Amio v2 frame LessonDone).

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
              <li key={s} aria-current={current ? 'step' : undefined} className={`flex items-center gap-4 rounded-card bg-white px-4 py-3 border-2 ${current ? 'border-gold' : 'border-line'}`}>
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
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onStart}>
          {at > 0 ? t('continue_step', { step: t(`step_${STEPS[at]}`) }) : t('start_lesson')}
        </Button>
      </div>
    </div>
  );
}

// Lesson done (Amio v2): Amio proud with one line ("You did it! Next: …"),
// "Lesson done." and the numbers we have: Right n of m (this run, in
// memory), You know n of 128 (mastered civics answers, user_progress), this
// week's days, and today's goal when set. No time, no stars, no before/after
// percent. Confetti in gold, sky, denim and navy whenever the lesson ends.
function Tile({ className, label, value, note }) {
  return (
    <div className={`flex-1 min-w-0 rounded-card px-4 py-3 ${className}`}>
      <p className="text-sm">{label}</p>
      <p className="mt-1 font-display text-[1.75rem] leading-none tabular-nums">{value}</p>
      {note && <p className="mt-1 text-sm">{note}</p>}
    </div>
  );
}

export function LessonDone({ results, goal, saves, t, know, week, nextTitle, onDoneForToday, onKeepGoing }) {
  useEffect(() => {
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.3 }, colors: CONFETTI_COLORS, disableForReducedMotion: true });
  }, []);
  const score = rightOf(results);
  const days = week?.count ?? null;

  return (
    <div className="flex flex-col min-h-full bg-paper text-navy">
      <div className="flex-1 px-4 pt-8 pb-4 flex flex-col gap-5 max-w-lg w-full mx-auto">
        <AmioSays mood="proud" size={72}>{nextTitle ? t('done_amio_next', { lesson: nextTitle }) : t('done_amio')}</AmioSays>
        <h1 dir="auto" className="font-display text-[2.75rem] leading-none tracking-tight"><RedStop>{t('lesson_done')}</RedStop></h1>
        <div className="flex gap-2">
          {score.of > 0 && <Tile className="bg-denim text-white" label={t('stat_right')} value={t('n_of_total', { n: score.right, total: score.of })} />}
          {know && <Tile className="bg-gold text-navy" label={t('stat_know')} value={t('n_of_total', { n: know.n, total: know.total })} note={t('know_note')} />}
        </div>
        <WeekSquares
          week={week}
          goalMet={!!goal && goalMet(goal.goal, goal.done)}
          label={days === 1 ? t('days_week_1') : t('days_week_n', { n: days })}
          metLabel={t('goal_met')}
        />
        {goal && (
          <section className="rounded-card bg-white border border-line p-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold">{t('todays_goal')}</h2>
              <span className="text-base font-bold">{t('goal_done', { done: Math.min(goal.done, goal.goal), goal: goal.goal })}</span>
            </div>
            <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${goal.goal}, minmax(0, 1fr))` }} aria-hidden="true">
              {Array.from({ length: goal.goal }).map((_, i) => <span key={i} className={`h-2.5 rounded-full ${i < goal.done ? 'bg-gold' : 'bg-line-soft'}`} />)}
            </div>
          </section>
        )}
        <p className="text-small text-muted">{saves ? t('saved_note') : t('practice_note')}</p>
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 flex flex-col items-center gap-2 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onDoneForToday}>{t('done_for_today')}</Button>
        {onKeepGoing && <Button variant="link" onClick={onKeepGoing}>{t('one_more_lesson')}</Button>}
      </div>
    </div>
  );
}
