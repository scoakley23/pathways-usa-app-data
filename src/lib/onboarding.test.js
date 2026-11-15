import { describe, it, expect, beforeEach } from 'vitest';
import {
  CIVICS_VERSION_KEY, STAGE_KEY, isOnboarded, loadStage, markOnboarded, nextStep, onboardingSteps, saveFiledAnswer, saveStage,
} from './onboarding';

describe('onboardingSteps', () => {
  it('starts with the language and Meet Amio; skips the test question for people who have not applied', () => {
    expect(onboardingSteps({ stage: 'preparing' })).toEqual(['language', 'meet', 'stage', 'settings']);
    expect(onboardingSteps({ stage: 'learning' })).toEqual(['language', 'meet', 'stage', 'settings']);
    expect(onboardingSteps({})).toEqual(['language', 'meet', 'stage', 'settings']);
  });
  it('asks which test after applying; the interview month waits for Your plan', () => {
    expect(onboardingSteps({ stage: 'applied' })).toEqual(['language', 'meet', 'stage', 'filed', 'settings']);
    expect(onboardingSteps({ stage: 'interview' })).toEqual(['language', 'meet', 'stage', 'filed', 'settings']);
  });
  it('asks about a program only when there are partner programs, in the same place as before', () => {
    expect(onboardingSteps({ stage: 'preparing', hasPrograms: true })).toEqual(['language', 'meet', 'stage', 'program', 'settings']);
    expect(onboardingSteps({ stage: 'interview', hasPrograms: true })).toEqual(['language', 'meet', 'stage', 'filed', 'program', 'settings']);
    expect(nextStep('filed', { stage: 'applied', hasPrograms: true })).toBe('program');
  });
  it('moves to the next step and ends after settings', () => {
    expect(nextStep('language', {})).toBe('meet');
    expect(nextStep('meet', {})).toBe('stage');
    expect(nextStep('stage', { stage: 'interview' })).toBe('filed');
    expect(nextStep('filed', { stage: 'applied' })).toBe('settings');
    expect(nextStep('settings', {})).toBe(null);
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
