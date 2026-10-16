import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROADMAP_STOPS } from './roadmapStops';

/**
 * Shared roadmap state: computes which stops are done and which is current,
 * from existing progress data only.
 */
export default function useRoadmapProgress(user) {
  const [state, setState] = useState({
    loading: true,
    currentStop: ROADMAP_STOPS[0],
    done: {},
    isNew: true,
    doneCount: 0,
  });

  useEffect(() => {
    const email = user?.email?.toLowerCase().trim();
    if (!email) {
      setState({ loading: false, currentStop: ROADMAP_STOPS[0], done: {}, isNew: true, doneCount: 0 });
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
        1: masteredSentences >= 20, // Read and write: 20+ mastered sentences
        2: lessonsTotal > 0 && lessonsDone >= lessonsTotal / 2, // Learn: half the lessons done with quiz >= 70
        3: passedInterviews >= 1, // Speak: one passed mock interview
        4: false, // Interview day guide coming soon
      };
      done[5] = done[1] && done[2] && done[3] && done[4]; // Oath day: everything before it

      const currentStop = ROADMAP_STOPS.find((s) => !done[s.id]) || ROADMAP_STOPS[4];
      const isNew = totalProgress === 0 && lessonsDone === 0 && passedInterviews === 0;
      const doneCount = ROADMAP_STOPS.filter((s) => done[s.id]).length;

      setState({ loading: false, currentStop, done, isNew, doneCount });
    };

    load();
  }, [user?.email]);

  return state;
}