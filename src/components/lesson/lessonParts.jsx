import React from 'react';
import { X } from 'lucide-react';
import { StepBar } from '@/components/pathways/StepBar';
import { NotQuitePanel } from '@/components/pathways/ResultBanner';
import { checkCivicsAnswer, officeholderCheck } from '@/components/civics/checkCivicsAnswer';
import { matchCivicsAnswer } from '@/lib/answerVariants';
import { splitOfficialAnswers } from '@/lib/practiceChecks';

// Shared pieces of the lesson player (Prompt 6): the navy header with the
// step bar, the Not quite panel (frame NotQuite), and grading a
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
          ? <span key={i} className="underline decoration-gold decoration-2 underline-offset-4">{p}</span>
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

/**
 * Not quite (Amio v2, frame NotQuite): a paper panel at the bottom of the
 * question screen, never a full screen and never red. The answer (the first
 * official one) and the other accepted answers, Listen, "Say it once more"
 * and "Skip for now"; "You'll see this one again tomorrow." when the missed
 * question was saved to review (the caller does that, as before).
 */
export function TryAgain({ t, accepted = [], savesReview, onTryAgain, onSkip, className = '' }) {
  const first = accepted[0] || '';
  return (
    <NotQuitePanel
      title={t('not_quite')}
      answerLine={first ? t('the_answer_is', { answer: first }) : null}
      answer={first}
      others={accepted.slice(1, 6)}
      othersLabel={t('also_accepted')}
      listenLabel={t('listen')}
      note={savesReview ? t('again_tomorrow') : null}
      actionLabel={t('say_once_more')}
      onAction={onTryAgain}
      skipLabel={t('skip_for_now')}
      onSkip={onSkip}
      className={className}
    />
  );
}
