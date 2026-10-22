import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ROADMAP_STOPS } from './roadmapStops';

const DEFAULT_STATE = {
  loading: true,
  currentStop: ROADMAP_STOPS[0],
  done: {},
  isNew: true,
  doneCount: 0,
};

const EMPTY_STATE = { ...DEFAULT_STATE, loading: false };

// The lesson catalog is the same for everyone — count it once per session.
let lessonTotalPromise = null;
function getLessonTotal() {
  if (!lessonTotalPromise) {
    lessonTotalPromise = base44.entities.Lesson.count().catch((err) => {
      lessonTotalPromise = null; // retry next time instead of caching a failure
      throw err;
    });
  }
  return lessonTotalPromise;
}

const snapshotCache = new Map(); // email -> { ts, state }
const inflightLoads = new Map(); // email -> Promise<state>
const CACHE_TTL = 2 * 60 * 1000;

/**
 * Shared roadmap state: computes which stops are done and which is current.
 * Dedupes concurrent loads (StrictMode, hero + path), caches per user for a
 * short TTL, and degrades gracefully on rate limits instead of throwing.
 */
export default function useRoadmapProgress(user) {
  const [state, setState] = useState(DEFAULT_STATE);

  useEffect(() => {
    const email = user?.email?.toLowerCase().trim();
    if (!email) {
      setState(EMPTY_STATE);
      return;
    }

    const cached = snapshotCache.get(email);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setState(cached.state);
      return;
    }

    let cancelled = false;

    const load = async () => {
      const [totalProgress, masteredSentences, lessonsTotal, lessonsDone, passedInterviews] =
        await Promise.all([
          base44.entities.UserProgress.count({ user_email: email }),
          base44.entities.UserProgress.count({
            user_email: email,
            content_type: 'sentence',
            status: 'mastered',
          }),
          getLessonTotal(),
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
        4: false, // Interview Day saves nothing, so this stop is never marked done
      };
      done[5] = done[1] && done[2] && done[3] && done[4]; // Oath day: everything before it

      const currentStop = ROADMAP_STOPS.find((s) => !done[s.id]) || ROADMAP_STOPS[4];
      const isNew = totalProgress === 0 && lessonsDone === 0 && passedInterviews === 0;
      const doneCount = ROADMAP_STOPS.filter((s) => done[s.id]).length;

      return { loading: false, currentStop, done, isNew, doneCount };
    };

    let p = inflightLoads.get(email);
    if (!p) {
      p = load().finally(() => inflightLoads.delete(email));
      inflightLoads.set(email, p);
    }

    p.then((next) => {
      snapshotCache.set(email, { ts: Date.now(), state: next });
      if (!cancelled) setState(next);
    }).catch(() => {
      // Rate limit or transient error: show the roadmap with defaults
      // instead of breaking the page; the next mount will retry.
      if (!cancelled) setState(EMPTY_STATE);
    });

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  return state;
}