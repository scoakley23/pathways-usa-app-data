// The review schedule for civics questions (when to see a question again).
//
// Switch off (Base44): the old schedule on `UserProgress`
// (src/lib/spacedReview.js), unchanged.
// Switch on (Supabase): Prompt 4's one schedule, `review_items`: one row per
// question, box 1-5 = due in 1, 3, 7, 14 or 30 days; right → up one box,
// wrong → box 1 (src/lib/reviewSchedule.js). `user_progress` keeps only
// status, last result, scores and attempts.
//
// Screens:
//   review.due({ limit })            → [{ questionId, row | item }] due now
//   review.nextDue()                 → Date of the next review, or null
//   review.plan(entry, correct)      → { days, … } what the answer will do (no save)
//   review.commit(entry, plan, correct) saves it (/review)
//   review.afterLearn(questionId, correct)    /learn, first time on a question
//   review.afterPractice(questionId, correct) a civics answer in Practice
//   review.usesBoxes, review.items()  for Practice's picking on Supabase
//
// `createReviewApi({ provider, supabase, auth, progress })` takes its
// clients so tests can pass fakes; the app uses `review`.
import { DATA_PROVIDER, run, selectAll } from '@/api/db';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';
import { progress as appProgress } from '@/api/progress';
import { dueForReview, nextReviewDate, nextSchedule, learnedProgress } from '@/lib/spacedReview';
import { afterAnswer, dueItems, BOX_DAYS } from '@/lib/reviewSchedule';

export const REVIEW_LIMIT = 5;

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const fromYmd = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

export function createReviewApi({ provider = DATA_PROVIDER, supabase = getSupabase, auth = appAuth, progress = appProgress } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';

  // The learner's review_items rows (Supabase).
  const items = async () => {
    const user = await auth.me();
    return selectAll(() => sb().from('review_items').select('question_id, box, next_due').eq('user_id', user.id).order('question_id', { ascending: true }));
  };
  const saveItem = async (item) => {
    const user = await auth.me();
    return run(sb().from('review_items')
      .upsert({ user_id: user.id, question_id: item.question_id, box: item.box, next_due: item.next_due }, { onConflict: 'user_id,question_id' }));
  };
  const itemFor = async (questionId) => {
    const user = await auth.me();
    return run(sb().from('review_items').select('question_id, box, next_due').eq('user_id', user.id).eq('question_id', questionId).maybeSingle());
  };

  return {
    usesBoxes: onSupabase,
    items,

    // `knownIds`: only questions that still exist count (a Set of ids).
    async due({ limit = REVIEW_LIMIT, now = new Date(), knownIds = null } = {}) {
      const known = (id) => !knownIds || knownIds.has(id);
      if (!onSupabase) {
        const rows = (await progress.list({ contentType: 'civics_question', limit: 1000 })).filter((r) => known(r.content_id));
        return dueForReview(rows, now, limit).map((row) => ({ questionId: row.content_id, row }));
      }
      const mine = (await items()).filter((i) => known(i.question_id));
      return dueItems(mine, now, limit).map((item) => ({ questionId: item.question_id, item }));
    },

    async nextDue({ now = new Date(), knownIds = null } = {}) {
      const known = (id) => !knownIds || knownIds.has(id);
      if (!onSupabase) {
        const rows = (await progress.list({ contentType: 'civics_question', limit: 1000 })).filter((r) => known(r.content_id));
        return nextReviewDate(rows, now);
      }
      const today = ymd(now);
      const later = (await items()).filter((i) => known(i.question_id)).map((i) => i.next_due).filter((d) => d > today).sort();
      return later.length ? fromYmd(later[0]) : null;
    },

    // What an answer in /review will do, without saving: { days, … }.
    plan(entry, correct, now = new Date()) {
      if (!onSupabase) {
        const next = nextSchedule(entry.row, correct, correct ? 100 : 0, now);
        return { days: next.interval, progress: next };
      }
      const item = afterAnswer(entry.item, entry.questionId, correct, now);
      return { days: BOX_DAYS[item.box], item };
    },

    // Save a /review answer planned with plan().
    async commit(entry, planned, correct, now = new Date()) {
      if (!onSupabase) return progress.update(entry.row.id, planned.progress);
      await saveItem(planned.item);
      const existing = await progress.get(entry.questionId);
      const next = nextSchedule(existing, correct, correct ? 100 : 0, now);
      await progress.save(existing, { content_id: entry.questionId, content_type: 'civics_question', ...next });
    },

    // /learn: the first lesson on a question. Base44: due in 3 days, as
    // before. Supabase: right → box 2 (3 days), wrong → box 1 (1 day).
    async afterLearn(questionId, correct, { email, now = new Date() } = {}) {
      const existing = await progress.get(questionId);
      const fields = learnedProgress(existing || undefined, correct, now);
      if (!onSupabase) {
        await progress.save(existing, { user_email: email, content_id: questionId, content_type: 'civics_question', ...fields });
        return;
      }
      await progress.save(existing, { content_id: questionId, content_type: 'civics_question', ...fields });
      await saveItem(afterAnswer(await itemFor(questionId), questionId, correct, now));
    },

    // A civics answer in Practice. Base44: Practice already saved its own
    // schedule on UserProgress. Supabase: move the question's box.
    async afterPractice(questionId, correct, { now = new Date() } = {}) {
      if (!onSupabase) return;
      await saveItem(afterAnswer(await itemFor(questionId), questionId, correct, now));
    },
  };
}

export const review = createReviewApi();
export default review;
