import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { UNITS } from './course';
import { journeyStops, totalStars, visibleCourse } from './journey';
import { progressRow } from './lessonPlayer';
import {
  HELP_PHRASES, N400_LESSONS, N400_LESSON_STEPS, N400_RULES, findN400Lesson, helpPhrase, lessonSection,
  n400LessonProblems, n400LessonVisible, n400StarsFor, questionName,
} from './n400Lessons';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import data from '../../content/n400/lessons.json';

describe('N-400 lessons (content/n400/lessons.json)', () => {
  it('have no problems: every phrasing, word and definition comes from the guide', () => {
    expect(n400LessonProblems()).toEqual([]);
  });

  it('one lesson per guide section, one per unit, in order', () => {
    expect(N400_LESSONS.map((l) => l.section)).toEqual(N400_SECTIONS.map((s) => s.id));
    expect(N400_LESSONS.map((l) => l.unitId)).toEqual(UNITS.map((u) => u.id));
  });

  it('each unit ends with its N-400 lesson, just before the practice interview', () => {
    for (const l of N400_LESSONS) {
      const unit = UNITS.find((u) => u.id === l.unitId);
      const stops = unit.sections.at(-1).stops;
      expect(stops.at(-2), l.id).toMatchObject({ type: 'n400', lessonId: l.id, title: l.title });
      expect(stops.at(-1).type).toBe('practiceInterview');
    }
  });

  it('catches a phrasing the guide does not have and a made-up definition', () => {
    const bad = JSON.parse(JSON.stringify(data));
    bad.lessons[0].same[0].phrasing = 'Did you travel a lot?';
    bad.lessons[1].spot[0].choices[0] = 'Sometimes.';
    const problems = n400LessonProblems(bad);
    expect(problems.some((p) => p.includes('same[0]') && p.includes('officer phrasings'))).toBe(true);
    expect(problems.some((p) => p.includes('spot[0]') && p.includes('own definition'))).toBe(true);
  });

  it('never suggests an answer: no sample answers, and the names are not answers', () => {
    const text = JSON.stringify({ names: data.questionNames, lessons: data.lessons, help: data.help }).toLowerCase();
    for (const banned of ['practice person', 'maria', '"answer": "yes', '"answer": "no', 'i have never', 'i am not']) expect(text).not.toContain(banned);
    for (const name of Object.values(data.questionNames)) expect(name).not.toMatch(/^(yes|no)\b/i);
  });

  it('every guide question has a short name', () => {
    for (const s of N400_SECTIONS) for (const q of s.questions) expect(questionName(q.id), q.id).toBeTruthy();
  });

  it('the practice person is gone', () => {
    expect(fs.existsSync(path.resolve(__dirname, '../../content/n400/practice-person.json'))).toBe(false);
    expect(fs.existsSync(path.resolve(__dirname, './practicePerson.js'))).toBe(false);
  });
});

describe('stars, saving and visibility', () => {
  it('one star each for Same question?, Spot the word and Say what it asks', () => {
    expect(n400StarsFor({ listen: 'right', same: 'right', spot: 'right', say: 'right', help: 'right' })).toBe(3);
    expect(n400StarsFor({ same: 'right', spot: 'missed', say: 'skipped' })).toBe(1);
  });

  it('saves like a course lesson, never lowering stars', () => {
    const all = Object.fromEntries(N400_LESSON_STEPS.map((s) => [s, 'right']));
    const row = progressRow('n400-oath-questions', all, null, new Date('2026-11-18T10:00:00Z'), N400_RULES);
    expect(row).toMatchObject({ lesson_id: 'n400-oath-questions', steps_done: 5, stars: 3, completed: true });
    const again = progressRow('n400-oath-questions', { listen: 'right' }, row, new Date(), N400_RULES);
    expect(again).toMatchObject({ steps_done: 5, stars: 3, completed: true, completed_at: row.completed_at });
  });

  it('learners see reviewed lessons only; admins also drafts', () => {
    const draft = { ...N400_LESSONS[0], status: 'draft' };
    expect(n400LessonVisible(draft, false)).toBe(false);
    expect(n400LessonVisible(draft, true)).toBe(true);
    expect(n400LessonVisible({ ...draft, status: 'reviewed' }, false)).toBe(true);
  });

  it('the road: a draft N-400 stop is hidden from learners, open (never blocking) for admins', () => {
    const learner = journeyStops(visibleCourse(UNITS, { showDrafts: false }));
    expect(learner.some((s) => s.type === 'n400')).toBe(N400_LESSONS.some((l) => l.status === 'reviewed'));
    const admin = journeyStops(visibleCourse(UNITS, { showDrafts: true }));
    const n400 = admin.filter((s) => s.type === 'n400');
    expect(n400).toHaveLength(7);
    expect(n400.every((s) => s.state !== 'current')).toBe(true);
  });

  it('a finished N-400 lesson shows done with its stars, and its stars count', () => {
    const progress = { 'n400-time-outside-us': { completed: true, stars: 2 } };
    const stop = journeyStops(visibleCourse(UNITS, { showDrafts: true }), { progress }).find((s) => s.lessonId === 'n400-time-outside-us');
    expect(stop).toMatchObject({ state: 'done', stars: 2 });
    expect(totalStars(progress, UNITS)).toBe(2);
  });

  it('lessonSection gives the guide section with its approved questions', () => {
    const s = lessonSection(findN400Lesson('n400-immigration-history'));
    expect(s.questions.map((q) => q.id)).toEqual(['p9-20', 'p9-21']);
  });

  it('the help phrases', () => {
    expect(HELP_PHRASES.map((p) => p.id)).toEqual(['repeat', 'meaning', 'simpler']);
    expect(helpPhrase(HELP_PHRASES[1], 'evidence')).toBe('What does “evidence” mean?');
  });
});
