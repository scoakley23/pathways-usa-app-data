import { describe, it, expect } from 'vitest';
import QUESTIONS_2025 from '../../content/civics/questions-2025.json';
import { detectOfficeholderKind, OFFICEHOLDERS } from './officeholders';
import { OFFICEHOLDER_QUESTIONS, gradeCivicsOfficeholder, officeholderAnswerFor, officeholderKindFor } from './officeholderQuestions';

const N = OFFICEHOLDERS.national;
const P = OFFICEHOLDERS.places;

describe('the question mapping', () => {
  it('has the 8 questions for each test version', () => {
    for (const v of ['2008', '2025']) {
      const rows = OFFICEHOLDER_QUESTIONS.filter((r) => r.version === v);
      expect(rows.map((r) => r.office).sort()).toEqual(
        ['capital', 'chiefJustice', 'governor', 'president', 'representative', 'senator', 'speaker', 'vicePresident'],
      );
    }
  });

  it('agrees with detectOfficeholderKind() (backup check)', () => {
    for (const r of OFFICEHOLDER_QUESTIONS) expect(detectOfficeholderKind(r.question), `${r.version} #${r.number}`).toBe(r.office);
  });

  it('finds exactly the "Answers change / vary" questions in the 2025 bank', () => {
    const mapped = QUESTIONS_2025.filter((q) => officeholderKindFor({ ...q, version: '2025' }));
    const changing = QUESTIONS_2025.filter((q) => /^Answers (change|vary)/.test(q.answer));
    expect(mapped.map((q) => q.question).sort()).toEqual(changing.map((q) => q.question).sort());
    expect(mapped).toHaveLength(8);
  });

  it('matches regardless of quote style or a "(2025 test)" note', () => {
    expect(officeholderKindFor({ question: "Who is one of your state's U.S. Senators now?", version: '2008' })).toBe('senator');
    expect(officeholderKindFor({ question: 'What is the capital of your state? (2025 test)' })).toBe('capital');
    expect(officeholderKindFor({ question: 'Who was the first President?' })).toBe(null);
    expect(officeholderKindFor({ question: 'How many justices are on the Supreme Court?' })).toBe(null);
  });
});

describe('grading from the table', () => {
  const senator = { question: 'Who is one of your state’s U.S. senators now?', version: '2025' };
  it('grades national and local answers', () => {
    expect(gradeCivicsOfficeholder({ question: 'What is the name of the President of the United States now?' }, N.president.name).correct).toBe(true);
    expect(gradeCivicsOfficeholder(senator, P.Texas.senators[0].name, { state: 'Texas', district: '2' }).correct).toBe(true);
    expect(gradeCivicsOfficeholder(senator, 'Abraham Lincoln', { state: 'Texas', district: '2' }).correct).toBe(false);
  });
  it("can't grade a local question without a saved place", () => {
    const r = gradeCivicsOfficeholder(senator, 'anything', null);
    expect(r.correct).toBe(null);
    expect(r.needsLocation).toBe(true);
  });
  it('returns null for every other question', () => {
    expect(gradeCivicsOfficeholder({ question: 'What is the supreme law of the land?' }, 'the Constitution')).toBe(null);
  });
  it('gives the answer to show, with the date', () => {
    const a = officeholderAnswerFor({ question: 'What is the capital of your state?' }, { state: 'Texas', district: '2' });
    expect(a.accepted).toEqual(['Austin']);
    expect(a.checkedOn).toBe(OFFICEHOLDERS.meta.checkedOn);
  });
});
