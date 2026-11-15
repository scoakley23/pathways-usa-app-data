// The kind streak (Prompt 7): one missed day a week is a rest day.
import { describe, it, expect } from 'vitest';
import { streak } from './streak';

// Sun Nov 15 2026 (local noon). Week = Mon Nov 9 to Sun Nov 15.
const TODAY = new Date(2026, 10, 15, 12);

describe('streak', () => {
  it('is 0 with no saved days', () => {
    expect(streak([], TODAY)).toEqual({ days: 0, restUsed: 0 });
  });

  it('counts days in a row, today included', () => {
    expect(streak(['2026-11-13', '2026-11-14', '2026-11-15'], TODAY).days).toBe(3);
  });

  it('today not opened yet does not break it', () => {
    expect(streak(['2026-11-13', '2026-11-14'], TODAY)).toEqual({ days: 2, restUsed: 0 });
  });

  it('one missed day in a week is a rest day', () => {
    const r = streak(['2026-11-12', '2026-11-14', '2026-11-15'], TODAY);
    expect(r).toEqual({ days: 3, restUsed: 1 });
  });

  it('a second missed day in the same week stops it', () => {
    const r = streak(['2026-11-10', '2026-11-12', '2026-11-14', '2026-11-15'], TODAY);
    expect(r.days).toBe(3); // 15, 14, (13 rest), 12, then 11 is a second miss
  });

  it('each Monday-to-Sunday week gets its own rest day', () => {
    // missed Fri Nov 13 (this week) and Thu Nov 5 (last week)
    const days = ['2026-11-04', '2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-14', '2026-11-15'];
    expect(streak(days, TODAY)).toEqual({ days: 10, restUsed: 2 });
  });

  it('stops at the first day the app was opened', () => {
    expect(streak(['2026-11-15'], TODAY)).toEqual({ days: 1, restUsed: 0 });
  });
});
