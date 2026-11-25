import React from 'react';
import { Check, Volume2, X } from 'lucide-react';
import usePracticeText from './usePracticeText';

// The result of a practice answer (Amio v2, frames Right / NotQuite): a
// bottom panel, never a full screen and never red. status:
//   'correct'     gold panel, a check, "Right!", `sub`
//   'not-correct' paper panel, an X, "Not quite", `sub`
//   'neutral'     paper panel, no verdict (e.g. "We can't check this one yet"): `title`
// The verdict is real text in a live region (never color alone). `youSaid`
// is shown when not correct; `reason` is one short line (only when the
// grader gave one). `accepted` = official answers only (never AI-written),
// headed `acceptedLabel`, with Hear it. `children` = the buttons.
// `inline` (the practice interview call): a rounded card in the page flow
// instead of a bottom panel.
export default function AnswerFeedback({
  status,
  title,
  sub,
  youSaid,
  youSaidLabel,
  reason,
  accepted = [],
  acceptedLabel,
  acceptedExtra = null,
  onHearAnswer,
  inline = false,
  children,
}) {
  const { t } = usePracticeText();
  const correct = status === 'correct';
  const notCorrect = status === 'not-correct';
  const shape = inline ? 'rounded-card' : 'rounded-t-sheet';
  return (
    <section className={`${shape} ${correct ? 'bg-gold' : 'bg-paper'} text-navy px-5 pt-5 pb-7`}>
      <div className="mx-auto max-w-lg flex flex-col gap-4">
        <div aria-live="polite" className="flex items-start gap-3">
          {correct && (
            <span className="w-10 h-10 shrink-0 rounded-full bg-navy grid place-items-center">
              <Check className="w-6 h-6 text-gold" strokeWidth={3} aria-hidden="true" />
            </span>
          )}
          {notCorrect && (
            <span className="w-10 h-10 shrink-0 rounded-full border-2 border-navy grid place-items-center">
              <X className="w-6 h-6 text-navy" strokeWidth={3} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-display text-[1.625rem] leading-tight" dir="auto">{correct ? t('right') : notCorrect ? t('not_quite') : title}</p>
            {sub && <p className="mt-0.5 text-base" dir="auto">{sub}</p>}
          </div>
        </div>

        {youSaid && !correct && (
          <div>
            <p className="text-small font-semibold text-muted">{youSaidLabel || t('you_said')}</p>
            <p className="mt-1 text-lg leading-snug break-words" lang="en" dir="ltr">“{youSaid}”</p>
            {notCorrect && reason && <p className="mt-1 text-base text-muted">{reason}</p>}
          </div>
        )}

        {accepted.length > 0 && (
          <div className={`rounded-card ${correct ? 'bg-gold-soft' : 'bg-white border border-line'} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-small font-semibold text-muted" dir="auto">{acceptedLabel || t('accepts')}</p>
              {onHearAnswer && (
                <button
                  type="button"
                  onClick={onHearAnswer}
                  className="min-h-tap -my-2 -me-2 rounded-button px-3 inline-flex items-center gap-1.5 text-base font-semibold text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                >
                  <Volume2 className="w-4 h-4" aria-hidden="true" /> {t('hear_it')}
                </button>
              )}
            </div>
            {accepted.length === 1 ? (
              <p className="mt-2 text-lg font-semibold leading-snug" lang="en" dir="ltr">{accepted[0]}</p>
            ) : (
              <ul className="mt-2 space-y-1 text-lg font-semibold leading-snug list-disc ps-5" lang="en" dir="ltr">
                {accepted.map((a) => <li key={a}>{a}</li>)}
              </ul>
            )}
            {acceptedExtra}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
