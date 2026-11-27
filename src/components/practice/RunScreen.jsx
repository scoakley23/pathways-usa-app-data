import React from 'react';
import Stage from '@/components/pathways/Stage';

// A practice run's screen (Amio v2, frame Speak): navy, full screen, with the
// top bar, what is being practiced, the question or sentence and the answer
// controls; the result comes in as a bottom panel (`panel`, AnswerFeedback),
// never a full screen and never red. `side` (the answer controls) stands on
// the right on desktop (the stage, vision C); on phones it follows `children`.
export default function RunScreen({ topBar, label, panel = null, side = null, children }) {
  return (
    <div className="min-h-screen bg-navy text-white flex flex-col">
      <div className="flex-1 px-4 lg:px-10 pt-5 lg:pt-8 pb-6">
        <div className={`mx-auto max-w-lg flex flex-col gap-4 ${side !== null ? 'lg:max-w-6xl' : ''}`}>
          {topBar}
          {label && <h1 className="font-sans text-base font-semibold text-on-navy" dir="auto">{label}</h1>}
          {side !== null ? <Stage side={side}>{children}</Stage> : children}
        </div>
      </div>
      {panel}
    </div>
  );
}

/** A box on navy for what the learner said or typed. */
export function SaidBox({ label, children }) {
  return (
    <div aria-live="polite" className="rounded-card bg-navy-2 px-4 py-3">
      <p className="text-small font-semibold text-on-navy">{label}</p>
      <p className="mt-1 text-xl leading-snug min-h-[1.5em] break-words" lang="en" dir="ltr">{children}</p>
    </div>
  );
}

/** A small button on navy (Hear it, In my language): 12px corners, line border. */
export function NavyChip({ onClick, pressed, children, ...props }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`min-h-tap inline-flex items-center gap-2 rounded-button border border-navy-line px-4 text-base font-semibold text-white hover:bg-navy-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${pressed ? 'bg-navy-2' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
}
