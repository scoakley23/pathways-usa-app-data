import { describe, it, expect } from 'vitest';
import { tasksForDay, weekPlan, weeksLeft, taskCount, n400ForWeek, totalMinutes, extraTasks, daysBetween } from './studyPlan';

const SECTIONS = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
const d = (s) => new Date(`${s}T12:00:00`);
const base = { start: d('2026-11-02'), sections: SECTIONS, completedSections: [] };

describe('weeksLeft / taskCount', () => {
  it('counts weeks to the target, null when open-ended', () => {
    expect(weeksLeft(d('2026-11-02'), d('2027-01-25'))).toBe(12);
    expect(weeksLeft(d('2026-11-02'), d('2026-11-01'))).toBe(0);
    expect(weeksLeft(d('2026-11-02'), null)).toBeNull();
  });
  it('gives 3–5 tasks: fewer after missed days, more near the date', () => {
    expect(taskCount({ weeks: 12 })).toBe(4);
    expect(taskCount({ weeks: 3 })).toBe(5);
    expect(taskCount({ weeks: null })).toBe(4);
    expect(taskCount({ weeks: 3, missedDays: 2 })).toBe(3);
  });
});

describe('tasksForDay', () => {
  const levels = { civics: 'start_here', reading: 'strong', writing: 'getting_there', speaking: 'start_here' };

  it('always has 3–5 tasks of about 15 minutes, with civics every day', () => {
    for (let i = 0; i < 60; i++) {
      const date = new Date(d('2026-11-02').getTime() + i * 864e5);
      const tasks = tasksForDay({ ...base, date, target: d('2027-01-25'), levels });
      expect(tasks.length).toBeGreaterThanOrEqual(3);
      expect(tasks.length).toBeLessThanOrEqual(5);
      expect(totalMinutes(tasks)).toBeGreaterThanOrEqual(10);
      expect(totalMinutes(tasks)).toBeLessThanOrEqual(22);
      expect(tasks.some((t) => t.kind.startsWith('civics'))).toBe(true);
      expect(new Set(tasks.map((t) => t.id)).size).toBe(tasks.length);
    }
  });

  it('is the same for the same inputs', () => {
    const ctx = { ...base, date: d('2026-11-10'), target: d('2027-01-25'), levels };
    expect(tasksForDay(ctx)).toEqual(tasksForDay(ctx));
  });

  it('spends more time on "Start here" skills than "Strong" ones', () => {
    const count = { reading: 0, speaking: 0 };
    for (let i = 0; i < 28; i++) {
      const date = new Date(d('2026-11-02').getTime() + i * 864e5);
      for (const t of tasksForDay({ ...base, date, target: d('2027-01-25'), levels })) if (t.kind in count) count[t.kind]++;
    }
    expect(count.speaking).toBeGreaterThan(count.reading);
    expect(count.reading).toBeGreaterThan(0); // strong skills still get spaced review
  });

  it('always fills the day to the planned count', () => {
    for (const lv of [levels, {}, { civics: 'strong', reading: 'strong', writing: 'strong', speaking: 'strong' }]) {
      for (let i = 0; i < 60; i++) {
        const date = new Date(d('2026-11-02').getTime() + i * 864e5);
        expect(tasksForDay({ ...base, date, target: null, levels: lv }).length).toBe(4);
      }
    }
  });

  it('still makes a plan when nothing was checked (new device or skipped)', () => {
    const tasks = tasksForDay({ ...base, date: d('2026-11-05'), levels: {} });
    expect(tasks.length).toBe(4);
  });

  it('makes a shorter plan after missed days', () => {
    const tasks = tasksForDay({ ...base, date: d('2026-11-05'), target: d('2026-11-20'), levels, missedDays: 3 });
    expect(tasks.length).toBe(3);
  });

  it('works for an open-ended plan and when the date has passed', () => {
    expect(tasksForDay({ ...base, date: d('2027-03-01'), target: null, levels }).length).toBe(4);
    expect(tasksForDay({ ...base, date: d('2027-03-01'), target: d('2027-01-25'), levels }).length).toBe(5);
  });

  it('links each task to where it opens', () => {
    const tasks = weekPlan({ ...base, date: d('2026-11-02'), target: d('2027-01-25'), levels }).flatMap((day) => day.tasks);
    for (const t of tasks) expect(t.href).toMatch(/^\//);
    const n400 = tasks.find((t) => t.kind === 'n400');
    expect(n400.href).toBe(`/n400-coach?section=${n400.section}`);
  });
});

describe('N-400 sections across the plan', () => {
  it('goes one section per week in form order, skipping completed ones', () => {
    expect(n400ForWeek({ sections: SECTIONS, weekNumber: 0, weeks: 12 })).toBe('a');
    expect(n400ForWeek({ sections: SECTIONS, weekNumber: 2, weeks: 12 })).toBe('c');
    expect(n400ForWeek({ sections: SECTIONS, completed: ['a', 'b'], weekNumber: 0, weeks: 12 })).toBe('c');
    expect(n400ForWeek({ sections: SECTIONS, completed: SECTIONS, weekNumber: 0, weeks: 12 })).toBeNull();
  });
  it('fits more than one a week when time is short', () => {
    expect(n400ForWeek({ sections: SECTIONS, weekNumber: 1, weeks: 3 })).toBe('d');
  });
  it('shows up on two days of every week while sections remain', () => {
    const week = weekPlan({ ...base, date: d('2026-11-02'), target: d('2027-01-25'), levels: {} });
    expect(week.filter((day) => day.tasks.some((t) => t.kind === 'n400')).length).toBe(2);
  });
});

describe('extras and helpers', () => {
  it('offers two extra review tasks', () => {
    expect(extraTasks(d('2026-11-02')).length).toBe(2);
  });
  it('counts whole days', () => {
    expect(daysBetween(d('2026-11-02'), d('2026-11-09'))).toBe(7);
  });
});
