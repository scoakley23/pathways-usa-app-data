import React from 'react';
import { RotateCcw, Eye } from 'lucide-react';
import TutorMessage, { ListenButton } from './TutorMessage';
import useTextSize from './useTextSize';

const NAVY = '#14264A';

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
      <TutorMessage profile={profile} language={language} mine={mine} en={en} />

      {accepted.length > 0 && (
        <div className={`rounded-2xl border border-[#DEE4EE] bg-white p-3 ${sizeClass}`} style={{ color: NAVY }}>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4A5A78] mb-1">{acceptLabel}</p>
          <ul className="space-y-1">
            {accepted.map((a) => (
              <li key={a} className={`font-semibold ${shown ? 'bg-[#FFF4D6] rounded px-1' : ''}`}>{a}</li>
            ))}
          </ul>
          <ListenButton text={accepted.join('. ')} language="en" />
        </div>
      )}

      {!isCorrect && (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onTryAgain}
            className="min-h-[44px] rounded-xl border-2 font-semibold inline-flex items-center justify-center gap-2 bg-white"
            style={{ borderColor: NAVY, color: NAVY }}
          >
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
          <button
            type="button"
            onClick={onShowMe}
            className="min-h-[44px] rounded-xl border-2 border-[#DEE4EE] font-semibold inline-flex items-center justify-center gap-2 bg-white"
            style={{ color: NAVY }}
          >
            <Eye className="w-4 h-4" /> Show me
          </button>
        </div>
      )}
    </div>
  );
}
