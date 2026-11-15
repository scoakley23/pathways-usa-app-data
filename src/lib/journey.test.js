import { describe, it, expect } from 'vitest';
import { UNITS } from './course';
import {
  canSeeDrafts, visibleCourse, journeyStops, totalStars, lessonCounts, questionCount,
  currentUnitId, sectionState, unitState, usesYourState, stopX,
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

  it('every lesson in the real course is a draft today, so learners see none', () => {
    const course = visibleCourse(UNITS, { showDrafts: false });
    expect(course.flatMap((u) => u.sections.flatMap((s) => s.lessons))).toEqual([]);
    const admin = visibleCourse(UNITS, { showDrafts: true });
    expect(admin.flatMap((u) => u.sections.flatMap((s) => s.lessons)).length).toBeGreaterThan(50);
  });
});

describe('stops unlock in order', () => {
  const course = visibleCourse(fakeUnits, { showDrafts: true });

  it('a new learner: the first lesson is current, the rest locked', () => {
    const stops = journeyStops(course);
    expect(stops.map((s) => s.state)).toEqual(['current', 'locked', 'locked', 'locked', 'locked', 'locked']);
    expect(stops[2].waitFor.id).toBe('a1');
  });

  it('stops not built yet are "soon" and don\'t block the next lesson', () => {
    const stops = journeyStops(course, { progress: { a1: { completed: true, stars: 3 } } });
    expect(stops.map((s) => [s.id, s.state])).toEqual([
      ['a1', 'done'], ['ua-s1-rw', 'soon'], ['a2', 'current'], ['ua-s1-speak', 'locked'], ['b1', 'locked'], ['ub-pi', 'locked'],
    ]);
    expect(stops[0].stars).toBe(3);
  });

  it('a passed Speak it! counts as done; the next unit continues the road', () => {
    const stops = journeyStops(course, { progress: { a1: { completed: true }, a2: { completed_at: '2026-11-15' } }, checkpoints: new Set(['ua-s1']) });
    expect(stops.find((s) => s.id === 'ua-s1-speak').state).toBe('done');
    expect(stops.find((s) => s.id === 'b1').state).toBe('current');
    expect(currentUnitId(course, stops)).toBe('ub');
  });
});

describe('counts and stars', () => {
  const course = visibleCourse(fakeUnits, { showDrafts: true });
  const progress = { a1: { completed: true, stars: 3 }, a2: { stars: 1 }, other: { stars: 3 } };

  it('stars add up saved lesson stars for course lessons only', () => {
    expect(totalStars(progress, fakeUnits)).toBe(4);
  });

  it('"n of m" lessons done, and test questions covered', () => {
    expect(lessonCounts(course[0], progress)).toEqual({ done: 1, total: 2 });
    expect(lessonCounts(course[0].sections[0], progress)).toEqual({ done: 1, total: 2 });
    expect(questionCount(course[0])).toBe(3);
  });

  it('section and unit states for the guide and the map', () => {
    const stops = journeyStops(course, { progress });
    expect(sectionState(course[0].sections[0], stops)).toBe('current');
    expect(sectionState(course[1].sections[0], stops)).toBe('locked');
    expect(unitState(course[0], stops, 'ua')).toBe('current');
    expect(unitState(course[1], stops, 'ua')).toBe('locked');
    const learner = visibleCourse(fakeUnits, { showDrafts: false });
    expect(sectionState(learner[1].sections[0], journeyStops(learner))).toBe('empty');
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
