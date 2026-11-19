import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { checkpointProgress } from '@/lib/dailyPlan';
import { CHEST_SIZE } from '@/lib/checkpoints';
import useToday, { useTodayText } from '@/components/today/useToday';

// Done for today (Prompt 7, frame R30Done): lessons finished today, stars
// earned today, the kind streak (days in a row; one missed day a week is a
// rest day), progress toward the section's Speak it! checkpoint, tomorrow's
// lesson, "Back to home" and, when questions are due, "Review n questions".
// No minutes (the app doesn't time anything) and no reminder time.

function Stat({ value, label }) {
  return (
    <div className="flex-1 min-w-0 rounded-card bg-white border border-line px-3 py-4 text-center">
      <p className="text-[30px] font-extrabold text-navy tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-base text-muted">{label}</p>
    </div>
  );
}

export default function DoneTodayPage() {
  const navigate = useNavigate();
  const { t, rtl } = useTodayText();
  const day = useToday({ withStreak: true });
  const next = day.lesson; // the next lesson on the road is tomorrow's
  const cp = next ? checkpointProgress(next.section, day.progress) : null;
  const pct = cp && cp.total ? Math.round((cp.done / cp.total) * 100) : 0;
  const sub = day.doneToday === 0 ? t('done_sub_0') : day.doneToday === 1 ? t('done_sub_1') : t('done_sub_n', { n: day.doneToday });
  const reviewN = Math.min(CHEST_SIZE, day.due);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper flex flex-col">
      <section className="bg-navy text-white px-4 pt-10 pb-8 flex flex-col items-center gap-3 text-center">
        <Amio mood="proud" size={110} onNavy />
        <h1 className="text-celebrate font-extrabold">{t('done_title')}</h1>
        <p className="text-base text-on-navy">{sub}</p>
      </section>
      <div className="flex-1 max-w-lg w-full mx-auto px-4 py-5 flex flex-col gap-4">
        <div className="flex gap-3">
          <Stat value={`+${day.starsToday}`} label={t('stars_today')} />
          <Stat value={day.streak.days} label={day.streak.days === 1 ? t('day_in_a_row') : t('days_in_a_row')} />
        </div>
        {day.streak.days > 0 && <p className="text-small text-muted text-center">{t('rest_note')}</p>}

        {cp && (
          <section className="rounded-card bg-white border border-line p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-navy" dir="auto">{next.section.title}</h2>
              <span className="text-base font-bold text-navy tabular-nums">{t('lessons_of', { done: cp.done, total: cp.total })}</span>
            </div>
            <div className="mt-3 h-2.5 rounded-full bg-tint overflow-hidden" aria-hidden="true">
              <div className="h-full rounded-full bg-denim" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-3 text-base text-muted">
              {cp.left === 0 ? t('to_speak_0') : cp.left === 1 ? t('to_speak_1') : t('to_speak_n', { n: cp.left })}
            </p>
          </section>
        )}

        {next && (
          <section className="rounded-card bg-white border border-line p-5">
            <p className="text-small font-semibold uppercase tracking-wide text-muted">{t('tomorrow')}</p>
            <p className="mt-1 text-lg font-bold text-navy" dir="auto">{next.lesson.title}</p>
          </section>
        )}
      </div>
      <div className="px-4 pb-6 flex flex-col items-center gap-3 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={() => navigate('/')}>{t('back_home')}</Button>
        {reviewN > 0 && (
          <Link to="/review-chest" className="min-h-tap inline-flex items-center text-base font-semibold text-denim underline underline-offset-4">
            {reviewN === 1 ? t('review_more_1') : t('review_more', { n: reviewN })}
          </Link>
        )}
      </div>
    </div>
  );
}
