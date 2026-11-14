import { describe, it, expect } from 'vitest';
import { practiceAnswer, PRACTICE_PERSON, PRACTICE_PERSON_LABEL } from './practicePerson';
import { N400_SECTIONS } from '../components/n400/n400Content';

const cardIds = N400_SECTIONS.flatMap((s) => s.questions.map((q) => q.id));

describe('the N-400 practice person', () => {
  it('answers only cards that exist, one per card', () => {
    expect(Object.keys(PRACTICE_PERSON.answers).sort()).toEqual([...cardIds].sort());
  });

  it('is always labeled "practice person, not real"', () => {
    expect(PRACTICE_PERSON_LABEL).toBe('practice person, not real');
  });

  it('learners see nothing until the person and the answer are reviewed', () => {
    const source = { person: { name: 'Maria', status: 'draft' }, answers: { a: { answer: 'No.', status: 'reviewed' } } };
    expect(practiceAnswer('a', { source })).toBe(null);
    expect(practiceAnswer('a', { source, isAdmin: true })).toEqual({ name: 'Maria', answer: 'No.', draft: true });
    source.person.status = 'reviewed';
    expect(practiceAnswer('a', { source })).toEqual({ name: 'Maria', answer: 'No.', draft: false });
    source.answers.a.status = 'draft';
    expect(practiceAnswer('a', { source })).toBe(null);
  });

  it('every answer is still a draft (a person reviews them first)', () => {
    expect(PRACTICE_PERSON.person.status).toBe('draft');
    expect(Object.values(PRACTICE_PERSON.answers).every((a) => a.status === 'draft')).toBe(true);
    for (const id of cardIds) expect(practiceAnswer(id)).toBe(null);
  });
});
