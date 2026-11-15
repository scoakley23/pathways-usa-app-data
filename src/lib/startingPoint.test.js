// Where a learner starts the course (Prompt 9), from the quick check.
import { describe, it, expect } from 'vitest';
import { UNITS } from './course';
import { journeyStops, visibleCourse } from './journey';
import { startUnitNumber, startingPoint } from './startingPoint';

const course = visibleCourse(UNITS, { showDrafts: true });

describe('starting point', () => {
  it('maps the civics level to a unit', () => {
    expect(startUnitNumber(null)).toBe(1);
    expect(startUnitNumber({ civics: 'start_here' })).toBe(1);
    expect(startUnitNumber({ civics: null, reading: 'strong' })).toBe(1);
    expect(startUnitNumber({ civics: 'getting_there' })).toBe(2);
    expect(startUnitNumber({ civics: 'strong' })).toBe(3);
  });

  it('starts at the unit\'s first section', () => {
    const p = startingPoint(course, { civics: 'getting_there' });
    expect(p.unit.number).toBe(2);
    expect(p.section.id).toBe(p.unit.sections[0].id);
  });

  it('skips ahead to the next unit with stops a learner may see', () => {
    const empty = course.map((u) => (u.number === 3 ? { ...u, sections: u.sections.map((s) => ({ ...s, stops: [] })) } : u));
    expect(startingPoint(empty, { civics: 'strong' }).unit.number).toBe(4);
    expect(startingPoint([], { civics: 'strong' })).toBe(null);
  });

  it('earlier stops stay open (playable, not blocking); the start is current', () => {
    const start = startingPoint(course, { civics: 'strong' });
    const stops = journeyStops(course, { startUnitId: start.unit.id });
    const before = stops.filter((s) => course.findIndex((u) => u.id === s.unitId) < course.indexOf(start.unit));
    expect(before.length).toBeGreaterThan(0);
    expect(before.every((s) => s.state === 'open')).toBe(true);
    const current = stops.find((s) => s.state === 'current');
    expect(current.unitId).toBe(start.unit.id);
    expect(current.sectionId).toBe(start.section.id);
  });

  it('an earlier stop finished later still counts as done', () => {
    const start = startingPoint(course, { civics: 'getting_there' });
    const first = course[0].sections[0].lessons[0];
    const stops = journeyStops(course, { startUnitId: start.unit.id, progress: { [first.id]: { completed: true } } });
    expect(stops.find((s) => s.lessonId === first.id).state).toBe('done');
  });
});
