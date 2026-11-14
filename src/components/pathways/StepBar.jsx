import React from 'react';

// StepBar (on the navy banner): N segments, done = gold, current = white,
// upcoming = chip-navy (frames R33Listen, R33Teach). `current` is 1-based.
// Screen readers hear "Step 2 of 5".
export function StepBar({ total, current, label, className = '' }) {
  const n = Math.max(1, total || 1);
  const at = Math.min(Math.max(current || 1, 1), n);
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={n}
      aria-valuenow={at}
      aria-label={label || `Step ${at} of ${n}`}
      className={`grid gap-[5px] ${className}`}
      style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: n }, (_, i) => {
        const step = i + 1;
        const look = step < at ? 'bg-gold' : step === at ? 'bg-white' : 'bg-chip-navy';
        return <span key={step} aria-hidden="true" className={`h-2 rounded-full ${look}`} />;
      })}
    </div>
  );
}

// ProgressBar: denim on a tint track (on the page), or gold on chip-navy
// (`onNavy`). `value` and `max` are numbers; `label` is read aloud.
export function ProgressBar({ value = 0, max = 100, label, onNavy = false, className = '' }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-label={label}
      className={`h-2 rounded-full overflow-hidden ${onNavy ? 'bg-chip-navy' : 'bg-tint'} ${className}`}
    >
      <div className={`h-full rounded-full transition-[width] motion-reduce:transition-none ${onNavy ? 'bg-gold' : 'bg-denim'}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default StepBar;
