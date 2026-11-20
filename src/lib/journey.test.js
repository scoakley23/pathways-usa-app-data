import { describe, it, expect } from 'vitest';
import { UNITS } from './course';
import {
  canSeeDrafts, visibleCourse, journeyStops, totalStars, lessonCounts, questionCount,
  currentUnitId, sectionState, unitState, usesYourState, stopX, unitQuestionsDone, PLAYABLE_STOPS,
} from './journey';

// A small made-up course: two units, lessons a1, a2 (reviewed), b1 (draft).
const fakeUnits = [
  {
    id: 'ua', number: 1, title: 'A', icon: 'capitol', sections: [{
      id: 'ua-s1', title: 'One',
      lessons: [{ id: 'a1', status: 'reviewed', questionIds: ['q1'] }, { id: 'a2', status: 'reviewed', questionIds: ['q2', 'q3'] }],
      stops: [
        { id: 'a1', type: 'lesson', title: 'A1', lessonId: 'a1' },
        { id: 'ua-s1-rw', type: 'readwrite', title: 'Read and write' },
        { id: 'a2', type: 'lesson', title: 'A2', lessonId: 'a2' },
        { id: 'ua-s1-speak', type: 'speakit', title: 'Speak it!' },
      ],
    }],
  },
  {
    id: 'ub', number: 2, title: 'B', icon: 'ballot', sections: [{
      id: 'ub-s1', title: 'Two',
      lessons: [{ id: 'b1', status: 'draft', questionIds: ['q4'] }],
      stops: [{ id: 'b1', type: 'lesson', title: 'B1', lessonId: 'b1' }, { id: 'ub-pi', type: 'practiceInterview', title: 'Unit practice interview' }],
    }],
  },
];

describe('who sees draft lessons', () => {
  it('admins and a developer with the switch; learners never', () => {
    expect(canSeeDrafts({ role: 'admin' }, { DEV: false })).toBe(true);
    expect(canSeeDrafts({ role: 'user' }, { DEV: false })).toBe(false);
    expect(canSeeDrafts(null, { DEV: true, VITE_SHOW_DRAFT_LESSONS: 'true' })).toBe(true);
  });

  it('learners see only reviewed lessons; a section with none shows no stops', () => {
    const course = visibleCourse(fakeUnits, { showDrafts: false });
    expect(course[0].sections[0].stops.map((s) => s.id)).toEqual(['a1', 'ua-s1-rw', 'a2', 'ua-s1-speak']);
    expect(course[1].sections[0].lessons).toEqual([]);
    expect(course[1].sections[0].stops).toEqual([]);
    const admin = visibleCourse(fakeUnits, { showDrafts: true });
    expect(admin[1].sections[0].stops.map((s) => s.id)).toEqual(['b1', 'ub-pi']);
  });

  it('in the real course, learners see only reviewed lessons and admins see every lesson', () => {
    const all = UNITS.flatMap((u) => u.sections.flatMap((s) => s.lessons || []));
    const learner = visibleCourse(UNITS, { showDrafts: false }).flatMap((u) => u.sections.flatMap((s) => s.lessons));
    expect(learner.map((l) => l.id)).toEqual(all.filter((l) => l.status === 'reviewed').map((l) => l.id));
    const admin = visibleCourse(UNITS, { showDrafts: true }).flatMap((u) => u.sections.flatMap((s) => s.lessons));
    expect(admin).toHaveLength(all.length);
  });
});

