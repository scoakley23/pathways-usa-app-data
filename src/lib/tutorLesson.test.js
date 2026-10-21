import { describe, it, expect } from 'vitest';
import { canContinue, progressLabel, progressPercent, nextPartIndex, markKeyWords } from './tutorLesson';

describe('canContinue', () => {
  it('lets explain and show-english steps continue right away', () => {
    expect(canContinue({ type: 'explain' })).toBe(true);
    expect(canContinue({ type: 'show-english' })).toBe(true);
  });

  it('lets a part intro continue right away', () => {
    expect(canContinue({ type: 'part-intro' })).toBe(true);
  });

  for (const type of ['practice-speaking', 'practice-writing', 'check-understanding', 'practice-reading', 'practice-interview']) {
    it(`${type} waits for an answer or "Show me"`, () => {
      expect(canContinue({ type })).toBe(false);
      expect(canContinue({ type }, { answered: true })).toBe(true);
      expect(canContinue({ type }, { shown: true })).toBe(true);
    });
  }

  it('rejects unknown or missing steps', () => {
    expect(canContinue({ type: 'quiz' })).toBe(false);
    expect(canContinue(undefined)).toBe(false);
  });
});

describe('progress', () => {
  it('labels and measures progress', () => {
    expect(progressLabel(1, 4)).toBe('Step 2 of 4');
    expect(progressPercent(1, 4)).toBe(50);
    expect(progressPercent(0, 0)).toBe(0);
  });
});

describe('nextPartIndex', () => {
  const steps = [
    { type: 'part-intro', part: 'a' }, { type: 'explain', part: 'a' },
    { type: 'part-intro', part: 'b' }, { type: 'explain', part: 'b' },
  ];
  it('skips to the next part', () => {
    expect(nextPartIndex(steps, 0)).toBe(2);
    expect(nextPartIndex(steps, 2)).toBe(4);
  });
  it('moves one step when there are no parts', () => {
    expect(nextPartIndex([{ type: 'explain' }, { type: 'explain' }], 0)).toBe(1);
  });
});

describe('markKeyWords', () => {
  const join = (parts) => parts.map((p) => p.text).join('');

  it('marks key words case-insensitively and keeps the text', () => {
    const text = 'What is the supreme law of the United States?';
    const parts = markKeyWords(text, ['Supreme Law', 'united states']);
    expect(join(parts)).toBe(text);
    expect(parts.filter((p) => p.mark).map((p) => p.text)).toEqual(['supreme law', 'United States']);
  });

  it('matches whole words only and prefers longer phrases', () => {
    expect(markKeyWords('the senators', ['senator']).some((p) => p.mark)).toBe(false);
    const parts = markKeyWords('House of Representatives', ['House', 'House of Representatives']);
    expect(parts).toEqual([{ text: 'House of Representatives', mark: true }]);
  });

  it('handles punctuation in key words and empty input', () => {
    expect(markKeyWords('(U.S.) Constitution', ['(U.S.)']).filter((p) => p.mark).map((p) => p.text)).toEqual(['(U.S.)']);
    expect(markKeyWords('Text', [])).toEqual([{ text: 'Text', mark: false }]);
    expect(markKeyWords('', ['a'])).toEqual([]);
  });
});
