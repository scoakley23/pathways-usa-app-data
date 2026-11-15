// The review schedule through src/api/review.js: Base44's old schedule (switch
// off) or Prompt 4's review_items boxes (switch on). Fake clients only.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createReviewApi } = await import('./review');
const { createProgressApi } = await import('./progress');
const { fakeSupabase } = await import('./testing/fakeSupabase');
const { pickForPractice } = await import('@/lib/practicePicking');

const ANA = { id: 'u-ana', email: 'ana@example.test' };
const auth = { me: vi.fn(async () => ANA) };
const TODAY = new Date(2026, 10, 14); // Nov 14, 2026 (local)

const supabaseSetup = (tables = {}) => {
  const sb = fakeSupabase({
    review_items: [
      { user_id: 'u-ana', question_id: 'q1', box: 1, next_due: '2026-11-13' },
      { user_id: 'u-ana', question_id: 'q2', box: 3, next_due: '2026-11-14' },
      { user_id: 'u-ana', question_id: 'q3', box: 4, next_due: '2026-11-20' },
      { user_id: 'u-ana', question_id: 'gone', box: 1, next_due: '2026-11-01' },
      { user_id: 'u-ben', question_id: 'q9', box: 1, next_due: '2026-11-01' },
    ],
    user_progress: [],
    ...tables,
  });
  const progress = createProgressApi({ provider: 'supabase', supabase: sb, auth });
  return { sb, review: createReviewApi({ provider: 'supabase', supabase: sb, auth, progress }) };
};
const KNOWN = new Set(['q1', 'q2', 'q3', 'q4']);

describe('review on Supabase (review_items boxes)', () => {
  it('due: only the learner\'s own, oldest due first, known questions only', async () => {
    const { review } = supabaseSetup();
    expect((await review.due({ now: TODAY, knownIds: KNOWN })).map((e) => e.questionId)).toEqual(['q1', 'q2']);
    expect((await review.nextDue({ now: TODAY, knownIds: KNOWN })).getDate()).toBe(20);
    expect(review.usesBoxes).toBe(true);
  });

  it('a right answer moves the box up; a wrong one sends it to box 1', async () => {
    const { review, sb } = supabaseSetup();
    const [q1, q2] = await review.due({ now: TODAY, knownIds: KNOWN });
    const right = review.plan(q1, true, TODAY);
    expect(right).toMatchObject({ days: 3, item: { question_id: 'q1', box: 2, next_due: '2026-11-17' } });
    const wrong = review.plan(q2, false, TODAY);
    expect(wrong).toMatchObject({ days: 1, item: { box: 1, next_due: '2026-11-15' } });
    await review.commit(q1, right, true, TODAY);
    await review.commit(q2, wrong, false, TODAY);
    const mine = Object.fromEntries(sb.tables.review_items.filter((r) => r.user_id === 'u-ana').map((r) => [r.question_id, [r.box, r.next_due]]));
    expect(mine.q1).toEqual([2, '2026-11-17']);
    expect(mine.q2).toEqual([1, '2026-11-15']);
    // user_progress keeps status and results only, never the old review fields
    const p = sb.tables.user_progress.find((r) => r.content_id === 'q1');
    expect(p).toMatchObject({ user_id: 'u-ana', content_type: 'civics_question', last_result: 'correct' });
    expect(p).not.toHaveProperty('interval');
    expect(p).not.toHaveProperty('ease_factor');
  });

  it('/learn: right → box 2 (3 days), wrong → box 1 (1 day); one row per question', async () => {
    const { review, sb } = supabaseSetup();
    await review.afterLearn('q4', true, { now: TODAY });
    await review.afterLearn('q5', false, { now: TODAY });
    await review.afterLearn('q5', false, { now: TODAY });
    const rows = sb.tables.review_items.filter((r) => ['q4', 'q5'].includes(r.question_id));
    expect(rows.map((r) => [r.question_id, r.box, r.next_due])).toEqual([['q4', 2, '2026-11-17'], ['q5', 1, '2026-11-15']]);
    expect(sb.tables.user_progress.filter((r) => r.content_id === 'q5')).toHaveLength(1);
  });

  it('Practice: a civics answer moves the box', async () => {
    const { review, sb } = supabaseSetup();
    await review.afterPractice('q3', true, { now: TODAY });
    expect(sb.tables.review_items.find((r) => r.question_id === 'q3')).toMatchObject({ box: 5, next_due: '2026-12-14' });
  });
});

