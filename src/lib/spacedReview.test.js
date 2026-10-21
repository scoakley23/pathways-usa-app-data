import { describe, it, expect } from 'vitest';
import { dueForReview, isDue, learnedProgress, nextReviewDate, nextSchedule } from './spacedReview';

const NOW = new Date('2026-10-21T12:00:00Z');
const daysAgo = (d) => new Date(NOW.getTime() - d * 86400000).toISOString();
const row = (id, lastDaysAgo, interval, type = 'civics_question') => ({ id, content_id: id, content_type: type, last_practiced: daysAgo(lastDaysAgo), interval });

describe('due for review', () => {
  it('is due when last practiced + interval days is today or earlier', () => {
    expect(isDue(row('a', 3, 3), NOW)).toBe(true);
    expect(isDue(row('a', 2, 3), NOW)).toBe(false);
    expect(isDue(row('a', 0, 0), NOW)).toBe(true);
    expect(isDue({ interval: 5 }, NOW)).toBe(true);
  });

  it('lists civics rows only, most overdue first, at most 5', () => {
    const rows = [row('late', 10, 3), row('due', 3, 3), row('new', 0, 0), row('later', 1, 6), row('word', 9, 1, 'vocabulary'),
      row('d1', 5, 1), row('d2', 6, 1), row('d3', 7, 1)];
    const ids = dueForReview(rows, NOW).map((r) => r.id);
    expect(ids).toEqual(['late', 'd3', 'd2', 'd1', 'due']);
    expect(dueForReview(rows, NOW, 10).map((r) => r.id)).toContain('new');
    expect(ids).not.toContain('word');
  });

  it('finds the next review date', () => {
    expect(nextReviewDate([row('later', 1, 6)], NOW).toISOString()).toBe(new Date(NOW.getTime() + 5 * 86400000).toISOString());
    expect(nextReviewDate([row('due', 3, 3)], NOW)).toBe(null);
  });
});

describe('nextSchedule (same SM-2 rules as Practice)', () => {
  it('steps 1 → 6 → interval × ease on correct answers', () => {
    const a = nextSchedule({ ease_factor: 2.5, interval: 3, consecutive_correct: 0 }, true, 100, NOW);
    expect(a).toMatchObject({ interval: 1, consecutive_correct: 1, ease_factor: 2.5, status: 'practicing', last_result: 'correct' });
    const b = nextSchedule({ ...a, ease_factor: 2.3 }, true, 100, NOW);
    expect(b).toMatchObject({ interval: 6, consecutive_correct: 2, status: 'practicing' });
    expect(b.ease_factor).toBeCloseTo(2.4);
    const c = nextSchedule(b, true, 100, NOW);
    expect(c).toMatchObject({ interval: Math.round(6 * b.ease_factor), consecutive_correct: 3, status: 'mastered' });
    expect(c.total_attempts).toBe(3);
  });

  it('resets on a wrong answer and lowers ease (min 1.3)', () => {
    const r = nextSchedule({ ease_factor: 1.4, interval: 6, consecutive_correct: 2, best_score: 100, total_attempts: 4 }, false, 0, NOW);
    expect(r).toMatchObject({ interval: 0, consecutive_correct: 0, ease_factor: 1.3, last_result: 'incorrect', best_score: 100, last_score: 0, total_attempts: 5 });
    expect(r.last_practiced).toBe(NOW.toISOString());
  });

  it('works without a previous row', () => {
    expect(nextSchedule(null, true, 100, NOW)).toMatchObject({ interval: 1, consecutive_correct: 1, total_attempts: 1 });
  });
});

describe('learnedProgress (first lesson)', () => {
  it('schedules the quick check in 3 days', () => {
    expect(learnedProgress(null, true, NOW)).toEqual({
      status: 'practicing', last_practiced: NOW.toISOString(), interval: 3, consecutive_correct: 1, last_result: 'correct',
      ease_factor: 2.5, total_attempts: 1, best_score: 100, last_score: 100,
    });
    expect(learnedProgress({ total_attempts: 2, best_score: 100 }, false, NOW)).toMatchObject({ consecutive_correct: 0, last_result: 'incorrect', total_attempts: 3, best_score: 100, last_score: 0 });
  });
});
