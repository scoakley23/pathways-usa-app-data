// Course progress for the Course tab through src/api/course.js (Prompt 5),
// with fake clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createCourseApi } = await import('./course');
const { fakeSupabase } = await import('./testing/fakeSupabase');

const ANA = { id: 'u-ana', email: 'ana@example.test' };
const auth = { me: vi.fn(async () => ANA) };

describe('course progress', () => {
  it('Supabase: the learner\'s own course lessons and passed Speak it! checkpoints', async () => {
    const sb = fakeSupabase({
      checkpoint_results: [
        { id: 'c1', user_id: 'u-ana', section_id: 'u2-s2', correct: 6, total: 7, passed_at: '2026-11-15T10:00:00Z' },
        { id: 'c2', user_id: 'u-ana', section_id: 'u2-s3', correct: 2, total: 6, passed_at: null },
        { id: 'c3', user_id: 'u-ben', section_id: 'u2-s1', correct: 5, total: 5, passed_at: '2026-11-15T10:00:00Z' },
      ],
    });
    const lessonProgress = {
      list: vi.fn(async () => [
        { lesson_id: 'u2-s2-l1', completed: true, stars: 3, steps_done: 5 },
        { lesson_id: 'u2-s2-l2', completed: false, stars: 1, steps_done: 2 },
        { lesson_id: 'old-lesson', completed: true, stars: 0 },
      ]),
    };
    const api = createCourseApi({ provider: 'supabase', supabase: sb, auth, lessonProgress });
    const { lessons, checkpoints } = await api.load(['u2-s2-l1', 'u2-s2-l2']);
    expect(lessons).toEqual({
      'u2-s2-l1': { completed: true, stars: 3, steps_done: 5 },
      'u2-s2-l2': { completed: false, stars: 1, steps_done: 2 },
    });
    expect([...checkpoints]).toEqual(['u2-s2']);
  });

  it('Base44: nothing is saved there yet, so everyone starts at the beginning', async () => {
    const lessonProgress = { list: vi.fn() };
    const api = createCourseApi({ provider: 'base44', auth, lessonProgress });
    const { lessons, checkpoints } = await api.load(['u2-s2-l1']);
    expect(lessons).toEqual({});
    expect(checkpoints.size).toBe(0);
    expect(lessonProgress.list).not.toHaveBeenCalled();
  });
});
