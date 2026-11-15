// Checkpoints (Prompt 8): Speak it! scoring, Read and write sentences, the
// review chest, Unit complete, stars and badges.
import { describe, it, expect } from 'vitest';
import { UNITS, sectionQuestionIds } from './course';
import { journeyStops, visibleCourse } from './journey';
import {
  CHEST_SIZE, checkpointStars, chestKind, chestQuestions, courseBadges, n400Href, passMark,
  readWriteSentences, speakItQuestions, speakItScore, unitComplete, unitFinishedBy, unitStats,
} from './checkpoints';

const course = visibleCourse(UNITS, { showDrafts: true });
const congress = course.flatMap((u) => u.sections).find((s) => s.id === 'u2-s2');

describe('Speak it!', () => {
  it('asks 6 of the section\'s questions, word for word, in course order', () => {
    const all = sectionQuestionIds(congress);
    expect(all.length).toBeGreaterThan(6);
    const qs = speakItQuestions(congress);
    expect(qs).toHaveLength(6);
    expect(qs.every((q) => all.includes(q.id) && q.question && q.answer)).toBe(true);
    const order = qs.map((q) => all.indexOf(q.id));
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it('a different pick each try; a small section asks all of its questions', () => {
    let n = 0;
    const first = speakItQuestions(congress, { random: () => (n++ % 7) / 7 }).map((q) => q.id);
    const second = speakItQuestions(congress, { random: () => 1 - (n++ % 7) / 7 }).map((q) => q.id);
    expect(first).not.toEqual(second);
    const small = { lessons: congress.lessons.slice(0, 1) };
    expect(speakItQuestions(small).map((q) => q.id)).toEqual(sectionQuestionIds(small));
  });

  it('passes with all but one right', () => {
    expect(passMark(6)).toBe(5);
    expect(speakItScore([true, true, true, true, true, false].map((correct) => ({ correct })))).toEqual({ correct: 5, total: 6, passed: true });
    expect(speakItScore([true, true, true, true, false, false].map((correct) => ({ correct }))).passed).toBe(false);
  });

  it('answers the app can\'t check count neither way', () => {
    const r = speakItScore([{ correct: true }, { correct: null }, { correct: false }]);
    expect(r).toEqual({ correct: 1, total: 2, passed: true });
    expect(speakItScore([{ correct: null }]).passed).toBe(false);
  });
});

describe('Read and write stops', () => {
  it('uses up to 3 of the listed lessons\' Read it and Write it sentences', () => {
    const stop = congress.stops.find((s) => s.id === 'u2-s2-rw2');
    const { read, write } = readWriteSentences(stop, congress);
    expect(read).toHaveLength(3);
    expect(write).toHaveLength(3);
    for (const r of read) expect(r.sentence).toBe(r.lesson.steps.readIt.sentence);
    for (const w of write) expect(w.sentence).toBe(w.lesson.steps.writeIt.sentence);
  });

  it('a section with fewer lessons has fewer sentences; hidden lessons are left out', () => {
    const stop = { id: 'x-rw', type: 'readwrite', fromLessons: ['a', 'b'] };
    const section = { lessons: [{ id: 'a', steps: { readIt: { sentence: 'Who lived here first?' }, writeIt: { sentence: 'Washington is the capital.' } } }] };
    const { read, write } = readWriteSentences(stop, section);
    expect(read.map((r) => r.sentence)).toEqual(['Who lived here first?']);
    expect(write).toHaveLength(1);
  });
});

describe('the review chest', () => {
  it('takes up to 6 due questions that still exist', () => {
    const ids = [...sectionQuestionIds(congress), 'not-a-question'];
    const qs = chestQuestions(ids);
    expect(qs).toHaveLength(Math.min(CHEST_SIZE, ids.length - 1));
    expect(qs.some((q) => q.id === 'not-a-question')).toBe(false);
  });

  it('asks the first half as Teach it back, the rest as the officer', () => {
    expect([0, 1, 2, 3, 4, 5].map((i) => chestKind(i, 6))).toEqual(['teach', 'teach', 'teach', 'officer', 'officer', 'officer']);
    expect(chestKind(0, 1)).toBe('teach');
  });
});

// A made-up unit: two lessons, a Read and write stop, a Speak it!, the practice interview.
const fake = [{
  id: 'ua', number: 1, title: 'A', icon: 'capitol', sections: [{
    id: 'ua-s1', title: 'One',
    lessons: [
      { id: 'a1', status: 'reviewed', questionIds: ['q1'], steps: { readIt: { sentence: 'R1' }, writeIt: { sentence: 'W1' } } },
      { id: 'a2', status: 'reviewed', questionIds: ['q2', 'q3'], steps: { readIt: { sentence: 'R2' }, writeIt: { sentence: 'W2' } } },
    ],
    stops: [
      { id: 'a1', type: 'lesson', lessonId: 'a1' },
      { id: 'a2', type: 'lesson', lessonId: 'a2' },
      { id: 'ua-s1-rw', type: 'readwrite', fromLessons: ['a1', 'a2'] },
      { id: 'ua-s1-speak', type: 'speakit' },
      { id: 'ua-pi', type: 'practiceInterview' },
    ],
  }],
}];
const fakeCourse = visibleCourse(fake, { showDrafts: true });
const lessonsDone = { a1: { completed: true }, a2: { completed: true } };

describe('Unit complete', () => {
  it('needs every lesson, Read and write and Speak it! done (not the practice interview)', () => {
    const before = journeyStops(fakeCourse, { progress: lessonsDone, checkpoints: new Set(['ua-s1-rw']) });
    expect(unitComplete('ua', before)).toBe(false);
    expect(unitFinishedBy('ua-s1', before)).toBe('ua');
    const after = journeyStops(fakeCourse, { progress: lessonsDone, checkpoints: new Set(['ua-s1-rw', 'ua-s1']) });
    expect(unitComplete('ua', after)).toBe(true);
    expect(after.find((s) => s.id === 'ua-pi').state).toBe('open');
  });

  it('a Speak it! doesn\'t finish the unit while another stop is open', () => {
    const stops = journeyStops(fakeCourse, { progress: lessonsDone });
    expect(unitFinishedBy('ua-s1', stops)).toBe(null);
  });

  it('counts lessons, test questions and sentences read and written', () => {
    expect(unitStats(fakeCourse[0])).toEqual({ lessons: 2, questions: 3, sentences: 2 * 2 + 4 });
  });
});

describe('stars and badges, calculated', () => {
  it('+10 stars per passed Speak it! only', () => {
    expect(checkpointStars(new Set(['ua-s1', 'ua-s1-rw', 'other']), fake)).toBe(10);
  });

  it('a badge per passed Speak it! and per finished unit', () => {
    const stops = journeyStops(fakeCourse, { progress: lessonsDone, checkpoints: new Set(['ua-s1-rw', 'ua-s1']) });
    expect(courseBadges(stops, fakeCourse).map((b) => b.id)).toEqual(['section:ua-s1', 'unit:ua']);
    expect(courseBadges(journeyStops(fakeCourse), fakeCourse)).toEqual([]);
  });
});

describe('N-400 stops', () => {
  it('open the matching card in the N-400 guide', () => {
    expect(n400Href({ type: 'n400', section: 'time-outside-us', card: 2 })).toBe('/n400-guide?section=time-outside-us&card=2');
    expect(n400Href({ type: 'n400', section: 'time-outside-us' })).toBe('/n400-guide?section=time-outside-us&card=1');
    expect(n400Href({ type: 'n400' })).toBe(null);
  });
});
