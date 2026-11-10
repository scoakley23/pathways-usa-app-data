import { describe, it, expect } from 'vitest';
import { firstName, splitTasks, stageKey, timeOfDay, weekSquares, weeksToInterview, roadStates, practiceDaysThisWeek } from './todayView';
import { dayIndex } from './studyPlan';

const tasks = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

describe('splitTasks', () => {
  it('puts the first unfinished task on top and keeps the rest in order', () => {
    expect(splitTasks(tasks, [])).toEqual({ top: tasks[0], rest: [tasks[1], tasks[2]] });
    expect(splitTasks(tasks, ['a'])).toEqual({ top: tasks[1], rest: [tasks[0], tasks[2]] });
  });
  it('has no top task when everything is done', () => {
    expect(splitTasks(tasks, ['a', 'b', 'c'])).toEqual({ top: null, rest: tasks });
    expect(splitTasks([], [])).toEqual({ top: null, rest: [] });
  });
});

describe('stageKey', () => {
  it('maps Getting started stages to labels, and nothing for a skipped stage', () => {
    expect(stageKey('applied')).toBe('stage_applied');
    expect(stageKey('interview')).toBe('stage_interview');
    expect(stageKey(null)).toBeNull();
    expect(stageKey('other')).toBeNull();
  });
});

describe('weeksToInterview', () => {
  const today = new Date(2026, 9, 22, 12);
  it('counts weeks only when an interview month is set', () => {
    expect(weeksToInterview({ mode: 'date', target: new Date(2026, 11, 1, 12) }, today)).toBe(6);
    expect(weeksToInterview({ mode: 'unknown', target: new Date(2026, 11, 1, 12) }, today)).toBeNull();
    expect(weeksToInterview({ mode: 'study', target: null }, today)).toBeNull();
    expect(weeksToInterview(null, today)).toBeNull();
  });
  it('never goes below zero', () => {
    expect(weeksToInterview({ mode: 'date', target: new Date(2026, 8, 1, 12) }, today)).toBe(0);
  });
});

describe('firstName', () => {
  it('uses the first word of the sign-in name', () => {
    expect(firstName({ full_name: '  Ana María Test ' })).toBe('Ana');
  });
  it('shows no name when there is none or it is an email', () => {
    expect(firstName({})).toBe('');
    expect(firstName(null)).toBe('');
    expect(firstName({ full_name: 'test@example.com' })).toBe('');
  });
});

describe('timeOfDay', () => {
  it('splits the day into morning, afternoon, evening', () => {
    expect(timeOfDay(new Date(2026, 0, 1, 9))).toBe('morning');
    expect(timeOfDay(new Date(2026, 0, 1, 13))).toBe('afternoon');
    expect(timeOfDay(new Date(2026, 0, 1, 20))).toBe('evening');
  });
});

describe('weekSquares', () => {
  it('marks practiced days Monday to Sunday', () => {
    const thu = new Date(2026, 9, 22, 12); // a Thursday
    const t = dayIndex(thu);
    const squares = weekSquares([t, t - 3, t - 10], t, thu.getDay());
    expect(squares.map((s) => s.filled)).toEqual([true, false, false, true, false, false, false]);
    expect(squares.findIndex((s) => s.today)).toBe(3);
  });
});

describe('roadStates', () => {
  const ids = [1, 2, 3, 4, 5];

  it('marks done stops, the current stop and later ones', () => {
    expect(roadStates(ids, { 1: true, 2: false }, 2)).toEqual(['done', 'current', 'later', 'later', 'later']);
  });

  it('keeps a done stop after the current one as done', () => {
    expect(roadStates(ids, { 1: false, 2: true }, 1)).toEqual(['current', 'done', 'later', 'later', 'later']);
  });

  it('puts a first-day learner on stop 1 with nothing done', () => {
    expect(roadStates(ids, { 1: true }, 2, true)).toEqual(['current', 'later', 'later', 'later', 'later']);
  });
});

describe('practiceDaysThisWeek', () => {
  // Wednesday, 12 Nov 2025, noon.
  const wed = new Date(2025, 10, 12, 12);
  const none = () => [];

  it('counts saved activity from Monday through today only', () => {
    const days = practiceDaysThisWeek(
      [new Date(2025, 10, 10, 9), new Date(2025, 10, 10, 18), new Date(2025, 10, 12, 8), new Date(2025, 10, 9, 9), null],
      wed,
      none,
    );
    expect(days.size).toBe(2);
    expect(days.has(dayIndex(new Date(2025, 10, 10)))).toBe(true);
  });

  it('adds days with checkmarks on this device', () => {
    const doneOn = (d) => (d.getDate() === 11 ? ['reading'] : []);
    expect(practiceDaysThisWeek([], wed, doneOn).size).toBe(1);
  });
});
