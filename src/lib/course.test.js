import { describe, it, expect } from 'vitest';
import { UNITS, SECTION_FILES, courseProblems, visibleLessons, showDraftLessons, sectionQuestionIds, findLesson, STOP_TYPES } from './course';
import { READING_WORDS, WRITING_WORDS, wordsNotOnList, entryWords } from './officialVocabulary';
import { afterAnswer, nextBox, dueItems, BOX_DAYS } from './reviewSchedule';
import { afterWriteIt, normalizeWriteLevel } from './writeLevel';
import questions2025 from '../../content/civics/questions-2025.json';
import exported2025 from '../../content/base44-export/civics-questions-2025.json';
import explanations from '../../content/explanations/en.json';
import readingList from '../../content/vocab/reading-vocabulary.json';
import writingList from '../../content/vocab/writing-vocabulary.json';

// Question ids are the database ids (the same in the Base44 export and in
// Supabase's civics_questions). Each must be a 2025 question whose wording
// and answers match content/civics/questions-2025.json word for word.
const official = new Map(questions2025.map((q) => [q.question, q]));
const QUESTIONS = Object.fromEntries(exported2025
  .filter((q) => official.get(q.question)?.answer === q.answer)
  .map((q) => [q.id, q]));

const context = { questions: QUESTIONS, explanations, reading: READING_WORDS, writing: WRITING_WORDS, wordsNotOnList };

describe('the official word lists (content/vocab/)', () => {
  it('are copied from the USCIS PDFs, with every column', () => {
    expect(readingList.categories.map((c) => c.category)).toEqual(['PEOPLE', 'CIVICS', 'PLACES', 'HOLIDAYS', 'QUESTION WORDS', 'VERBS', 'OTHER (FUNCTION)', 'OTHER (CONTENT)']);
    expect(writingList.categories.map((c) => c.category)).toEqual(['PEOPLE', 'CIVICS', 'PLACES', 'MONTHS', 'HOLIDAYS', 'VERBS', 'OTHER (FUNCTION)', 'OTHER (CONTENT)']);
    expect(readingList.categories.flatMap((c) => c.entries)).toHaveLength(64);
    expect(writingList.categories.flatMap((c) => c.entries)).toHaveLength(75);
    expect(readingList.source).toMatch(/rev\. 08\/08/);
  });

  it('split entries into words the way USCIS lists them', () => {
    expect(entryWords('is/are/was/be')).toEqual(['is', 'are', 'was', 'be']);
    expect(entryWords('Washington, D.C.')).toEqual(['washington', 'd.c.']);
    expect(entryWords('one hundred/100')).toEqual(['one', 'hundred', '100']);
  });

  it('wordsNotOnList finds words that are not on a list', () => {
    expect(wordsNotOnList('Who elects Congress?', READING_WORDS)).toEqual([]);
    expect(wordsNotOnList('Congress meets in Washington, D.C.', WRITING_WORDS)).toEqual([]);
    expect(wordsNotOnList('Who is your senator?', READING_WORDS)).toEqual(['your', 'senator']);
    expect(wordsNotOnList('Who elects Congress?', WRITING_WORDS)).toEqual(['who', 'elects']); // "elect" only, on the writing list
  });
});

describe('the course files (content/course/)', () => {
  it('have no problems: ids, stops, steps, questions, explanations, official words', () => {
    expect(courseProblems(UNITS, context)).toEqual([]);
  });

  it('every Read it sentence uses only reading-list words, and is a question', () => {
    for (const u of UNITS) for (const s of u.sections) for (const l of s.lessons || []) {
      expect(wordsNotOnList(l.steps.readIt.sentence, READING_WORDS), l.id).toEqual([]);
      expect(l.steps.readIt.sentence.trim().endsWith('?'), l.id).toBe(true);
    }
  });

  it('every Write it sentence uses only writing-list words, and is a statement', () => {
    for (const u of UNITS) for (const s of u.sections) for (const l of s.lessons || []) {
      expect(wordsNotOnList(l.steps.writeIt.sentence, WRITING_WORDS), l.id).toEqual([]);
      expect(l.steps.writeIt.sentence.trim().endsWith('.'), l.id).toBe(true);
    }
  });

  it('catch a sentence with a word that is not on the list', () => {
    const bad = JSON.parse(JSON.stringify(UNITS));
    const lesson = bad[1].sections[1].lessons[0];
    lesson.steps.readIt.sentence = 'What does the Senate do?';
    lesson.steps.writeIt.sentence = 'Is Congress here?';
    const problems = courseProblems(bad, context);
    expect(problems.some((p) => /reading list: senate/.test(p))).toBe(true);
    expect(problems.some((p) => /must be a statement/.test(p))).toBe(true);
  });

  it('has 7 units, and the sample section is Unit 2 · Section 2 "Congress" with 7 stops, all drafts', () => {
    expect(UNITS).toHaveLength(7);
    const congress = UNITS[1].sections.find((s) => s.title === 'Congress');
    expect(congress.stops.map((s) => s.type)).toEqual(['lesson', 'lesson', 'lesson', 'lesson', 'readwrite', 'lesson', 'speakit']);
    expect(congress.lessons.every((l) => l.status === 'draft')).toBe(true);
    expect(sectionQuestionIds(congress)).toHaveLength(10);
    expect(Object.keys(SECTION_FILES)).toEqual(['u2-s2-congress.json']);
    expect(STOP_TYPES).toEqual(['lesson', 'readwrite', 'speakit', 'n400', 'review', 'practiceInterview']);
  });

  it('every question a lesson uses is an official 2025 question, word for word', () => {
    for (const id of sectionQuestionIds(UNITS[1].sections[1])) {
      expect(official.has(QUESTIONS[id]?.question), id).toBe(true);
    }
  });
});

