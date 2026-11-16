// Course titles in the learner's language (Prompt 13).
import { describe, it, expect } from 'vitest';
import { UNITS, questionText } from './course';
import { courseTitleTexts, translateCourse } from './courseTitles';
import { journeyStops, visibleCourse } from './journey';

describe('course titles', () => {
  it('lists every unit, section, lesson and stop title and each unit description', () => {
    const texts = new Set(courseTitleTexts(UNITS));
    for (const u of UNITS) {
      expect(texts.has(u.title)).toBe(true);
      expect(texts.has(u.description)).toBe(true);
      for (const s of u.sections) {
        expect(texts.has(s.title)).toBe(true);
        for (const l of s.lessons || []) expect(texts.has(l.title)).toBe(true);
      }
    }
  });

  it('never lists the official questions (they stay in English)', () => {
    const texts = new Set(courseTitleTexts(UNITS));
    const questions = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).flatMap((l) => l.questionIds.map(questionText))));
    expect(questions.some((q) => texts.has(q))).toBe(false);
  });

  it('translates titles only; ids and the journey stay the same', () => {
    const course = visibleCourse(UNITS, { showDrafts: true });
    const tx = (s) => `[es] ${s}`;
    const es = translateCourse(course, tx);
    expect(es[0].title).toBe(`[es] ${course[0].title}`);
    expect(es[0].sections[0].lessons[0].title).toBe(`[es] ${course[0].sections[0].lessons[0].title}`);
    expect(es[0].sections[0].stops.find((s) => s.lesson).lesson.title.startsWith('[es] ')).toBe(true);
    const strip = (stops) => stops.map((s) => [s.id, s.state]);
    expect(strip(journeyStops(es))).toEqual(strip(journeyStops(course)));
    expect(translateCourse(course, null)).toBe(course);
  });
});
