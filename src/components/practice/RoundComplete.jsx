import React from 'react';
import { Check, X } from 'lucide-react';
import { Button, Card, NavyTop } from '@/components/pathways/ui';

// The end of a practice round (The Road), shared by civics, reading, writing
// and the mock interview: a navy screen with one mark per counted card (gold
// check = right, outlined X = not right; no stars since Amio v2, and the
// count is said in words), "Round complete", the title ("8
// right. Nice work, Ana."), the real test's rule, an optional cream card of
// things to review, and the buttons. Only results the app already has;
// nothing new is stored. `children` go under the review card (e.g. the
// interview report's details).
//   outcomes   counted outcomes in order ('right' | 'close' | 'missed')
//   review     { heading, lines: [string], button } or null
export default function RoundComplete({ outcomes = [], title, rule, review = null, onClose, onReview, onAgain, onBack, children }) {
  const right = outcomes.filter((r) => r === 'right').length;
  return (
    <NavyTop className="min-h-[calc(100vh-1px)] pb-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close practice"
            className="w-11 h-11 rounded-full border-2 border-chip-navy text-white grid place-items-center hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        )}
        {outcomes.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={`${right} of ${outcomes.length} right`}>
            {outcomes.map((r, i) => (
              <li key={i}>
                {r === 'right'
                  ? <span className="grid place-items-center w-7 h-7 rounded-full bg-gold text-navy"><Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /></span>
                  : <span className="grid place-items-center w-7 h-7 rounded-full border-2 border-on-navy text-on-navy"><X className="w-4 h-4" strokeWidth={3} aria-hidden="true" /></span>}
              </li>
            ))}
          </ul>
        )}
        <div className="space-y-2" aria-live="polite">
          <p className="text-label text-on-navy">Round complete</p>
          <h2 className="font-display text-[1.875rem] sm:text-[2.125rem] leading-[1.1]">{title}</h2>
          {rule && <p className="text-lg text-on-navy">{rule}</p>}
        </div>

        {review && review.lines.length > 0 && (
          <Card padding="p-5" className="text-navy">
            <h3 className="font-display text-[1.375rem] leading-tight">{review.heading}</h3>
            <ul className="mt-3 space-y-2 list-disc ps-5 text-base">
              {review.lines.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </Card>
        )}

        {children}

        <div className="flex flex-col sm:flex-row gap-3">
          {review && review.lines.length > 0 && onReview ? (
            <Button variant="next" onNavy className="min-h-[52px] flex-1" onClick={onReview}>{review.button}</Button>
          ) : onAgain ? (
            <Button variant="next" onNavy className="min-h-[52px] flex-1" onClick={onAgain}>Practice again</Button>
          ) : null}
          <Button variant="second" onNavy className="min-h-[52px] flex-1" onClick={onBack}>Back to the road</Button>
        </div>
      </div>
    </NavyTop>
  );
}
