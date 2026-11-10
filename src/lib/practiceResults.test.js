import { describe, expect, it } from 'vitest';
import { cardOutcome, countOutcomes, outcomesLabel, wordScore, passRule, missedItems, roadFraction } from './practiceResults';

describe('cardOutcome', () => {
  it('is right when the card was passed, whatever the score', () => {
    expect(cardOutcome(true)).toBe('right');
    expect(cardOutcome(true, 10)).toBe('right');
  });
  it('is close for a high score that did not pass', () => {
    expect(cardOutcome(false, 60)).toBe('close');
    expect(cardOutcome(false, 85)).toBe('close');
  });
  it('is missed for a low score or no score', () => {
    expect(cardOutcome(false, 59)).toBe('missed');
    expect(cardOutcome(false)).toBe('missed');
    expect(cardOutcome(false, null)).toBe('missed');
  });
});

describe('wordScore', () => {
  it('counts the target words the learner got', () => {
    const words = [
      { word: 'who', status: 'correct' },
      { word: 'lives', status: 'correct' },
      { word: 'here', status: 'missing' },
      { word: 'now', status: 'extra' },
    ];
    expect(wordScore(words)).toBe(67);
  });
  it('is 0 with no words', () => {
    expect(wordScore([])).toBe(0);
  });
});

describe('countOutcomes / outcomesLabel', () => {
  it('counts each outcome and ignores gaps', () => {
    const results = ['right', undefined, 'close', 'missed', 'right'];
    expect(countOutcomes(results)).toEqual({ right: 2, close: 1, missed: 1 });
    expect(outcomesLabel(5, 10, results)).toBe('Card 6 of 10. 2 right, 1 almost, 1 missed.');
  });
});

describe('passRule', () => {
  it('gives the real test rule for each civics version', () => {
    expect(passRule('2025')).toEqual({ need: 12, of: 20 });
    expect(passRule(2008)).toEqual({ need: 6, of: 10 });
    expect(passRule(undefined)).toEqual({ need: 12, of: 20 });
  });
});

describe('missedItems', () => {
  it('keeps counted cards that were not right, in order', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    expect(missedItems(items, ['right', 'missed', undefined, 'close', 'right'])).toEqual(['b', 'd']);
    expect(missedItems(items, [])).toEqual([]);
  });
});

describe('roadFraction', () => {
  it('moves one step when the current question is answered', () => {
    expect(roadFraction(0, 10)).toBe(0);
    expect(roadFraction(3, 10)).toBe(0.3);
    expect(roadFraction(3, 10, true)).toBe(0.4);
    expect(roadFraction(9, 10, true)).toBe(1);
    expect(roadFraction(2, 0)).toBe(0);
  });
});
