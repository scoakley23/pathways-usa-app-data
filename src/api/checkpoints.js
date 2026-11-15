// Saving checkpoints (Prompt 8). Supabase only (the switch on); with it off
// nothing is saved, like lessons.
// - `checkpoint_results`: one row per finished Speak it! (section id) or Read
//   and write stop (stop id): correct, total, passed_at (null = not passed).
//   Never what the learner said.
// - Missed Speak it! questions go into `review_items` at box 1.
// - The review chest reads due questions and saves each answer through the
//   one review schedule (src/api/review.js plan/commit: right → up a box,
//   wrong → box 1), on both backends.
//
// `createCheckpointsApi({ provider, supabase, auth, review })` takes its
// clients so tests can pass fakes; the app uses `checkpoints`.
import { DATA_PROVIDER, run } from '@/api/db';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';
import appReview from '@/api/review';

export function createCheckpointsApi({ provider = DATA_PROVIDER, supabase = getSupabase, auth = appAuth, review = appReview } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const on = provider === 'supabase';
  return {
    saves: on,

    /** Save one try. id: a section id (Speak it!) or a stop id (Read and write). */
    async saveResult(id, { correct, total, passed }, now = new Date()) {
      if (!on || !id || !(total > 0)) return null;
      const user = await auth.me();
      const row = {
        user_id: user.id,
        section_id: id,
        correct: Math.max(0, Math.min(Number(correct) || 0, total)),
        total,
        passed_at: passed ? now.toISOString() : null,
      };
      await run(sb().from('checkpoint_results').insert(row));
      return row;
    },

    /** A Speak it! question answered wrong: into review at box 1. */
    async missed(questionId) {
      if (!on || !questionId) return;
      await review.afterPractice(questionId, false);
    },

    /** Due review entries for the chest: [{ questionId, row | item }]. */
    async due({ limit = 6, knownIds = null } = {}) {
      try { return await review.due({ limit, knownIds }); } catch (e) { return []; }
    },

    /** Save a chest answer: moves the question between boxes. */
    async chestAnswer(entry, correct) {
      const planned = await review.plan(entry, correct);
      await review.commit(entry, planned, correct);
      return planned;
    },
  };
}

export const checkpoints = createCheckpointsApi();
