import { describe, it, expect } from 'vitest';
import { currentAnswerFor } from './currentAnswers';
import { OFFICEHOLDERS } from './officeholders';

// Names are read from the table so the test keeps working after monthly updates.
const N = OFFICEHOLDERS.national;
const P = OFFICEHOLDERS.places;
const CHANGE = 'Answers change. Check uscis.gov for the current answer.';
const VARY = 'Answers vary by where you live.';

describe('currentAnswerFor', () => {
  it('names national officials from the table, with the date checked', () => {
    const q = { question: 'What is the name of the Vice President of the United States now?', answer: CHANGE, version: '2025' };
    const now = currentAnswerFor(q);
    expect(now.kind).toBe('current');
    expect(now.accepted).toEqual([N.vicePresident.name]);
    expect(now.checkedOn).toBe(OFFICEHOLDERS.meta.checkedOn);
  });

  it("uses the learner's saved place, or asks them to use Who Represents Me?", () => {
    const q = { question: 'Who is one of your state’s U.S. senators now?', answer: VARY, version: '2025' };
    expect(currentAnswerFor(q, { location: { state: 'Texas', district: '2' } }).accepted).toEqual(P.Texas.senators.map((s) => s.name));
    expect(currentAnswerFor(q).kind).toBe('find');
    const rep = { question: 'Name your U.S. representative.', answer: VARY, version: '2025' };
    expect(currentAnswerFor(rep, { location: { state: 'Texas', district: '2' } }).accepted).toEqual([P.Texas.representatives['2'].name]);
  });

  it('D.C. and territories follow the USCIS notes', () => {
    const gov = { question: 'Who is the governor of your state now?', answer: VARY, version: '2025' };
    expect(currentAnswerFor(gov, { location: { state: 'District of Columbia', district: 'At-large' } }).accepted)
      .toEqual(['District of Columbia does not have a Governor']);
    const rep = { question: 'Name your U.S. representative.', answer: VARY, version: '2025' };
    expect(currentAnswerFor(rep, { location: { state: 'Puerto Rico', district: 'At-large' } }).accepted[0]).toBe(P['Puerto Rico'].delegate.name);
  });

  it('adds nothing to fixed answers', () => {
    expect(currentAnswerFor({ question: 'How many U.S. senators are there?', answer: 'One hundred (100)' })).toBe(null);
  });
});
