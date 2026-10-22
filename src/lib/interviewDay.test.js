import { describe, it, expect } from 'vitest';
import {
  CIVICS_TEST_RULES, civicsStatus, sentenceStatus, speakingPassed, heardOathYes, pickRandom, rehearsalResults,
} from './interviewDay';

const times = (n, v) => Array.from({ length: n }, () => v);

describe('civicsStatus', () => {
  it('2025: stops at 12 correct', () => {
    expect(civicsStatus(times(11, true), '2025').done).toBe(false);
    const s = civicsStatus([...times(3, false), ...times(12, true)], '2025');
    expect(s).toMatchObject({ correct: 12, wrong: 3, passed: true, done: true });
  });

  it('2025: stops at 9 wrong', () => {
    expect(civicsStatus(times(8, false), '2025').done).toBe(false);
    expect(civicsStatus([...times(11, true), ...times(9, false)], '2025')).toMatchObject({ passed: false, done: true });
  });

  it('2008: stops at 6 correct or 5 wrong, at most 10 questions', () => {
    expect(civicsStatus(times(6, true), '2008')).toMatchObject({ passed: true, done: true });
    expect(civicsStatus(times(5, false), '2008')).toMatchObject({ passed: false, done: true });
    expect(civicsStatus([...times(5, true), ...times(4, false)], '2008').done).toBe(false);
    expect(CIVICS_TEST_RULES['2008'].maxQuestions).toBe(10);
  });

  it('stops when the loaded questions run out', () => {
    expect(civicsStatus([true, false], '2025', 2)).toMatchObject({ passed: false, done: true });
  });

  it('falls back to the 2025 rules', () => {
    expect(civicsStatus(times(12, true), 'other').passed).toBe(true);
  });
});

describe('sentenceStatus', () => {
  it('stops after the first correct sentence', () => {
    expect(sentenceStatus([true])).toEqual({ passed: true, done: true });
    expect(sentenceStatus([false, true])).toEqual({ passed: true, done: true });
  });

  it('allows up to 3 sentences', () => {
    expect(sentenceStatus([false, false])).toEqual({ passed: false, done: false });
    expect(sentenceStatus([false, false, false])).toEqual({ passed: false, done: true });
    expect(sentenceStatus([false], 1)).toEqual({ passed: false, done: true });
  });
});

describe('speakingPassed', () => {
  it('uses the Mock Interview rule (70% acceptable)', () => {
    const r = (ok) => ({ is_acceptable: ok });
    expect(speakingPassed([...times(9, r(true)), ...times(3, r(false))], 12)).toBe(true);
    expect(speakingPassed([...times(8, r(true)), ...times(4, r(false))], 12)).toBe(false);
    expect(speakingPassed([], 0)).toBe(false);
  });
});

describe('heardOathYes', () => {
  it('accepts "I do" or "yes"', () => {
    expect(heardOathYes('I do')).toBe(true);
    expect(heardOathYes('yes I do.')).toBe(true);
    expect(heardOathYes('Yes')).toBe(true);
    expect(heardOathYes('idea')).toBe(false);
    expect(heardOathYes('')).toBe(false);
  });
});

describe('pickRandom', () => {
  it('returns n items without changing the list', () => {
    const list = [1, 2, 3, 4, 5];
    const picked = pickRandom(list, 3, () => 0.5);
    expect(picked).toHaveLength(3);
    expect(list).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(picked).size).toBe(3);
    expect(pickRandom(null, 3)).toEqual([]);
  });
});

describe('rehearsalResults', () => {
  it('links each "Practice more" to that skill', () => {
    const rows = rehearsalResults({ speaking: true, reading: false, writing: true, civics: false });
    expect(rows.map((r) => [r.skill, r.passed])).toEqual([
      ['speaking', true], ['reading', false], ['writing', true], ['civics', false],
    ]);
    expect(rows.find((r) => r.skill === 'reading').practicePath).toBe('/Practice?mode=reading');
  });
});
