import React, { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import InterviewPractice from '@/components/practice/InterviewPractice';
import { useJourney } from '@/components/course/courseShared';
import { firstName } from '@/lib/todayView';
import { usesYourState } from '@/lib/journey';
import { questionRecord, sectionQuestionIds } from '@/lib/course';

// The unit practice interview (Prompt 8, /course/unit/:unitId/interview):
// the existing mock interview with a Civics part of up to 6 of the unit's
// test questions. Open any time (nothing is locked): the stop is always
// "open" in journeyStops(); only a unit with no stop a learner may see sends
// them back. It never blocks anything. Saves what the
// mock interview always saves (scores only). Questions about the learner's
// own state are left out here (they need the state picked in Who Represents
// Me?, and the Speak it! checkpoints already ask them).

export const UNIT_INTERVIEW_CIVICS = 6;

export default function UnitInterviewPage() {
  const { unitId } = useParams();
  const navigate = useNavigate();
  const journey = useJourney();
  const unit = journey.course.find((u) => u.id === unitId);
  const stop = journey.stops.find((s) => s.unitId === unitId && s.type === 'practiceInterview');
  const open = stop && (stop.state === 'open' || stop.state === 'done');

  const civics = useMemo(() => {
    if (!unit) return [];
    const all = unit.sections.flatMap((s) => sectionQuestionIds(s)).map(questionRecord).filter(Boolean)
      .filter((q) => !usesYourState([q.question]));
    return [...all].sort(() => Math.random() - 0.5).slice(0, UNIT_INTERVIEW_CIVICS);
  }, [unit]);

  if (journey.loading) return <div className="min-h-screen bg-paper" />;
  if (!unit || !open) return <Navigate to={unit ? `/course/unit/${unit.id}` : '/course'} replace />;

  const close = () => navigate(`/course?unit=${unit.id}`);
  return (
    <InterviewPractice
      civicsQuestions={civics}
      onNext={() => {}}
      onClose={close}
      onBack={close}
      learnerName={firstName(journey.user)}
    />
  );
}
