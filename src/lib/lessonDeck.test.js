import { describe, it, expect } from 'vitest';
import { deckSteps, splitIdeas } from './lessonDeck';

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
