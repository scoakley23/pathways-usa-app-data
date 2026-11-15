// The daily plan (Prompt 7): ready-by month, pace, today's lesson and goal.
import { describe, it, expect } from 'vitest';
import { amioLineKey, checkpointProgress, finishedToday, lessonsLeft, monthChoices, readyBy, recommendedPace, starsToday, todayLesson } from './dailyPlan';
import { UNITS } from './course';

const TODAY = new Date(2026, 10, 15, 12);

describe('readyBy and recommendedPace', () => {
  it('uses 6 study days a week', () => {
    // 12 lessons at 2 a day = 6 study days = 7 calendar days
    expect(readyBy(12, 2, TODAY).toDateString()).toBe(new Date(2026, 10, 22).toDateString());
    expect(readyBy(0, 1, TODAY).toDateString()).toBe(TODAY.toDateString());
  });

  it('a faster pace is never later', () => {
    expect(readyBy(72, 3, TODAY) <= readyBy(72, 2, TODAY)).toBe(true);
    expect(readyBy(72, 2, TODAY) <= readyBy(72, 1, TODAY)).toBe(true);
  });

  it('recommends the lightest pace ready by the end of the month', () => {
    // 72 lessons: 1/day ≈ 84 days (Feb), 2/day = 42 days (Dec 27), 3/day = 28 days (Dec 13)
    expect(recommendedPace(72, new Date(2027, 2, 15), TODAY)).toBe(1);
    expect(recommendedPace(72, new Date(2027, 0, 15), TODAY)).toBe(2);
    expect(recommendedPace(72, new Date(2026, 11, 15), TODAY)).toBe(2);
    expect(recommendedPace(100, new Date(2026, 11, 15), TODAY)).toBe(3);
    expect(recommendedPace(72, new Date(2026, 10, 15), TODAY)).toBe(3); // nothing fits
    expect(recommendedPace(72, null, TODAY)).toBe(2); // "I don't know yet"
  });

  it('offers this month and the next four', () => {
    expect(monthChoices(TODAY).map((m) => m.month)).toEqual(['2026-11', '2026-12', '2027-01', '2027-02', '2027-03']);
  });
});

describe('today', () => {
  const progress = {
    a: { stars: 3, completed_at: '2026-11-15T09:00:00' },
    b: { stars: 2, completed_at: '2026-11-15T18:00:00' },
    c: { stars: 3, completed_at: '2026-11-14T09:00:00' },
    d: { stars: 1, steps_done: 2 },
  };

  it('counts lessons and stars finished today only', () => {
    expect(finishedToday(progress, TODAY).sort()).toEqual(['a', 'b']);
    expect(starsToday(progress, TODAY)).toBe(5);
  });

  it('picks Amio\'s line from the goal', () => {
    expect(amioLineKey(0, 0).key).toBe('amio_ready');
    expect(amioLineKey(2, 0).key).toBe('amio_first');
    expect(amioLineKey(3, 1)).toEqual({ key: 'amio_next', vars: { n: 2 } });
    expect(amioLineKey(2, 1)).toEqual({ key: 'amio_last', vars: { n: 2 } });
    expect(amioLineKey(2, 2).key).toBe('amio_goal_done');
  });

  it('finds today\'s lesson at the current stop', () => {
    const unit = UNITS.find((u) => u.sections.some((s) => (s.lessons || []).length > 1));
    const section = unit.sections.find((s) => (s.lessons || []).length > 1);
    const lesson = section.lessons[1];
    const stops = [
      { type: 'lesson', state: 'done', unitId: unit.id, sectionId: section.id, lessonId: section.lessons[0].id },
      { type: 'lesson', state: 'current', unitId: unit.id, sectionId: section.id, lessonId: lesson.id },
    ];
    expect(todayLesson(UNITS, stops)).toMatchObject({ unit, section, lesson, number: 2, of: section.lessons.length });
    expect(todayLesson(UNITS, [stops[0]])).toBeNull();
  });

  it('counts toward the checkpoint and the whole course', () => {
    const section = { lessons: [{ id: 'a' }, { id: 'c' }, { id: 'd' }] };
    expect(checkpointProgress(section, progress)).toEqual({ done: 2, total: 3, left: 1 });
    const total = UNITS.flatMap((u) => u.sections.flatMap((s) => s.lessons || [])).length;
    expect(lessonsLeft(UNITS, {})).toBe(total);
  });
});