describe('review on Base44 (switch off): the old schedule, unchanged', () => {
  const rows = [
    { id: 'r1', content_id: 'q1', content_type: 'civics_question', last_practiced: '2026-11-01T10:00:00Z', interval: 3, ease_factor: 2.5, consecutive_correct: 1 },
    { id: 'r2', content_id: 'gone', content_type: 'civics_question', last_practiced: '2026-10-01T10:00:00Z', interval: 1 },
    { id: 'r3', content_id: 'q2', content_type: 'civics_question', last_practiced: '2026-11-13T10:00:00Z', interval: 30 },
  ];
  const setup44 = () => {
    const progress = { list: vi.fn(async () => rows), update: vi.fn(async () => ({})), get: vi.fn(async () => null), save: vi.fn(async () => ({})) };
    return { progress, review: createReviewApi({ provider: 'base44', auth, progress }) };
  };

  it('due from UserProgress (known questions only); plan/commit update the row as before', async () => {
    const { review, progress } = setup44();
    const due = await review.due({ now: TODAY, knownIds: KNOWN });
    expect(due.map((e) => e.questionId)).toEqual(['q1']);
    expect(review.usesBoxes).toBe(false);
    const planned = review.plan(due[0], true, TODAY);
    expect(planned.days).toBe(6); // second right answer in a row: 6 days (old rule)
    await review.commit(due[0], planned, true, TODAY);
    expect(progress.update).toHaveBeenCalledWith('r1', planned.progress);
  });

  it('/learn saves the old 3-day schedule on UserProgress; Practice does nothing extra', async () => {
    const { review, progress } = setup44();
    await review.afterLearn('q4', true, { email: 'ana@example.test', now: TODAY });
    expect(progress.save).toHaveBeenCalledWith(null, expect.objectContaining({ user_email: 'ana@example.test', content_id: 'q4', interval: 3 }));
    expect(await review.afterPractice('q4', true)).toBeUndefined();
  });
});

describe('Practice picking on Supabase (src/lib/practicePicking.js)', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));
  const progress = [
    { content_id: 'a', status: 'mastered', last_result: 'correct', last_practiced: '2026-10-01T00:00:00Z' },
    { content_id: 'b', status: 'practicing', last_result: 'incorrect', last_practiced: '2026-11-10T00:00:00Z' },
    { content_id: 'c', status: 'practicing', last_result: 'correct', last_practiced: '2026-11-01T00:00:00Z' },
  ];

  it('civics: due review first, then unseen, then the rest, mastered last', () => {
    const due = [{ question_id: 'c', next_due: '2026-11-12' }, { question_id: 'a', next_due: '2026-12-01' }];
    const picked = pickForPractice(items, progress, due, { civics: true, today: TODAY, random: () => 0.5 });
    expect(picked.map((i) => i.id)).toEqual(['c', 'd', 'e', 'b', 'a']);
  });

  it('sentences and words: missed last time first, then unseen, then the rest, mastered last', () => {
    const picked = pickForPractice(items, progress, [], { today: TODAY, random: () => 0.5 });
    expect(picked.map((i) => i.id)).toEqual(['b', 'd', 'e', 'c', 'a']);
  });

  it('at most `limit` items', () => {
    expect(pickForPractice(items, [], [], { limit: 2 })).toHaveLength(2);
  });
});

describe('review_items only through src/api/review.js', () => {
  it('no other app file reads or writes the table', () => {
    const SRC = path.resolve(__dirname, '..');
    const hits = [];
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) { walk(full); continue; }
        if (!/\.(js|jsx)$/.test(name) || /\.test\.js$/.test(name)) continue;
        if (/from\(\s*['"]review_items['"]/.test(fs.readFileSync(full, 'utf8'))) hits.push(path.relative(SRC, full));
      }
    };
    walk(SRC);
    expect(hits).toEqual([path.join('api', 'review.js')]);
  });
});
