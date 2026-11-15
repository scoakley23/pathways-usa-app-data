// Saving a course lesson through src/api/coursePlay.js (Prompt 6), with fake
// clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createCoursePlay } = await import('./coursePlay');

const all = { listen: 'right', teachBack: 'right', readIt: 'right', writeIt: 'right', officer: 'right' };

function setup({ provider = 'supabase', user = { email: 'ana@example.test' }, rows = [] } = {}) {
  const saved = [];
  const lessonProgress = {
    get: vi.fn(async (id) => rows.find((r) => r.lesson_id === id) || null),
    save: vi.fn(async (existing, row) => { saved.push({ existing, row }); return row; }),
    list: vi.fn(async () => rows),
  };
  const review = { afterPractice: vi.fn(async () => {}) };
  const auth = { me: vi.fn(async () => user), updateMe: vi.fn(async () => {}) };
  return { saved, lessonProgress, review, auth, api: createCoursePlay({ provider, auth, lessonProgress, review }) };
}

describe('saving a lesson on Supabase', () => {
  it('saves the run as one lesson_progress row: steps, stars, finished', async () => {
    const { api, saved } = setup();
    await api.saveRun('u2-s2-l3', all, new Date('2026-11-15T15:00:00Z'));
    expect(saved).toHaveLength(1);
    expect(saved[0].row).toEqual({ lesson_id: 'u2-s2-l3', steps_done: 5, stars: 3, completed: true, completed_at: '2026-11-15T15:00:00.000Z' });
  });

  it('a missed question goes into review at box 1 (a wrong answer)', async () => {
    const { api, review } = setup();
    await api.missed('q1');
    expect(review.afterPractice).toHaveBeenCalledWith('q1', false);
  });

  it('a level-1 Write it pass counts toward level 2; the second moves to level 2', async () => {
    const { api, auth } = setup({ user: { email: 'ana@example.test', write_level: 1, write_level1_passes: 1 } });
    expect(await api.afterWriteIt(true)).toEqual({ write_level: 2, write_level1_passes: 2 });
    expect(auth.updateMe).toHaveBeenCalledWith({ write_level: 2, write_level1_passes: 2 });
  });

  it('a miss changes nothing', async () => {
    const { api, auth } = setup({ user: { email: 'ana@example.test', write_level: 1, write_level1_passes: 0 } });
    await api.afterWriteIt(false);
    expect(auth.updateMe).not.toHaveBeenCalled();
  });

  it('today’s goal: course lessons finished today of the learner’s lessons per day', async () => {
    const rows = [
      { lesson_id: 'a', completed_at: '2026-11-15T09:00:00' },
      { lesson_id: 'b', completed_at: '2026-11-14T09:00:00' },
      { lesson_id: 'old', completed_at: '2026-11-15T09:00:00' },
    ];
    const { api } = setup({ user: { email: 'ana@example.test', lessons_per_day: 2 }, rows });
    expect(await api.todayGoal(['a', 'b'], new Date('2026-11-15T18:00:00'))).toEqual({ goal: 2, done: 1 });
    const none = setup({ rows });
    expect(await none.api.todayGoal(['a'], new Date('2026-11-15T18:00:00'))).toBeNull();
  });
});

describe('with the switch off (Base44)', () => {
  it('saves nothing at all', async () => {
    const { api, saved, review, auth } = setup({ provider: 'base44' });
    expect(api.saves).toBe(false);
    expect(await api.saveRun('l', all)).toBeNull();
    await api.missed('q1');
    await api.afterWriteIt(true);
    expect(saved).toEqual([]);
    expect(review.afterPractice).not.toHaveBeenCalled();
    expect(auth.updateMe).not.toHaveBeenCalled();
    expect(await api.writeLevel()).toEqual({ write_level: 1, write_level1_passes: 0 });
  });
});
