import React from 'react';
import { Check, Volume2, X } from 'lucide-react';

// The result of a practice answer on the cream sheet (The Road), shared by
// the practice cards. status:
//   'correct'     green circle + check, "Correct", `sub`
//   'not-correct' burnt-orange circle + X, "Not correct", `sub`
//   'neutral'     no verdict (e.g. "We can't check this one yet"): `title`
// The verdict is real text in a live region, so screen readers say "Correct"
// or "Not correct", never just a color. `youSaid` is struck through when not
// correct; `reason` is one short line (only when the grader gave one).
// `accepted` (official answers only, never AI-written) goes in a sand box
// headed `acceptedLabel`; `onHearAnswer` adds a Hear it button there.
// `children` = the buttons.
export default function AnswerFeedback({
  status,
  title,
  sub,
  youSaid,
  reason,
  accepted = [],
  acceptedLabel = 'The officer accepts',
  acceptedExtra = null,
  onHearAnswer,
  children,
}) {
  const correct = status === 'correct';
  const notCorrect = status === 'not-correct';
  return (
    <div className="space-y-5 text-ink">
      <div aria-live="polite" className="flex items-start gap-3">
        {correct && (
          <span className="w-10 h-10 shrink-0 rounded-full bg-correct grid place-items-center">
            <Check className="w-6 h-6 text-white" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
        {notCorrect && (
          <span className="w-10 h-10 shrink-0 rounded-full bg-not-correct grid place-items-center">
            <X className="w-6 h-6 text-white" strokeWidth={3} aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className={`font-display text-[26px] leading-tight ${correct ? 'text-correct' : notCorrect ? 'text-not-correct-text' : 'text-ink'}`}>
            {correct ? 'Correct' : notCorrect ? 'Not correct' : title}
          </p>
          {sub && <p className="mt-0.5 text-base text-ink-2">{sub}</p>}
        </div>
      </div>

      {youSaid && (
        <div>
          <p className="text-label uppercase text-ink-label">You said</p>
          <p
            className={`mt-1 text-lg leading-snug ${notCorrect ? 'line-through decoration-not-correct decoration-2' : ''}`}
          >
            {notCorrect && <span className="sr-only">Not correct: </span>}
            “{youSaid}”
          </p>
          {notCorrect && reason && <p className="mt-1 text-base text-ink-2">{reason}</p>}
        </div>
      )}

      {accepted.length > 0 && (
        <div className="rounded-card bg-sand p-4">
          <div className="flex items-center justify-between gap-2">
            <p className="text-label uppercase text-ink-label">{acceptedLabel}</p>
            {onHearAnswer && (
              <button
                type="button"
                onClick={onHearAnswer}
                className="min-h-tap -my-2 -me-2 rounded-full px-3 inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:bg-sand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                <Volume2 className="w-4 h-4" aria-hidden="true" /> Hear it
              </button>
            )}
          </div>
          {accepted.length === 1 ? (
            <p className="mt-2 text-lg font-semibold leading-snug">{accepted[0]}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-lg font-semibold leading-snug list-disc ps-5">
              {accepted.map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
          {acceptedExtra}
        </div>
      )}

      {children}
    </div>
  );
}
