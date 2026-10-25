import { describe, it, expect } from 'vitest';
import { deckSteps, splitIdeas, nextLesson } from './lessonDeck';

describe('deckSteps', () => {
  it('has all five steps for a full lesson', () => {
    expect(deckSteps({ hasVideo: true, hasWords: true, hasQuestions: true })).toEqual(['watch', 'learn', 'words', 'questions', 'review']);
  });
  it('skips steps with nothing to show; Learn is always there', () => {
    expect(deckSteps({})).toEqual(['learn']);
    expect(deckSteps({ hasQuestions: true })).toEqual(['learn', 'questions', 'review']);
  });
});

describe('splitIdeas', () => {
  it('makes one card per paragraph or list, keeping headings with what follows', () => {
    const md = '## The Constitution\n\nIt is the supreme law.\n\n- It sets up the government\n- It protects rights\n\n\nWe the People.';
    expect(splitIdeas(md)).toEqual([
      '## The Constitution\n\nIt is the supreme law.',
      '- It sets up the government\n- It protects rights',
      'We the People.',
    ]);
  });
  it('handles empty text and a trailing heading', () => {
    expect(splitIdeas('')).toEqual([]);
    expect(splitIdeas(null)).toEqual([]);
    expect(splitIdeas('Intro\n\n## End')).toEqual(['Intro', '## End']);
  });
});

describe('nextLesson', () => {
  const lessons = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  it('suggests a lesson worth going over again first', () => {
    const progress = [{ lesson_id: 'a', completed: true }, { lesson_id: 'b', completed: false }, { lesson_id: 'c', completed: true, needs_review: true }];
    expect(nextLesson(lessons, progress)).toEqual({ lesson: { id: 'c' }, reason: 'review' });
  });
  it('then a lesson already started', () => {
    const progress = [{ lesson_id: 'a', completed: true }, { lesson_id: 'b', completed: false }];
    expect(nextLesson(lessons, progress)).toEqual({ lesson: { id: 'b' }, reason: 'continue' });
  });
  it('then the first lesson not started, in order', () => {
    expect(nextLesson(lessons, [{ lesson_id: 'a', completed: true }])).toEqual({ lesson: { id: 'b' }, reason: 'start' });
    expect(nextLesson(lessons, [])).toEqual({ lesson: { id: 'a' }, reason: 'start' });
  });
  it('is null when every lesson is done', () => {
    expect(nextLesson(lessons, lessons.map((l) => ({ lesson_id: l.id, completed: true })))).toBeNull();
  });
});
