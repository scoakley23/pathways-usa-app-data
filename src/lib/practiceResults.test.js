import { describe, expect, it } from 'vitest';
import { cardOutcome, countOutcomes, outcomesLabel, wordScore } from './practiceResults';

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
