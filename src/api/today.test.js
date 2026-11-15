// What Today reads and saves (Prompt 7), with fakes.
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/db', () => ({ DATA_PROVIDER: 'base44' }));
vi.mock('@/api/auth', () => ({ auth: {} }));
vi.mock('@/api/profile', () => ({ profile: {} }));
vi.mock('@/api/review', () => ({ default: {} }));

const { createTodayApi, LESSONS_PER_DAY_KEY } = await import('./today');

const fakes = () => ({
  auth: { updateMe: vi.fn(async () => ({})) },
  profile: { activeDays: vi.fn(async () => ['2026-11-15']) },
  review: { due: vi.fn(async () => [{ id: 1 }, { id: 2 }]) },
});

// A device-storage stand-in (tests run without a browser).
const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
};
beforeEach(() => store.clear());

describe('today api', () => {
  it('Supabase: lessons per day is on the profile', async () => {
    const f = fakes();
    const api = createTodayApi({ provider: 'supabase', ...f });
    expect(api.lessonsPerDay({ lessons_per_day: 2 })).toBe(2);
    expect(api.lessonsPerDay({})).toBe(0);
    expect(await api.setLessonsPerDay(3)).toBe(3);
    expect(f.auth.updateMe).toHaveBeenCalledWith({ lessons_per_day: 3 });
    expect(localStorage.getItem(LESSONS_PER_DAY_KEY)).toBeNull();
  });

  it('Base44: lessons per day stays on the device', async () => {
    const f = fakes();
    const api = createTodayApi({ provider: 'base44', ...f });
    expect(api.lessonsPerDay({ lessons_per_day: 2 })).toBe(0);
    await api.setLessonsPerDay(1);
    expect(api.lessonsPerDay({})).toBe(1);
    expect(f.auth.updateMe).not.toHaveBeenCalled();
  });

  it('ignores anything but 1, 2 or 3', async () => {
    const f = fakes();
    const api = createTodayApi({ provider: 'supabase', ...f });
    expect(await api.setLessonsPerDay(9)).toBe(0);
    expect(f.auth.updateMe).not.toHaveBeenCalled();
  });

  it('reads active days and the due count, and never throws', async () => {
    const f = fakes();
    const api = createTodayApi({ provider: 'supabase', ...f });
    expect(await api.activeDays()).toEqual(['2026-11-15']);
    expect(await api.dueCount()).toBe(2);
    f.profile.activeDays.mockRejectedValue(new Error('offline'));
    f.review.due.mockRejectedValue(new Error('offline'));
    expect(await api.activeDays()).toEqual([]);
    expect(await api.dueCount()).toBe(0);
  });
});
