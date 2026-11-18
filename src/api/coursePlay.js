// Saving a course lesson (Prompt 6). Only three things, and only on Supabase
// (the switch on): the lesson's `lesson_progress` row (steps done, stars,
// completed_at), missed questions into `review_items` at box 1, and the two
// Write it level fields on the learner's profile. Never audio, never what the
// learner said or wrote. With the switch off (Base44) nothing is saved: the
// player works, and the journey starts at the beginning there anyway.
//
// `createCoursePlay({ provider, auth, lessonProgress, review })` takes its
// clients so tests can pass fakes; the app uses `coursePlay`.
import { DATA_PROVIDER } from '@/api/db';
import { auth as appAuth } from '@/api/auth';
import { lessonProgress as appLessonProgress } from '@/api/lessons';
import appReview from '@/api/review';
import { progressRow } from '@/lib/lessonPlayer';
import { afterWriteIt, normalizeWriteLevel } from '@/lib/writeLevel';

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function createCoursePlay({ provider = DATA_PROVIDER, auth = appAuth, lessonProgress = appLessonProgress, review = appReview } = {}) {
  const on = provider === 'supabase';
  return {
    saves: on,

    /** The learner's Write it level: { write_level, write_level1_passes }. */
    async writeLevel() {
      if (!on) return normalizeWriteLevel({});
      try { return normalizeWriteLevel(await auth.me()); } catch (e) { return normalizeWriteLevel({}); }
    },

    /** After a Write it answer: count a level-1 pass; returns the new level. */
    async afterWriteIt(passed) {
      if (!on) return normalizeWriteLevel({});
      const now = normalizeWriteLevel(await auth.me());
      const next = afterWriteIt(now, passed);
      if (next.write_level !== now.write_level || next.write_level1_passes !== now.write_level1_passes) await auth.updateMe(next);
      return next;
    },

    /** A question answered wrong in a lesson: into review at box 1. */
    async missed(questionId) {
      if (!on || !questionId) return;
      await review.afterPractice(questionId, false);
    },

    /**
     * Save the run (results from the player); never lowers saved stars.
     * `rules` = another lesson kind's steps and stars (N-400 lessons).
     */
    async saveRun(lessonId, results, now = new Date(), rules = null) {
      if (!on) return null;
      const existing = await lessonProgress.get(lessonId);
      const row = progressRow(lessonId, results, existing, now, rules);
      await lessonProgress.save(existing, row);
      return row;
    },

    /**
     * Today's goal: lessons finished today of the learner's lessons per day.
     * null when there is no goal (no setting yet, or the switch off).
     */
    async todayGoal(courseLessonIds, now = new Date()) {
      if (!on) return null;
      const user = await auth.me();
      const goal = Number(user?.lessons_per_day) || 0;
      if (!goal) return null;
      const ids = new Set(courseLessonIds);
      const today = ymd(now);
      const rows = await lessonProgress.list();
      const done = rows.filter((r) => ids.has(r.lesson_id) && r.completed_at && ymd(new Date(r.completed_at)) === today).length;
      return { goal, done };
    },
  };
}

export const coursePlay = createCoursePlay();
