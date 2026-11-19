import { describe, it, expect, beforeEach } from 'vitest';
import {
  CIVICS_VERSION_KEY, FIRST_OPEN_STEPS, STAGE_KEY, asksFiled, isOnboarded, loadStage, markOnboarded, nextStep, onboardingSteps, saveFiledAnswer, saveStage,
} from './onboarding';

describe('onboardingSteps', () => {
  it('is language, how Amio works, then Your plan; no sound and text size step', () => {
    expect(FIRST_OPEN_STEPS).toEqual(['language', 'how', 'plan']);
    expect(onboardingSteps({})).toEqual(['language', 'how', 'plan']);
    expect(onboardingSteps({ stage: 'interview' })).toEqual(['language', 'how', 'plan']);
  });
  it('asks about a program only when there are partner programs, after the plan', () => {
    expect(onboardingSteps({ hasPrograms: true })).toEqual(['language', 'how', 'plan', 'program']);
    expect(nextStep('plan', { hasPrograms: true })).toBe('program');
    expect(nextStep('program', { hasPrograms: true })).toBe(null);
  });
  it('moves to the next step and ends after the plan', () => {
    expect(nextStep('language', {})).toBe('how');
    expect(nextStep('how', {})).toBe('plan');
    expect(nextStep('plan', {})).toBe(null);
  });
  it('asks which civics test on the plan only once the N-400 is sent', () => {
    expect(asksFiled('applied')).toBe(true);
    expect(asksFiled('interview')).toBe(true);
    expect(asksFiled('preparing')).toBe(false);
    expect(asksFiled('learning')).toBe(false);
    expect(asksFiled(null)).toBe(false);
  });
});

describe('device-only answers', () => {
  const store = {};
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    };
  });
  it('saves a known stage only', () => {
    saveStage('applied');
    expect(loadStage()).toBe('applied');
    saveStage('2025-03-01');
    expect(store[STAGE_KEY]).toBe('applied');
  });
  it('turns the filing answer into the civics test version, never a date', () => {
    expect(saveFiledAnswer('before')).toBe('2008');
    expect(store[CIVICS_VERSION_KEY]).toBe('2008');
    expect(saveFiledAnswer('unsure')).toBe('2025');
    expect(store[CIVICS_VERSION_KEY]).toBe('2025');
    expect(saveFiledAnswer('bogus')).toBe(null);
  });
  it('remembers that onboarding is done', () => {
    expect(isOnboarded()).toBe(false);
    markOnboarded();
    expect(isOnboarded()).toBe(true);
  });
});
