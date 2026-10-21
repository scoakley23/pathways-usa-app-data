import { describe, it, expect } from 'vitest';
import { canContinue, progressLabel, progressPercent } from './tutorLesson';

describe('canContinue', () => {
  it('lets explain and show-english steps continue right away', () => {
    expect(canContinue({ type: 'explain' })).toBe(true);
    expect(canContinue({ type: 'show-english' })).toBe(true);
  });

  for (const type of ['practice-speaking', 'practice-writing', 'check-understanding']) {
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
