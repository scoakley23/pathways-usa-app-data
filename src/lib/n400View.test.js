import { describe, it, expect } from 'vitest';
import { cardCount, nextSection, sectionStates, visibleCards } from './n400View';

const sections = [
  { id: 'a', questions: [{ status: 'approved' }, { status: 'draft' }] },
  { id: 'b', questions: [{ status: 'approved' }] },
  { id: 'c', questions: [] },
];

describe('cards', () => {
  it('shows learners approved cards only, admins all', () => {
    expect(visibleCards(sections[0]).length).toBe(1);
    expect(visibleCards(sections[0], true).length).toBe(2);
    expect(cardCount(sections)).toBe(2);
    expect(cardCount(sections, true)).toBe(3);
  });
});

describe('nextSection', () => {
  it('starts at the first section for a new learner', () => {
    expect(nextSection(sections, [])).toEqual({ section: sections[0], started: false });
  });
  it('continues at the first section not read yet', () => {
    expect(nextSection(sections, ['a'])).toEqual({ section: sections[1], started: true });
    expect(nextSection(sections, ['b']).section.id).toBe('a');
  });
  it('has no section when all are read', () => {
    expect(nextSection(sections, ['a', 'b', 'c']).section).toBe(null);
  });
});

describe('sectionStates', () => {
  it('marks read, next and later sections', () => {
    expect(sectionStates(sections, ['a'])).toEqual(['done', 'current', 'later']);
    expect(sectionStates(sections, [])).toEqual(['current', 'later', 'later']);
  });
});
