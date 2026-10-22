import React from 'react';
import { RotateCcw, Eye } from 'lucide-react';
import TutorMessage, { ListenButton } from './TutorMessage';
import useTextSize from './useTextSize';
import { Eyebrow, SecondaryButton } from '@/components/pathways/ui';

// Feedback after a practice answer: what was right and one tip (tutor's
// voice), then what the officer would accept (always the official text,
// never AI-written), then "Try again" / "Show me". Never just "Wrong."
export default function TeachingFeedback({
  profile, language, line, isCorrect, rightText, tipText, acceptLabel = 'What the officer would accept', accepted = [], onTryAgain, onShowMe, shown,
}) {
  const { className: sizeClass } = useTextSize();
  const heading = line(isCorrect ? 'wellDone' : 'tryAgain');
  const join = (...parts) => parts.filter(Boolean).join(' ');
  const mine = heading.mine ? join(heading.mine, rightText?.mine, tipText?.mine) : null;
  const en = join(heading.en, rightText?.en, tipText?.en);

  return (
    <div className="space-y-3">
      <TutorMessage profile={profile} language={language} mine={mine} en={en} expression={isCorrect ? 'proud' : 'default'} />

      {accepted.length > 0 && (
        <div className={`rounded-[14px] p-5 text-pw-navy ${isCorrect ? 'bg-pw-green-soft' : 'bg-white border border-pw-line'} ${sizeClass}`}>
          <Eyebrow className="mb-2">{acceptLabel}</Eyebrow>
          <ul className="space-y-1 mb-3">
            {accepted.map((a) => (
              <li key={a} className={`font-bold ${shown ? 'bg-pw-highlight rounded-lg px-2 py-0.5 -mx-2' : ''}`}>{a}</li>
            ))}
          </ul>
          <ListenButton text={accepted.join('. ')} language="en" />
        </div>
      )}

      {!isCorrect && (
        <div className="grid grid-cols-2 gap-2">
          <SecondaryButton onClick={onTryAgain}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> Try again
          </SecondaryButton>
          <SecondaryButton onClick={onShowMe} className="border-pw-line">
            <Eye className="w-4 h-4" aria-hidden="true" /> Show me
          </SecondaryButton>
        </div>
      )}
    </div>
  );
}
