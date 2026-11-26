import React from 'react';
import { RotateCcw, Eye } from 'lucide-react';
import TutorMessage, { ListenButton } from './TutorMessage';
import useTextSize from './useTextSize';
import { Button } from '@/components/pathways/ui';
import { TUTOR_STEP_LINES } from '@/components/lessons/learnStrings';

// Feedback after a practice answer: what was right and one tip (tutor's
// voice), then what the officer would accept (always the official text,
// never AI-written), then "Try again" / "Show me". Never just "Wrong."
export default function TeachingFeedback({
  profile, language, line, isCorrect, rightText, tipText, acceptLabel, accepted = [], onTryAgain, onShowMe, shown, t = (k) => TUTOR_STEP_LINES[k],
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
        <div className={`rounded-card p-4 text-navy ${isCorrect ? 'bg-gold' : 'bg-white border-[1.5px] border-line'} ${sizeClass}`}>
          <p className="mb-2 text-base font-semibold" dir="auto">{acceptLabel || t('officer_accepts')}</p>
          <ul className="space-y-1 mb-3" lang="en" dir="ltr">
            {accepted.map((a) => (
              <li key={a} className={`font-bold ${shown ? 'bg-gold-soft rounded-[6px] px-2 py-0.5 -mx-2' : ''}`}>{a}</li>
            ))}
          </ul>
          <ListenButton text={accepted.join('. ')} language="en" />
        </div>
      )}

      {!isCorrect && (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="second" onClick={onTryAgain}>
            <RotateCcw className="w-4 h-4" aria-hidden="true" /> {t('try_again')}
          </Button>
          <Button variant="second" onClick={onShowMe}>
            <Eye className="w-4 h-4" aria-hidden="true" /> {t('show_me')}
          </Button>
        </div>
      )}
    </div>
  );
}
