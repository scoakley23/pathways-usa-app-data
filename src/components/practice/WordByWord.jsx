import React from 'react';
import { X } from 'lucide-react';

// A sentence word by word after a reading or writing check: words
// that matched in plain text, missed words underlined in burnt orange with a
// small X, and a legend so it never relies on color alone. `words` come from
// wordDiff / checkDictation ({ word, status }); extra words are left out.
export default function WordByWord({ words = [], legend = 'Words we didn’t hear', missedLabel = 'missed', className = '' }) {
  const shown = words.filter((w) => w.status !== 'extra');
  const missed = shown.some((w) => w.status !== 'correct');
  return (
    <div className={className}>
      <p className="text-[1.375rem] leading-[1.7] text-navy" lang="en" dir="ltr">
        {shown.map((w, i) => (
          <React.Fragment key={i}>
            {w.status === 'correct' ? (
              <span>{w.word}</span>
            ) : (
              <span className="whitespace-nowrap font-semibold underline decoration-not-yet decoration-[3px] underline-offset-[6px]">
                <X className="inline w-4 h-4 me-0.5 -mt-1 text-not-yet" strokeWidth={3} aria-hidden="true" />
                {w.word}<span className="sr-only"> ({missedLabel})</span>
              </span>
            )}
            {' '}
          </React.Fragment>
        ))}
      </p>
      {missed && (
        <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
          <X className="w-4 h-4 text-not-yet" strokeWidth={3} aria-hidden="true" /> {legend}
        </p>
      )}
    </div>
  );
}
