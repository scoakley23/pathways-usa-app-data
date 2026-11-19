import { describe, it, expect } from 'vitest';
import { MINUTE_CHOICES, DEFAULT_PER_DAY, minutesForPerDay, perDayForMinutes } from './dailyMinutes';
import { PACES } from './dailyPlan';

describe('daily minutes', () => {
  it('maps about 5 / 10 / 15 min a day to 1 / 2 / 3 lessons a day', () => {
    expect(MINUTE_CHOICES.map((c) => [c.minutes, c.perDay])).toEqual([[5, 1], [10, 2], [15, 3]]);
    expect([1, 2, 3].map(minutesForPerDay)).toEqual([5, 10, 15]);
    expect([5, 10, 15].map(perDayForMinutes)).toEqual([1, 2, 3]);
  });

  it('covers every pace on Your plan and nothing else', () => {
    expect(MINUTE_CHOICES.map((c) => c.perDay)).toEqual(PACES.map((p) => p.perDay));
    expect(minutesForPerDay(4)).toBeNull();
    expect(perDayForMinutes(20)).toBeNull();
    expect(MINUTE_CHOICES.map((c) => c.perDay)).toContain(DEFAULT_PER_DAY);
  });
});
