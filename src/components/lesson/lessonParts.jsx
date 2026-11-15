import React from 'react';
import { X, Volume2 } from 'lucide-react';
import { StepBar } from '@/components/pathways/StepBar';
import { NotYetBanner } from '@/components/pathways/ResultBanner';
import { AmioSays } from '@/components/pathways/Amio';
import { speakText } from '@/components/utils/textToSpeech';
import { checkCivicsAnswer, officeholderCheck } from '@/components/civics/checkCivicsAnswer';
import { matchCivicsAnswer } from '@/lib/answerVariants';
import { splitOfficialAnswers } from '@/lib/practiceChecks';

// Shared pieces of the lesson player (Prompt 6): the navy header with the
// step bar, the "Not quite yet" screen (frame R30TryAgain), and grading a
// civics answer with the existing checks.

export function LessonHeader({ title, subtitle, step, onClose, closeLabel }) {
  return (
    <header className="bg-navy text-white px-4 pt-5 pb-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={onClose} aria-label={closeLabel} className="shrink-0 w-11 h-11 -ms-1 grid place-items-center rounded-full hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="text-title font-bold break-words" dir="auto">{title}</h1>
          {subtitle && <p className="text-small text-on-navy break-words" dir="auto">{subtitle}</p>}
        </div>
      </div>
      {step && <StepBar total={5} current={step} />}
    </header>
  );
}

// Accepted answers to show: the official list (or today's name for an
// officeholder question). Never AI-written.
export function acceptedAnswers(question, graded) {
  if (graded?.officeholder?.accepted?.length) return graded.officeholder.accepted;
  if (graded?.officeholder?.answer) return [graded.officeholder.answer];
  return splitOfficialAnswers(question?.answer);
}

const STOP = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'or', 'in', 'on', 'for', 'is', 'are', 'it', 'its', 'i', 'think', 'um', 'uh']);

/** "You said" with the words that aren't in any accepted answer underlined. */
export function SaidWithMisses({ said, accepted }) {
  const ok = new Set(accepted.join(' ').toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean));
  const parts = String(said || '').split(/(\s+)/);
  return (
    <span lang="en" dir="ltr">
      “{parts.map((p, i) => {
        const w = p.toLowerCase().replace(/[^a-z0-9]/g, '');
        const off = w && !STOP.has(w) && !ok.has(w);
        return off
          ? <span key={i} className="underline decoration-not-yet decoration-2 underline-offset-4">{p}</span>
          : <React.Fragment key={i}>{p}</React.Fragment>;
      })}”
    </span>
  );
}

/**
 * Grade a civics answer with the existing checks: officeholder questions on
 * the device (from the official list), then the device match, then (spoken
 * answers only) the AI, which judges meaning against the official answer.
 * Typed answers in lessons are checked on the device only.
 * Returns { correct: true | false | null, graded }.
 */
export async function gradeCivics(question, answer, { location = null, typed = false } = {}) {
  const local = officeholderCheck(question, answer, location);
  if (local) return { correct: local.is_correct, graded: local };
  const match = matchCivicsAnswer(answer, question);
  if (match.sure || (typed && match.isCorrect)) return { correct: true, graded: { is_correct: true } };
  if (typed) return { correct: false, graded: { is_correct: false } };
  const graded = await checkCivicsAnswer(question, answer, { location });
  return { correct: !!graded?.is_correct, graded };
}

/** The "Not quite yet" screen (frame R30TryAgain). */
export function TryAgain({ t, askedLabel, asked, saidLabel, said, accepted, amioLine, sayLabel, sayText, savesReview, onTryAgain, onSkip }) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <section className="rounded-card bg-white border border-line p-5">
          <p className="text-small text-muted">{askedLabel}</p>
          <p className="mt-1 text-[22px] font-bold text-navy leading-snug" lang="en" dir="ltr">{asked}</p>
        </section>
        <section className="rounded-card bg-white border border-line p-5">
          <p className="text-small text-muted">{saidLabel}</p>
          <p className="mt-1 text-lg text-navy">{said ? <SaidWithMisses said={said} accepted={accepted || [sayText]} /> : '—'}</p>
        </section>
        <AmioSays mood="kind" size={56}>{amioLine}</AmioSays>
        <section className="rounded-card bg-white border border-line p-5">
          <p className="text-small font-semibold uppercase tracking-wide text-muted">{sayLabel}</p>
          <p className="mt-2 text-[20px] font-bold text-navy leading-snug" lang="en" dir="ltr">“{sayText}”</p>
          {accepted && accepted.length > 1 && (
            <ul className="mt-2 list-disc ps-5 text-base text-muted" lang="en" dir="ltr">
              {accepted.slice(1, 6).map((a) => <li key={a}>{a}</li>)}
            </ul>
          )}
          <button type="button" onClick={() => speakText(sayText, 'en')} className="mt-3 min-h-tap inline-flex items-center gap-2 font-semibold text-denim hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim rounded-lg">
            <Volume2 className="w-5 h-5" aria-hidden="true" />{t('listen')}
          </button>
        </section>
        <button type="button" onClick={onSkip} className="self-center min-h-tap px-3 text-base font-semibold text-muted underline underline-offset-4 hover:text-navy">{t('skip_for_now')}</button>
      </div>
      <NotYetBanner title={t('not_quite')} actionLabel={t('try_again')} onAction={onTryAgain} className="sticky bottom-0">
        {savesReview ? t('again_tomorrow') : null}
      </NotYetBanner>
    </div>
  );
}
