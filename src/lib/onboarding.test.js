import { describe, it, expect, beforeEach } from 'vitest';
import {
  CIVICS_VERSION_KEY, STAGE_KEY, isOnboarded, loadStage, markOnboarded, nextStep, onboardingSteps, saveFiledAnswer, saveStage,
} from './onboarding';

describe('onboardingSteps', () => {
  it('skips the test and interview questions for people who have not applied', () => {
    expect(onboardingSteps({ stage: 'preparing' })).toEqual(['start', 'language', 'name', 'stage', 'settings']);
    expect(onboardingSteps({ stage: 'learning' })).toEqual(['start', 'language', 'name', 'stage', 'settings']);
    expect(onboardingSteps({})).toEqual(['start', 'language', 'name', 'stage', 'settings']);
  });
  it('asks which test after applying, and the month once an interview is scheduled', () => {
    expect(onboardingSteps({ stage: 'applied' })).toEqual(['start', 'language', 'name', 'stage', 'filed', 'settings']);
    expect(onboardingSteps({ stage: 'interview' })).toEqual(['start', 'language', 'name', 'stage', 'filed', 'interview', 'settings']);
  });
  it('asks about a program only when there are partner programs', () => {
    expect(onboardingSteps({ stage: 'preparing', hasPrograms: true })).toEqual(['start', 'language', 'name', 'stage', 'program', 'settings']);
    expect(onboardingSteps({ stage: 'interview', hasPrograms: true })).toEqual(['start', 'language', 'name', 'stage', 'filed', 'interview', 'program', 'settings']);
    expect(nextStep('filed', { stage: 'applied', hasPrograms: true })).toBe('program');
  });
  it('moves to the next step and ends after settings', () => {
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
