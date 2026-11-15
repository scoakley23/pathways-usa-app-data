// Saving checkpoints (Prompt 8) with a fake Supabase and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));
vi.mock('@/api/review', () => ({ default: {} }));

const { fakeSupabase } = await import('./testing/fakeSupabase');
const { createCheckpointsApi } = await import('./checkpoints');

const user = { id: 'u-1', email: 'learner@example.test' };
const fakeAuth = { me: vi.fn(async () => user) };
const fakeReview = () => ({
  afterPractice: vi.fn(async () => {}),
  due: vi.fn(async () => [{ questionId: 'q1', item: { box: 2 } }]),
  plan: vi.fn((entry, correct) => ({ days: correct ? 7 : 1 })),
  commit: vi.fn(async () => {}),
});

describe('checkpoints api', () => {
  it('Supabase: saves a passed Speak it! under the section id, and a missed question to review', async () => {
    const tables = {};
    const review = fakeReview();
    const api = createCheckpointsApi({ provider: 'supabase', supabase: fakeSupabase(tables), auth: fakeAuth, review });
    const now = new Date('2026-11-15T12:00:00Z');
    await api.saveResult('u2-s2', { correct: 5, total: 6, passed: true }, now);
    await api.saveResult('u2-s2-rw', { correct: 2, total: 6, passed: true }, now);
    await api.saveResult('u2-s3', { correct: 3, total: 6, passed: false }, now);
    expect(tables.checkpoint_results.map((r) => [r.section_id, r.correct, r.total, r.passed_at])).toEqual([
      ['u2-s2', 5, 6, now.toISOString()], ['u2-s2-rw', 2, 6, now.toISOString()], ['u2-s3', 3, 6, null],
    ]);
    expect(Object.keys(tables.checkpoint_results[0]).sort()).toEqual(['correct', 'id', 'passed_at', 'section_id', 'total', 'user_id']);
    await api.missed('q9');
    expect(review.afterPractice).toHaveBeenCalledWith('q9', false);
  });

  it('never saves an empty try', async () => {
    const tables = {};
    const api = createCheckpointsApi({ provider: 'supabase', supabase: fakeSupabase(tables), auth: fakeAuth, review: fakeReview() });
    expect(await api.saveResult('u2-s2', { correct: 0, total: 0, passed: false })).toBe(null);
    expect(tables.checkpoint_results).toBeUndefined();
  });

  it('switch off: nothing is saved', async () => {
    const tables = {};
    const review = fakeReview();
    const api = createCheckpointsApi({ provider: 'base44', supabase: fakeSupabase(tables), auth: fakeAuth, review });
    expect(api.saves).toBe(false);
    expect(await api.saveResult('u2-s2', { correct: 6, total: 6, passed: true })).toBe(null);
    await api.missed('q1');
    expect(review.afterPractice).not.toHaveBeenCalled();
    expect(tables.checkpoint_results).toBeUndefined();
  });

  it('the chest reads due questions and moves each answer through the review schedule', async () => {
    const review = fakeReview();
    const api = createCheckpointsApi({ provider: 'base44', auth: fakeAuth, review });
    const due = await api.due({ limit: 6 });
    expect(due).toEqual([{ questionId: 'q1', item: { box: 2 } }]);
    await api.chestAnswer(due[0], true);
    expect(review.plan).toHaveBeenCalledWith(due[0], true);
    expect(review.commit).toHaveBeenCalledWith(due[0], { days: 7 }, true);
    review.due.mockRejectedValue(new Error('offline'));
    expect(await api.due()).toEqual([]);
  });
});
