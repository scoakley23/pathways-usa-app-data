import React from 'react';

// Style "A — Calm with color" building blocks. Use these instead of one-off
// hex colors so the whole app stays consistent (tokens: tailwind `pw.*`).

const TAG_TONES = {
  red: 'bg-pw-red-soft text-pw-red-ink',
  blue: 'bg-pw-blue-soft text-pw-blue-ink',
  teal: 'bg-pw-teal-soft text-pw-teal-ink',
  green: 'bg-pw-green-soft text-pw-green-ink',
  navy: 'bg-pw-soft text-pw-navy',
};
const DOT = { red: 'bg-pw-red', blue: 'bg-pw-blue-ink', teal: 'bg-pw-teal-ink', green: 'bg-pw-green-ink', navy: 'bg-pw-navy' };

export function Tag({ tone = 'navy', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${TAG_TONES[tone]} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${DOT[tone]}`} aria-hidden="true" />
      {children}
    </span>
  );
}

// Segments for short flows; a single bar when there are many steps.
export function SegmentedProgress({ current, total, label }) {
  const pct = total ? Math.round(((current + 1) / total) * 100) : 0;
  return (
    <div role="progressbar" aria-valuemin={1} aria-valuemax={total} aria-valuenow={current + 1} aria-label={label}>
      {total <= 12 ? (
        <div className="flex gap-1.5">
          {Array.from({ length: total }, (_, k) => (
            <div key={k} className={`h-2 flex-1 rounded-full transition-colors ${k < current ? 'bg-pw-navy' : k === current ? 'bg-pw-red' : 'bg-pw-line'}`} />
          ))}
        </div>
      ) : (
        <div className="h-2 rounded-full bg-pw-line overflow-hidden">
          <div className="h-full rounded-full bg-pw-navy transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
    </div>
  );
}

const BTN = 'min-h-[44px] rounded-2xl font-bold inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2';

export function PrimaryButton({ className = '', large = false, ...props }) {
  return <button type="button" className={`${BTN} bg-pw-navy text-white hover:bg-[#0F1B36] px-5 ${large ? 'min-h-[52px] text-lg' : 'text-base'} ${className}`} {...props} />;
}

export function SecondaryButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} bg-white text-pw-navy border-2 border-pw-navy px-4 text-base ${className}`} {...props} />;
}

export function QuietButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} text-pw-navy hover:bg-pw-soft px-3 text-base ${className}`} {...props} />;
}

export function PillButton({ className = '', ...props }) {
  return <button type="button" className={`${BTN} rounded-full bg-pw-soft text-pw-navy hover:bg-[#E2E8F2] px-4 text-base font-semibold ${className}`} {...props} />;
}

export function RaisedCard({ className = '', padding = 'p-5', children, ...props }) {
  return <div className={`rounded-3xl bg-white border border-pw-line shadow-raised ${padding} ${className}`} {...props}>{children}</div>;
}

export function Eyebrow({ className = '', children }) {
  return <p className={`text-xs font-bold uppercase tracking-widest text-pw-muted ${className}`}>{children}</p>;
}
