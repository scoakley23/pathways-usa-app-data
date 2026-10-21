import { describe, it, expect } from 'vitest';
import { CURRENT_OFFICIALS, currentAnswerFor, findOfficialsProblems, getPersonalizedAnswer, officeFor } from './currentAnswers';

// Fake names only.
const OFFICIALS = {
  source: 'https://www.uscis.gov/citizenship/testupdates',
  checkedOn: '2026-10-21',
  answers: { president: 'Alex Sample', vicePresident: 'Blair Sample', speaker: 'Casey Sample', chiefJustice: 'Drew Sample' },
};
const CHANGE = 'Answers change. Check uscis.gov for the current answer.';
const VARY = 'Answers vary by where you live.';

describe('officeFor', () => {
  it('tells Vice President from President', () => {
    expect(officeFor('What is the name of the Vice President of the United States now?')).toBe('vicePresident');
    expect(officeFor('What is the name of the President of the United States now?')).toBe('president');
    expect(officeFor('What is the name of the Speaker of the House of Representatives now?')).toBe('speaker');
    expect(officeFor('Who is the Chief Justice of the United States now?')).toBe('chiefJustice');
  });
});

describe('currentAnswerFor', () => {
  it('shows a confirmed national official with the date and source', () => {
    const q = { question: 'What is the name of the Vice President of the United States now?', answer: CHANGE };
    expect(currentAnswerFor(q, { officials: OFFICIALS })).toEqual({
      kind: 'current', text: 'Blair Sample', checkedOn: '2026-10-21', source: OFFICIALS.source,
    });
  });

  it('says to check uscis.gov until names are confirmed', () => {
    const q = { question: 'What is the name of the President of the United States now?', answer: CHANGE };
    expect(currentAnswerFor(q, { officials: { ...OFFICIALS, checkedOn: null } }).kind).toBe('check');
  });

  it("uses the learner's own officials, or asks them to look them up", () => {
    const q = { question: 'Who is one of your state’s U.S. senators now?', answer: VARY };
    const data = { senators: [{ name: 'Sam One' }, { name: 'Lee Two' }] };
    expect(currentAnswerFor(q, { representativeData: data })).toEqual({ kind: 'yours', text: 'Sam One and Lee Two' });
    expect(currentAnswerFor(q, { representativeData: null })).toEqual({ kind: 'find' });
    expect(currentAnswerFor(q, { representativeData: { senators: [] } })).toEqual({ kind: 'find' });
  });

  it('adds nothing to fixed answers', () => {
    expect(currentAnswerFor({ question: 'How many U.S. senators are there?', answer: 'One hundred (100)' })).toBe(null);
  });

  it('keeps the personalized answers the civics quiz uses', () => {
    const data = { representative: { name: 'Robin Rep', district: 7 }, state_capital: 'Capitol City' };
    expect(getPersonalizedAnswer('Name your U.S. representative.', data)).toBe('Robin Rep (District 7)');
    expect(getPersonalizedAnswer('What is the capital of your state?', data)).toBe('Capitol City');
  });
});

describe('content/civics/current-officials.json', () => {
  it('is valid', () => {
    expect(findOfficialsProblems(CURRENT_OFFICIALS)).toEqual([]);
  });

  it('rejects names without a date, a date without names, and other sources', () => {
    expect(findOfficialsProblems(OFFICIALS)).toEqual([]);
    expect(findOfficialsProblems({ ...OFFICIALS, answers: { ...OFFICIALS.answers, speaker: '' } })).toHaveLength(1);
    expect(findOfficialsProblems({ ...OFFICIALS, checkedOn: 'yesterday' })).toHaveLength(1);
    expect(findOfficialsProblems({ ...OFFICIALS, source: 'https://example.com' })).toHaveLength(1);
  });
});
