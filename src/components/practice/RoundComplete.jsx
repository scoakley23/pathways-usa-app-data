import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Check, X } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import RedStop from '@/components/pathways/RedStop';
import { CONFETTI_COLORS } from '@/lib/theme';
import usePracticeText from './usePracticeText';

// The end of a practice round (Amio v2, like Lesson done), shared by civics,
// reading, writing and the vocabulary games: paper, Amio's line, "Round
// complete." (the full stop in Amio red: a celebration), confetti when
// something was right, one mark per counted card (gold check = right,
// outlined X = not right; said in words too), the title ("8 right. Nice
// work, Ana."), the real test's rule, the cards to review, and the buttons.
// Only results the app already has; nothing new is stored.
//   outcomes   counted outcomes in order ('right' | 'close' | 'missed')
//   review     { heading, lines: [string], button } or null
export default function RoundComplete({ outcomes = [], title, rule, review = null, onClose, onReview, onAgain, onBack, children }) {
  const { t, rtl } = usePracticeText();
  const right = outcomes.filter((r) => r === 'right').length;
  const toReview = review && review.lines.length > 0;
  useEffect(() => {
    if (right > 0) confetti({ particleCount: 80, spread: 70, origin: { y: 0.3 }, colors: CONFETTI_COLORS, disableForReducedMotion: true });
  }, []);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-10 flex flex-col gap-5">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="w-11 h-11 -ms-2 rounded-full grid place-items-center text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        )}
        <AmioSays mood={toReview ? 'kind' : 'proud'} size={64}>{toReview ? t('amio_round_kind') : t('amio_round_good')}</AmioSays>
        <div className="flex flex-col gap-2" aria-live="polite">
          <h1 className="font-display text-[2.5rem] leading-none tracking-tight" dir="auto"><RedStop>{t('round_complete')}</RedStop></h1>
          <p className="text-xl font-semibold" dir="auto">{title}</p>
          {rule && <p className="text-base text-muted" dir="auto">{rule}</p>}
        </div>
        {outcomes.length > 0 && (
          <ul className="flex flex-wrap gap-1.5 list-none m-0 p-0" aria-label={t('n_of_right', { n: right, total: outcomes.length })}>
            {outcomes.map((r, i) => (
              <li key={i}>
                {r === 'right'
                  ? <span className="grid place-items-center w-8 h-8 rounded-button bg-gold text-navy"><Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /></span>
                  : <span className="grid place-items-center w-8 h-8 rounded-button border-2 border-line text-muted"><X className="w-4 h-4" strokeWidth={3} aria-hidden="true" /></span>}
              </li>
            ))}
          </ul>
        )}

        {toReview && (
          <section className="rounded-card bg-white border-[1.5px] border-line p-5">
            <h2 className="text-lg font-bold" dir="auto">{review.heading}</h2>
            <ul className="mt-3 space-y-2 list-disc ps-5 text-base" lang="en" dir="ltr">
              {review.lines.map((line, i) => <li key={i}>{line}</li>)}
            </ul>
          </section>
        )}

        {children}

        <div className="flex flex-col gap-3">
          {toReview && onReview ? (
            <Button variant="main" className="w-full" onClick={onReview}>{review.button}</Button>
          ) : onAgain ? (
            <Button variant="main" className="w-full" onClick={onAgain}>{t('practice_again')}</Button>
          ) : null}
          <Button variant="second" className="w-full" onClick={onBack}>{t('back_home')}</Button>
        </div>
      </div>
    </div>
  );
}
