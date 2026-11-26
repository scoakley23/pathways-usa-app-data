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

// A section's last stop, not counting optional N-400 guide cards after Speak it!.
const lastMain = (s) => s.stops.filter((st) => !(st.type === 'n400' && !st.lessonId)).at(-1);

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
    expect(wordsNotOnList('When is Presidents’ Day?', READING_WORDS)).toEqual([]); // listed with its apostrophe
    expect(wordsNotOnList("Presidents' Day is in February.", WRITING_WORDS)).toEqual([]);
    expect(wordsNotOnList("The 'Senators' meet.", READING_WORDS)).toEqual([]); // quote marks around a word still come off
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

  it('has 7 units; Unit 2 has all 5 sections drafted (Prompt 12), every lesson draft or reviewed', () => {
    expect(UNITS).toHaveLength(7);
    const unit2 = UNITS[1];
    expect(unit2.sections.map((s) => s.title)).toEqual(['The three branches', 'Congress', 'The President', 'The courts', 'States and local government']);
    for (const s of unit2.sections) {
      expect(s.stops.length, s.id).toBeGreaterThan(2);
      expect(lastMain(s).type === 'speakit' || lastMain(s).type === 'practiceInterview', s.id).toBe(true);
      expect(s.lessons.every((l) => ['draft', 'reviewed'].includes(l.status)), s.id).toBe(true);
    }
    const congress = unit2.sections.find((s) => s.title === 'Congress');
    // The Prompt 4 sample keeps its first 7 stops in order; Prompt 12 adds lessons before Speak it!.
    expect(congress.stops.slice(0, 6).map((s) => s.type)).toEqual(['lesson', 'lesson', 'lesson', 'lesson', 'readwrite', 'lesson']);
    expect(unit2.sections.at(-1).stops.at(-1).type).toBe('practiceInterview');
    expect(Object.keys(SECTION_FILES).sort()).toEqual(['u1-s1-declaration.json', 'u1-s2-constitution.json', 'u1-s3-rights.json', 'u2-s1-branches.json', 'u2-s2-congress.json', 'u2-s3-president.json', 'u2-s4-courts.json', 'u2-s5-states.json', 'u3-s1-voting.json', 'u3-s2-serving.json', 'u3-s3-citizen.json', 'u4-s1-colonies.json', 'u4-s2-independence.json', 'u4-s3-nation.json', 'u5-s1-growing.json', 'u5-s2-civil-war.json', 'u5-s3-voting.json', 'u6-s1-ww1.json', 'u6-s2-ww2.json', 'u6-s3-cold-war.json', 'u6-s4-today.json', 'u7-s1-flag.json', 'u7-s2-places.json', 'u7-s3-holidays.json']);
    expect(STOP_TYPES).toEqual(['lesson', 'readwrite', 'speakit', 'n400', 'review', 'practiceInterview']);
  });

  it('Unit 1 has 3 sections, the Declaration first, 9 lessons, ending on a practice interview', () => {
    const unit1 = UNITS[0];
    expect(unit1.sections.map((s) => s.title)).toEqual(['The Declaration of Independence', 'The Constitution', 'Rights and the rule of law']);
    const lessons = unit1.sections.flatMap((s) => s.lessons);
    expect(lessons).toHaveLength(9);
    expect(lessons.every((l) => ['draft', 'reviewed'].includes(l.status))).toBe(true);
    for (const s of unit1.sections) expect(lastMain(s).type === 'speakit' || lastMain(s).type === 'practiceInterview', s.id).toBe(true);
    expect(unit1.sections.at(-1).stops.at(-1).type).toBe('practiceInterview');
  });

  it('Unit 3 has 3 sections, 6 lessons, ending on a practice interview; the flag waits for Unit 7', () => {
    const unit3 = UNITS[2];
    expect(unit3.sections.map((s) => s.title)).toEqual(['Rights and voting', 'Serving your country', 'Becoming a citizen']);
    const lessons = unit3.sections.flatMap((s) => s.lessons);
    expect(lessons).toHaveLength(6);
    expect(lessons.every((l) => ['draft', 'reviewed'].includes(l.status))).toBe(true);
    expect(unit3.sections.at(-1).stops.at(-1).type).toBe('practiceInterview');
    for (const l of lessons) expect(`${l.steps.readIt.sentence} ${l.steps.writeIt.sentence}`, l.id).not.toMatch(/flag/i);
  });

  it('every official question in a unit\'s categories is in at least one of its lessons, and each only once', () => {
    // A category in one unit: all its questions are that unit's. A category
    // split across units (U.S. History, Units 4-6): each unit lists its exact
    // questions in `questionIds`, and the lists must cover the category once.
    const categories = [...new Set(UNITS.flatMap((u) => u.categories || []))];
    for (const category of categories) {
      const units = UNITS.filter((u) => u.categories?.includes(category));
      const all = exported2025.filter((q) => q.category === category).map((q) => q.id);
      if (units.length > 1) {
        const listed = units.flatMap((u) => u.questionIds || []);
        expect(new Set(listed).size, `${category}: a question in two units`).toBe(listed.length);
        expect([...listed].sort(), `${category}: the units' questionIds must cover it exactly`).toEqual([...all].sort());
      }
      for (const unit of units) {
        if (!unit.sections.some((s) => s.file)) continue; // not drafted yet
        const used = unit.sections.flatMap((s) => sectionQuestionIds(s));
        expect(new Set(used).size, `${unit.id}: a question used twice`).toBe(used.length);
        const wanted = units.length > 1 ? unit.questionIds : all;
        expect(wanted.filter((id) => !used.includes(id)), `${unit.id}: questions not placed`).toEqual([]);
        expect(used.filter((id) => !wanted.includes(id)), `${unit.id}: questions from another unit`).toEqual([]);
      }
    }
    expect(UNITS.slice(0, 7).map((u) => u.categories)).toEqual([['Principles of American Democracy'], ['System of Government'], ['Rights and Responsibilities'], ['U.S. History'], ['U.S. History'], ['U.S. History'], ['Geography and Symbols']]);
    expect(UNITS.slice(3, 6).map((u) => u.questionIds.length)).toEqual([17, 12, 17]);
  });

  it('the history split puts slavery with its ending, and women\'s right to vote with the 1800s leaders (Unit 5)', () => {
    const text = (id) => exported2025.find((q) => q.id === id).question;
    const unit5 = UNITS[4].questionIds.map(text);
    expect(unit5).toContain('What group of people was taken and sold as slaves?');
    expect(unit5).toContain('What U.S. war ended slavery?');
    expect(unit5).toContain('When did all women get the right to vote?');
    expect(UNITS[3].questionIds.map(text)).not.toContain('What territory did the United States buy from France in 1803?');
  });

  it('Unit 7 has 3 sections, 5 lessons, ending on a practice interview; it uses the saved flag sentences', () => {
    const unit7 = UNITS[6];
    expect(unit7.sections.map((s) => s.title)).toEqual(['The flag and the nation\'s symbols', 'Places', 'Holidays']);
    const lessons = unit7.sections.flatMap((s) => s.lessons);
    expect(lessons).toHaveLength(5);
    expect(lessons.every((l) => ['draft', 'reviewed'].includes(l.status))).toBe(true);
    expect(unit7.sections.at(-1).stops.at(-1).type).toBe('practiceInterview');
    expect(findLesson('u7-s1-l1').lesson.steps.writeIt.sentence).toBe('The flag is red, white and blue.');
  });

  it('the whole course covers all 128 questions of the 2025 test, each in exactly one lesson', () => {
    const used = UNITS.flatMap((u) => u.sections.flatMap((s) => sectionQuestionIds(s)));
    expect(new Set(used).size).toBe(used.length);
    expect(exported2025.filter((q) => !used.includes(q.id)).map((q) => q.question)).toEqual([]);
    expect(used).toHaveLength(128);
  });

  it('Unit 6 has 4 sections, 10 lessons, ending on a practice interview; every U.S. History question is now placed', () => {
    const unit6 = UNITS[5];
    expect(unit6.sections.map((s) => s.title)).toEqual(['World War I and the Great Depression', 'World War II', 'The Cold War', 'Civil rights and a new century']);
    const lessons = unit6.sections.flatMap((s) => s.lessons);
    expect(lessons).toHaveLength(10);
    expect(lessons.every((l) => ['draft', 'reviewed'].includes(l.status))).toBe(true);
    expect(unit6.sections.at(-1).stops.at(-1).type).toBe('practiceInterview');
    const placed = UNITS.slice(3, 6).flatMap((u) => u.sections.flatMap((s) => sectionQuestionIds(s)));
    expect(placed).toHaveLength(exported2025.filter((q) => q.category === 'U.S. History').length);
  });

  it('Unit 5 has 3 sections, 6 lessons, ending on a practice interview; it says many Black Americans were still kept from voting after 1870', () => {
    const unit5 = UNITS[4];
    expect(unit5.sections.map((s) => s.title)).toEqual(['A growing country', 'Slavery and the Civil War', 'Who can vote, who is a citizen']);
    const lessons = unit5.sections.flatMap((s) => s.lessons);
    expect(lessons).toHaveLength(6);
    expect(lessons.every((l) => ['draft', 'reviewed'].includes(l.status))).toBe(true);
    expect(unit5.sections.at(-1).stops.at(-1).type).toBe('practiceInterview');
    expect(findLesson('u5-s3-l1').lesson.steps.listen.facts.join(' ')).toMatch(/many Black Americans were still kept from voting/);
  });

  it('Unit 4 has 3 sections, 9 lessons, ending on a practice interview', () => {
    const unit4 = UNITS[3];
    expect(unit4.sections.map((s) => s.title)).toEqual(['The first Americans and the colonies', 'Independence', 'A new nation']);
    const lessons = unit4.sections.flatMap((s) => s.lessons);
    expect(lessons).toHaveLength(9);
    expect(lessons.every((l) => ['draft', 'reviewed'].includes(l.status))).toBe(true);
    expect(unit4.sections.at(-1).stops.at(-1).type).toBe('practiceInterview');
  });

  it('every question a lesson uses is an official 2025 question, word for word', () => {
    for (const id of UNITS.flatMap((u) => u.sections.flatMap((s) => sectionQuestionIds(s)))) {
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
  it('learners see exactly the reviewed lessons of a section', () => {
    const congress = UNITS[1].sections[1];
    expect(visibleLessons(congress, { showDrafts: false }).map((l) => l.id)).toEqual(congress.lessons.filter((l) => l.status === 'reviewed').map((l) => l.id));
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