describe('learners see only reviewed lessons', () => {
  const section = { lessons: [{ id: 'a', status: 'draft' }, { id: 'b', status: 'reviewed' }] };
  it('hides drafts unless the developer switch is on', () => {
    expect(visibleLessons(section, { showDrafts: false }).map((l) => l.id)).toEqual(['b']);
    expect(visibleLessons(section, { showDrafts: true }).map((l) => l.id)).toEqual(['a', 'b']);
  });
  it('the switch works only on a developer machine', () => {
    expect(showDraftLessons({ DEV: false, VITE_SHOW_DRAFT_LESSONS: 'true' })).toBe(false);
    expect(showDraftLessons({ DEV: true, VITE_SHOW_DRAFT_LESSONS: 'true' })).toBe(true);
    expect(showDraftLessons({ DEV: true })).toBe(false);
  });
  it('the sample section shows nothing to learners yet', () => {
    expect(visibleLessons(UNITS[1].sections[1], { showDrafts: false })).toEqual([]);
    expect(findLesson('u2-s2-l3').lesson.title).toBe('How many senators?');
  });
});

describe('the review schedule (review_items)', () => {
  const today = new Date(2026, 10, 15);
  it('right → next box (1, 3, 7, 14, 30 days); wrong → box 1', () => {
    expect(BOX_DAYS).toEqual({ 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 });
    expect(nextBox(1, true)).toBe(2);
    expect(nextBox(4, true)).toBe(5);
    expect(nextBox(5, true)).toBe(5);
    expect(nextBox(4, false)).toBe(1);
  });
  it('makes the row to save, with the due date', () => {
    expect(afterAnswer(null, 'q1', false, today)).toEqual({ question_id: 'q1', box: 1, next_due: '2026-11-16' });
    expect(afterAnswer({ question_id: 'q1', box: 2 }, 'q1', true, today)).toEqual({ question_id: 'q1', box: 3, next_due: '2026-11-22' });
    expect(afterAnswer({ question_id: 'q1', box: 5 }, 'q1', true, today).next_due).toBe('2026-12-15');
  });
  it('lists what is due, oldest first', () => {
    const items = [{ question_id: 'a', box: 2, next_due: '2026-11-15' }, { question_id: 'b', box: 1, next_due: '2026-11-10' }, { question_id: 'c', box: 1, next_due: '2026-11-20' }];
    expect(dueItems(items, today).map((i) => i.question_id)).toEqual(['b', 'a']);
    expect(dueItems(items, today, 1)).toHaveLength(1);
  });
});

describe('Write it levels', () => {
  it('two passes at level 1 move the learner to level 2', () => {
    expect(normalizeWriteLevel({})).toEqual({ write_level: 1, write_level1_passes: 0 });
    const one = afterWriteIt({}, true);
    expect(one).toEqual({ write_level: 1, write_level1_passes: 1 });
    expect(afterWriteIt(one, true)).toEqual({ write_level: 2, write_level1_passes: 2 });
  });
  it('a miss, or a pass at level 2, changes nothing', () => {
    expect(afterWriteIt({ write_level: 1, write_level1_passes: 1 }, false)).toEqual({ write_level: 1, write_level1_passes: 1 });
    expect(afterWriteIt({ write_level: 2, write_level1_passes: 2 }, true)).toEqual({ write_level: 2, write_level1_passes: 2 });
  });
});
