import { describe, it, expect } from 'vitest';
import { lessonStatusOf, lessonStatusRows } from './lessonStatus';
import { UNITS } from './course';
import { visibleCourse } from './journey';

describe('Lesson progress reads the Course', () => {
  it('finished, started or not started from saved course progress', () => {
    expect(lessonStatusOf({ completed: true, steps_done: 5 })).toBe('completed');
    expect(lessonStatusOf({ completed: false, steps_done: 2 })).toBe('in_progress');
    expect(lessonStatusOf(undefined)).toBe('not_started');
  });

  it('lists every visible Course lesson once, by unit, and counts them', () => {
    const course = visibleCourse(UNITS, { showDrafts: false });
    const first = course[0].sections[0].lessons[0].id;
    const second = course[0].sections[0].lessons[1].id;
    const { units, counts } = lessonStatusRows(course, { [first]: { completed: true, steps_done: 5 }, [second]: { steps_done: 1 } });
    const all = units.flatMap((u) => u.lessons);
    expect(all.length).toBe(course.flatMap((u) => u.sections.flatMap((s) => s.lessons)).length);
    expect(new Set(all.map((l) => l.id)).size).toBe(all.length);
    expect(counts).toEqual({ completed: 1, in_progress: 1, not_started: all.length - 2 });
    expect(units[0].lessons[0]).toEqual({ id: first, title: course[0].sections[0].lessons[0].title, status: 'completed' });
  });
});
