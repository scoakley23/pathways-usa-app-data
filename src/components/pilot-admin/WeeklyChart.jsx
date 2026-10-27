import React from 'react';
import { SMALL_NUMBER_LIMIT, isSmall } from '../../../base44/shared/pilotReport.js';

// Weekly active learners: one series, thin navy bars from the baseline,
// a hover/focus label on each bar, and the same numbers as a table below.
// In Partner view a week with 1–4 learners is drawn as a dashed outline at
// the "fewer than 5" height, so the bar doesn't give the number away.
export default function WeeklyChart({ weeks, partner = false }) {
  if (weeks.length === 0) return <p className="text-base text-pw-muted">No activity yet.</p>;
  const shown = weeks.slice(-26);
  const max = Math.max(SMALL_NUMBER_LIMIT, ...shown.map((w) => w.count));
  const label = (w) => (partner && isSmall(w.count) ? `fewer than ${SMALL_NUMBER_LIMIT}` : String(w.count));

  return (
    <figure className="space-y-3 overflow-x-clip">
      <div className="flex items-end gap-1 h-40 border-b border-pw-line" role="img" aria-label={`Weekly active learners, ${shown.length} weeks. The table below has the numbers.`}>
        {shown.map((w, i) => {
          const edge = i < 3 ? 'left-0' : i >= shown.length - 3 ? 'right-0' : 'left-1/2 -translate-x-1/2';
          const hidden = partner && isSmall(w.count);
          const height = `${Math.max(4, ((hidden ? SMALL_NUMBER_LIMIT : w.count) / max) * 100)}%`;
          return (
            <div key={w.week} className="group relative flex-1 h-full flex items-end min-w-[6px]" tabIndex={0} aria-label={`${w.week}: ${label(w)}`}>
              <div
                className={`w-full max-w-[24px] mx-auto rounded-t ${hidden ? 'border-2 border-dashed border-pw-civics bg-transparent' : 'bg-pw-civics'}`}
                style={{ height }}
              />
              <span className={`pointer-events-none absolute bottom-full ${edge} mb-1 whitespace-nowrap rounded-lg bg-pw-navy px-2 py-1 text-sm text-white opacity-0 group-hover:opacity-100 group-focus:opacity-100`}>
                {w.week}: {label(w)}
              </span>
            </div>
          );
        })}
      </div>
      <figcaption className="flex justify-between text-sm text-pw-muted">
        <span>{shown[0].week}</span>
        <span>{shown[shown.length - 1].week}</span>
      </figcaption>
      <details className="text-base">
        <summary className="cursor-pointer min-h-11 inline-flex items-center font-semibold text-pw-navy">Show as a table</summary>
        <table className="mt-2 w-full text-left text-base">
          <thead><tr className="text-pw-muted"><th className="font-semibold py-1">Week</th><th className="font-semibold py-1">Active learners</th></tr></thead>
          <tbody>
            {shown.map((w) => (
              <tr key={w.week} className="border-t border-pw-line"><td className="py-1">{w.week}</td><td className="py-1">{label(w)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
