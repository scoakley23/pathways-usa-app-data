import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FIND_REPRESENTATIVE_PATH, MAY_CHANGE_SOON, checkedOnText } from '@/lib/officeholderQuestions';

// Under a graded officeholder / capital answer (see gradeOfficeholderAnswer()):
// the table's note, "not counted" when it can't be graded, a link to
// "Who Represents Me?" when the learner's place is needed, the date the list
// was checked, and "may change soon". `onPoster` = white text on a poster.
// `answer` is the grading result, or officeholderAnswerFor() for display only.
export default function OfficeholderNote({ answer, graded = true, onPoster = false, className }) {
  if (!answer) return null;
  const ungraded = graded && answer.correct === null;
  const link = onPoster
    ? 'min-h-[44px] inline-flex items-center gap-2 rounded-full border-2 border-white px-4 font-semibold text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent'
    : 'min-h-[44px] inline-flex items-center gap-2 rounded-2xl bg-pw-navy text-white px-4 font-bold hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2';
  return (
    <div className={cn('space-y-2 text-base leading-relaxed', className)}>
      {answer.message && <p>{answer.message}</p>}
      {ungraded && <p className="font-semibold">This one isn&apos;t counted as right or wrong.</p>}
      {answer.needsLocation && (
        <Link to={FIND_REPRESENTATIVE_PATH} className={link}>
          <MapPin className="w-5 h-5 shrink-0" aria-hidden="true" /> Who Represents Me?
        </Link>
      )}
      {answer.mayChangeSoon && <p className="font-semibold">{MAY_CHANGE_SOON}</p>}
      {answer.checkedOn && !answer.needsLocation && (
        <p className={cn('text-[15px]', !onPoster && 'text-pw-muted')}>{checkedOnText(answer.checkedOn)}.</p>
      )}
    </div>
  );
}