describe('nothing is locked; one stop is suggested next', () => {
  const course = visibleCourse(fakeUnits, { showDrafts: true });

  it('a new learner: the first lesson is suggested, every other stop is open', () => {
    const stops = journeyStops(course);
    expect(stops.map((s) => s.state)).toEqual(['current', 'open', 'open', 'open', 'open', 'open']);
    expect(stops.some((s) => s.state === 'locked')).toBe(false);
    expect(stops.some((s) => 'waitFor' in s)).toBe(false);
  });

  it('never locks a lesson, Read and write or Speak it!, whatever is done', () => {
    const cases = [{}, { progress: { a2: { completed: true } } }, { checkpoints: new Set(['ua-s1']) }, { startUnitId: 'ub' }];
    for (const opts of cases) {
      for (const s of journeyStops(course, opts)) {
        if (PLAYABLE_STOPS.includes(s.type)) expect(['done', 'current', 'open'], `${s.id}`).toContain(s.state);
      }
    }
  });

  it('Read and write is suggested after a lesson, and done when saved under its stop id', () => {
    const stops = journeyStops(course, { progress: { a1: { completed: true, stars: 3 } } });
    expect(stops.map((s) => [s.id, s.state])).toEqual([
      ['a1', 'done'], ['ua-s1-rw', 'current'], ['a2', 'open'], ['ua-s1-speak', 'open'], ['b1', 'open'], ['ub-pi', 'open'],
    ]);
    expect(stops[0].stars).toBe(3);
    const after = journeyStops(course, { progress: { a1: { completed: true } }, checkpoints: new Set(['ua-s1-rw']) });
    expect(after.find((s) => s.id === 'ua-s1-rw').state).toBe('done');
    expect(after.find((s) => s.id === 'a2').state).toBe('current');
  });

  it('a lesson done out of order is done; the suggestion stays on the first one not done', () => {
    const stops = journeyStops(course, { progress: { a2: { completed: true } } });
    expect(stops.find((s) => s.id === 'a2').state).toBe('done');
    expect(stops.find((s) => s.id === 'a1').state).toBe('current');
  });

  it('the unit practice interview is always open; nothing is suggested when all is done', () => {
    expect(journeyStops(course).find((s) => s.id === 'ub-pi').state).toBe('open');
    const stops = journeyStops(course, { progress: { a1: { completed: true }, a2: { completed: true }, b1: { completed: true } }, checkpoints: new Set(['ua-s1', 'ua-s1-rw']) });
    expect(stops.find((s) => s.id === 'ub-pi').state).toBe('open');
    expect(stops.some((s) => s.state === 'current')).toBe(false);
  });

  it('a passed Speak it! counts as done; the next unit continues the suggestion', () => {
    const stops = journeyStops(course, { progress: { a1: { completed: true }, a2: { completed_at: '2026-11-15' } }, checkpoints: new Set(['ua-s1', 'ua-s1-rw']) });
    expect(stops.find((s) => s.id === 'ua-s1-speak').state).toBe('done');
    expect(stops.find((s) => s.id === 'b1').state).toBe('current');
    expect(currentUnitId(course, stops)).toBe('ub');
  });

  it('the quick check\'s starting unit moves the suggestion; earlier stops stay open', () => {
    const stops = journeyStops(course, { startUnitId: 'ub' });
    expect(stops.find((s) => s.id === 'b1').state).toBe('current');
    expect(stops.filter((s) => s.unitId === 'ua').every((s) => s.state === 'open')).toBe(true);
    const later = journeyStops(course, { startUnitId: 'ub', progress: { b1: { completed: true } } });
    expect(later.find((s) => s.id === 'a1').state).toBe('current');
  });
});

describe('counts and stars', () => {
  const course = visibleCourse(fakeUnits, { showDrafts: true });
  const progress = { a1: { completed: true, stars: 3 }, a2: { stars: 1 }, other: { stars: 3 } };

  it('stars add up saved lesson stars for course lessons only', () => {
    expect(totalStars(progress, fakeUnits)).toBe(4);
  });

  it('a passed Speak it! adds 10 stars; a Read and write stop adds none', () => {
    expect(totalStars(progress, fakeUnits, new Set(['ua-s1', 'ua-s1-rw']))).toBe(14);
  });

  it('"n of m" lessons done, and test questions covered', () => {
    expect(lessonCounts(course[0], progress)).toEqual({ done: 1, total: 2 });
    expect(lessonCounts(course[0].sections[0], progress)).toEqual({ done: 1, total: 2 });
    expect(questionCount(course[0])).toBe(3);
  });

  it('section and unit states for the guide and the map', () => {
    const stops = journeyStops(course, { progress });
    expect(sectionState(course[0].sections[0], stops)).toBe('current');
    expect(sectionState(course[1].sections[0], stops)).toBe('open');
    expect(unitState(course[0], stops, 'ua')).toBe('current');
    expect(unitState(course[1], stops, 'ua')).toBe('open');
    const done = journeyStops(course, { progress: { a1: { completed: true }, a2: { completed: true }, b1: { completed: true } }, checkpoints: new Set(['ua-s1', 'ua-s1-rw']) });
    expect(unitState(course[0], done, null)).toBe('done');
    expect(unitState(course[1], done, null)).toBe('done');
    const learner = visibleCourse(fakeUnits, { showDrafts: false });
    expect(sectionState(learner[1].sections[0], journeyStops(learner))).toBe('empty');
  });
});

describe('questions done per unit', () => {
  it('counts the unit\'s test questions the learner has mastered', () => {
    const course = visibleCourse(fakeUnits, { showDrafts: true });
    expect(unitQuestionsDone(course[0], new Set(['q1', 'q3', 'q4']))).toEqual({ done: 2, total: 3 });
    expect(unitQuestionsDone(course[0])).toEqual({ done: 0, total: 3 });
  });
});

describe('the road', () => {
  it('mirrors left and right for right-to-left languages', () => {
    for (let i = 0; i < 10; i++) expect(stopX(i, true)).toBe(100 - stopX(i, false));
  });

  it('knows which lessons ask about the learner\'s own state', () => {
    expect(usesYourState(['Who is one of your state’s U.S. senators now?'])).toBe(true);
    expect(usesYourState(['How many U.S. senators are there?'])).toBe(false);
  });
});
