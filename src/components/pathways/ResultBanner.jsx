import React from 'react';
import { Check, Volume2 } from 'lucide-react';
import { MAIN_PRESS } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';

// Amio v2 answer panels (frames Right, NotQuite): bottom panels with 20px top
// corners, under the question, never full screens and never red.
// Right: gold, a check icon and "Right", the answer, Continue (navy).
// Not quite: paper, "Not quite" in words, the answer and the other accepted
// answers, "Say it once more" (gold) and "Skip for now".
const PANEL = 'rounded-t-sheet px-5 pt-5 pb-7 flex flex-col gap-3 text-navy';
const PANEL_BTN = `w-full min-h-main mb-[5px] rounded-button px-6 text-lg font-extrabold ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`;

export function RightPanel({ title, answer, actionLabel, onAction, note, className = '' }) {
  return (
    <section role="status" className={`${PANEL} bg-gold ${className}`}>
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid place-items-center w-9 h-9 shrink-0 rounded-full bg-navy text-gold" aria-hidden="true">
          <Check className="w-5 h-5" strokeWidth={3} />
        </span>
        <div className="min-w-0">
          <p className="font-display text-[1.625rem] leading-tight">{title}</p>
          {answer && <p className="mt-1 text-base" lang="en" dir="ltr">{answer}</p>}
          {note && <p className="mt-1 text-sm">{note}</p>}
        </div>
      </div>
      <button type="button" onClick={onAction} className={`${PANEL_BTN} bg-navy text-white focus-visible:ring-navy focus-visible:ring-offset-gold`}>{actionLabel}</button>
    </section>
  );
}

export function NotQuitePanel({ title, answerLine, answer, others = [], othersLabel, listenLabel, note, actionLabel, onAction, skipLabel, onSkip, className = '' }) {
  return (
    <section role="status" className={`${PANEL} bg-paper ${className}`}>
      <div className="min-w-0">
        <p className="font-display text-[1.625rem] leading-tight">{title}</p>
        {answerLine && <p className="mt-1 text-base" lang="en" dir="ltr">{answerLine}</p>}
        {others.length > 0 && (
          <p className="mt-1 text-sm text-muted" lang="en" dir="ltr">{othersLabel} {others.join(' · ')}</p>
        )}
        {answer && listenLabel && (
          <button type="button" onClick={() => speakText(answer, 'en')} className="mt-1 min-h-tap inline-flex items-center gap-2 font-semibold text-denim hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded-lg">
            <Volume2 className="w-5 h-5" aria-hidden="true" />{listenLabel}
          </button>
        )}
        {note && <p className="mt-1 text-sm text-muted">{note}</p>}
      </div>
      <button type="button" onClick={onAction} className={`${PANEL_BTN} bg-gold text-navy focus-visible:ring-navy`}>{actionLabel}</button>
      {onSkip && (
        <button type="button" onClick={onSkip} className="self-center min-h-tap px-3 text-base font-semibold text-navy underline underline-offset-4 hover:text-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded">{skipLabel}</button>
      )}
    </section>
  );
}
