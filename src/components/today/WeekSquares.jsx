import React from 'react';

// This week's days as small squares (Lesson done, Done for today): navy = a
// day the app was opened, gold = today, outline = a past day without practice,
// dashed = still to come. Once today's goal is met, today's square is Amio
// red (a celebration; the words next to it say the same for screen readers).
export default function WeekSquares({ week, goalMet = false, label, metLabel }) {
  if (!week) return null;
  return (
    <div className="flex items-center gap-3">
      <span className="flex gap-1" aria-hidden="true">
        {week.squares.map((sq, i) => {
          const today = sq.state === 'today';
          const look = today && goalMet ? 'bg-amio-red'
            : sq.practiced ? (today ? 'bg-gold' : 'bg-navy')
              : sq.state === 'future' ? 'border-2 border-dashed border-line' : 'border-2 border-line';
          return <span key={i} className={`w-4 h-4 rounded ${look}`} />;
        })}
      </span>
      <span dir="auto" className="text-base text-muted">{label}</span>
      {goalMet && metLabel && <span className="sr-only">{metLabel}</span>}
    </div>
  );
}
