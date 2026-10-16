import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export const ROADMAP_STOPS = [
  {
    id: 1,
    name: 'Read and write',
    desc: 'practice reading aloud, dictation, and vocabulary',
    path: 'Practice',
  },
  {
    id: 2,
    name: 'Learn',
    desc: 'study the civics lessons — history, government, and your representatives',
    path: 'Lessons',
  },
  {
    id: 3,
    name: 'Speak',
    desc: 'run a mock interview with the AI practice officer',
    path: 'Practice',
  },
  {
    id: 4,
    name: 'Interview day',
    desc: 'see what to expect at your interview (guide coming soon)',
    path: 'Progress',
  },
  {
    id: 5,
    name: 'Oath day',
    desc: 'the finish line — get ready to take the Oath',
    path: 'Progress',
  },
];

export default function RoadmapHero({ user }) {
  const [loading, setLoading] = useState(true);
  const [currentStop, setCurrentStop] = useState(ROADMAP_STOPS[0]);
  const [isNew, setIsNew] = useState(true);

  useEffect(() => {
    const email = user?.email?.toLowerCase().trim();
    if (!email) {
      setLoading(false);
      return;
    }

    const load = async () => {
      const [totalProgress, masteredSentences, lessonsTotal, lessonsDone, passedInterviews] =
        await Promise.all([
          base44.entities.UserProgress.count({ user_email: email }),
          base44.entities.UserProgress.count({
            user_email: email,
            content_type: 'sentence',
            status: 'mastered',
          }),
          base44.entities.Lesson.count(),
          base44.entities.LessonProgress.count({
            user_email: email,
            completed: true,
            best_score: { $gte: 70 },
          }),
          base44.entities.InterviewSession.count({ user_email: email, passed: true }),
        ]);

      const done = {
        1: masteredSentences >= 20,
        2: lessonsTotal > 0 && lessonsDone >= lessonsTotal / 2,
        3: passedInterviews >= 1,
        4: false, // Interview day guide is coming soon
      };

      const stop = ROADMAP_STOPS.find((s) => !done[s.id]) || ROADMAP_STOPS[4];
      setCurrentStop(stop);
      setIsNew(totalProgress === 0 && lessonsDone === 0 && passedInterviews === 0);
      setLoading(false);
    };

    load();
  }, [user?.email]);

  const label = loading ? '' : isNew ? 'Start here' : `Step ${currentStop.id} of 5`;
  const action = isNew ? `Start: ${currentStop.name}` : `Continue: ${currentStop.name}`;

  return (
    <section className="bg-slate-900 -mx-4 -mt-16 pt-16 pb-10">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-2 text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hero-label min-h-[16px]">
          {label}
        </p>
        <h1 className="text-[38px] leading-[1.1] font-extrabold tracking-[-1px] text-white">
          Walk into your interview ready.
        </h1>
        <p className="text-base text-hero-muted min-h-[24px]">
          {loading ? '' : `Today: ${currentStop.desc}.`}
        </p>
        <Link to={createPageUrl(currentStop.path)} className="block">
          <button className="w-full h-14 rounded-2xl bg-white text-slate-900 font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
            {action} <ArrowRight className="w-5 h-5" />
          </button>
        </Link>
        <p className="text-sm text-hero-muted">
          Every step stays open — explore in any order you like.
        </p>
      </div>
    </section>
  );
}