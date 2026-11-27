import React from 'react';
import { Check } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { unitQuestionsDone, unitState } from '@/lib/journey';

// The road's centre line in a 1000 x 200 box: low under the topics that
// sit low (even places), high under the ones that sit high (odd places).
export function roadPath(n) {
  const x = (i) => Math.round(((i + 0.5) / n) * 1000);
  const y = (i) => (i % 2 === 0 ? 150 : 50);
  let d = `M0 ${y(0)} L${x(0)} ${y(0)}`;
  for (let i = 1; i < n; i += 1) {
    const mid = (x(i - 1) + x(i)) / 2;
    d += ` C${mid} ${y(i - 1)} ${mid} ${y(i)} ${x(i)} ${y(i)}`;
  }
  return `${d} L1000 ${y(n - 1)}`;
}

// The whole road (desktop vision B): on desktop (lg, 1024px+) the Civics part
// of the Course tab shows every topic along one wide winding road, with Amio
// standing at the suggested topic. Nothing is locked: tapping any topic opens
// it in the list below (`onPick`). Finished = navy with a gold check, the
// suggested topic = sky with a navy border, the rest white. Phones never see
// it (they have the list, as designed). The road mirrors in right-to-left.
export default function CourseRoad({ journey, masteredIds, t, onPick }) {
  const units = journey.course;
  if (!units.length) return null;
  return (
    <nav aria-label={t('road_title')} className="hidden lg:block relative rounded-card bg-sky-soft px-6 pt-6 pb-8 overflow-hidden">
      <h2 className="text-lg font-bold">{t('road_title')}</h2>
      {/* The road: a white band winding under the topics (decoration only). */}
      <svg viewBox="0 0 1000 200" preserveAspectRatio="none" className="absolute inset-x-6 top-[5.5rem] h-[13rem] w-[calc(100%-3rem)] rtl:-scale-x-100" aria-hidden="true" focusable="false">
        <path d={roadPath(units.length)} fill="none" strokeWidth="26" strokeLinecap="round" className="stroke-white" />
      </svg>
      <ol className="relative mt-4 grid gap-3 list-none m-0 p-0 h-[15rem]" style={{ gridTemplateColumns: `repeat(${units.length}, minmax(0, 1fr))` }}>
        {units.map((unit, i) => {
          const state = unitState(unit, journey.stops, journey.currentUnit);
          const questions = masteredIds ? unitQuestionsDone(unit, masteredIds) : null;
          const done = state === 'done';
          const current = state === 'current';
          const look = done ? 'bg-navy text-white border-navy' : current ? 'bg-sky text-navy border-navy border-[2.5px]' : 'bg-white text-navy border-line';
          return (
            <li key={unit.id} className={`flex flex-col items-center gap-1 ${i % 2 === 0 ? 'self-end' : 'self-start'}`}>
              {current && <Amio mood="hello" size={56} />}
              <button
                type="button"
                onClick={() => onPick(unit.id)}
                aria-current={current ? 'step' : undefined}
                className={`w-full min-h-[5.5rem] rounded-card border-[1.5px] px-3 py-2.5 text-start flex flex-col gap-1 hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-sky-soft ${look}`}
              >
                <span className={`flex items-center justify-between gap-1 text-small ${done ? 'text-on-navy' : current ? 'text-navy font-semibold' : 'text-muted'}`}>
                  {t('unit_n', { n: unit.number ?? i + 1 })}
                  {done && <Check className="w-5 h-5 shrink-0 text-gold" strokeWidth={3} aria-label={t('done')} />}
                </span>
                <span dir="auto" className="text-[0.9375rem] xl:text-base font-bold leading-tight hyphens-auto break-words">{unit.title}</span>
                {questions && questions.total > 0 && (
                  <span className={`text-small tabular-nums ${done ? 'text-on-navy' : current ? 'text-navy' : 'text-muted'}`}>{t('questions_of', { n: questions.done, total: questions.total })}</span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
