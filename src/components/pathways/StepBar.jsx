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

export default StepBar;
