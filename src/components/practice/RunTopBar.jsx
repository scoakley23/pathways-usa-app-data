import React from 'react';
import { X } from 'lucide-react';
import usePracticeText from './usePracticeText';

// The top of a practice run on navy (Amio v2): a 44px close button, the step
// bar (one segment per card: done gold, the current one white, the rest
// navy-line; a plain bar for long runs) and "4/10". "Card 4 of 10" for
// screen readers. No timer.
export default function RunTopBar({ onClose, index = 0, total = 0, answered = false }) {
  const { t } = usePracticeText();
  const done = Math.min(total, index + (answered ? 1 : 0));
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onClose}
        aria-label={t('close')}
        className="w-11 h-11 shrink-0 rounded-full text-white grid place-items-center hover:bg-navy-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <X className="w-6 h-6" aria-hidden="true" />
      </button>
      {total > 0 && (
        <>
          <div className="flex-1 flex gap-1" role="img" aria-label={t('card_of', { n: Math.min(index + 1, total), total })}>
            {total <= 20
              ? Array.from({ length: total }).map((_, i) => (
                <span key={i} className={`h-2 flex-1 rounded-sm ${i < done ? 'bg-gold' : i === index ? 'bg-white' : 'bg-navy-line'}`} />
              ))
              : (
                <span className="relative h-2 flex-1 rounded-sm bg-navy-line overflow-hidden">
                  <span className="absolute inset-y-0 start-0 bg-gold" style={{ width: `${(done / total) * 100}%` }} />
                </span>
              )}
          </div>
          <span className="shrink-0 text-base font-semibold tabular-nums text-on-navy" aria-hidden="true">
            {Math.min(index + 1, total)}/{total}
          </span>
        </>
      )}
    </div>
  );
}
