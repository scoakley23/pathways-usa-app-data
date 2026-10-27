import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeProgramCode, isAllowedProgramCode, rememberCodeFromUrl, loadPendingCode, clearPendingCode,
  stageFromOnboarding, buildSignupAnswers, buildProfileAnswers, shouldShowPilotIntro, newPilotId, PENDING_CODE_KEY,
} from './pilot';

let store;
beforeEach(() => {
  store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
});

describe('program code', () => {
  it('ignores case and spaces', () => {
    expect(normalizeProgramCode('  houston-pilot ')).toBe('HOUSTON-PILOT');
    expect(isAllowedProgramCode('houston pilot')).toBe(true);
    expect(isAllowedProgramCode('HOUSTON')).toBe(false);
    expect(isAllowedProgramCode('')).toBe(false);
  });
  it('keeps ?code= on the device until the screen is seen', () => {
    expect(rememberCodeFromUrl('?code=houston-pilot&x=1')).toBe('HOUSTON-PILOT');
    expect(store[PENDING_CODE_KEY]).toBe('HOUSTON-PILOT');
    expect(loadPendingCode()).toBe('HOUSTON-PILOT');
    clearPendingCode();
    expect(loadPendingCode()).toBe('');
  });
  it('ignores codes that are not program codes (e.g. a sign-in provider\'s ?code=)', () => {
    expect(rememberCodeFromUrl('?code=4%2F0AfJohXk-random')).toBeNull();
    expect(store[PENDING_CODE_KEY]).toBeUndefined();
  });
  it('a link without a code changes nothing', () => {
    store[PENDING_CODE_KEY] = 'HOUSTON-PILOT';
    expect(rememberCodeFromUrl('?invite=ABC')).toBeNull();
    expect(loadPendingCode()).toBe('HOUSTON-PILOT');
  });
  it('works when storage is blocked', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); }, removeItem: () => { throw new Error('no'); } };
    expect(rememberCodeFromUrl('?code=HOUSTON-PILOT')).toBe('HOUSTON-PILOT');
    expect(loadPendingCode()).toBe('');
    expect(() => clearPendingCode()).not.toThrow();
  });
});

describe('signup answers', () => {
  it('prefills the stage from Getting started', () => {
    expect(stageFromOnboarding('preparing')).toBe('not_filed');
    expect(stageFromOnboarding('applied')).toBe('filed_waiting');
    expect(stageFromOnboarding('interview')).toBe('interview_scheduled');
    expect(stageFromOnboarding('learning')).toBe('');
    expect(stageFromOnboarding(null)).toBe('');
  });

  it('saves only the answered questions', () => {
    const { checkIn, profile, error } = buildSignupAnswers({ programCode: 'houston-pilot', state: 'TX', stage: 'filed_waiting', confidence: '3', reminders: true });
    expect(error).toBeNull();
    expect(checkIn).toEqual({ kind: 'signup', stage: 'filed_waiting', confidence: '3' });
    expect(profile).toEqual({ program_code: 'HOUSTON-PILOT', state: 'TX', checkin_email_reminders: true, pilot_intro_seen: true });
  });

  it('everything left blank: no check-in, reminders off', () => {
    const { checkIn, profile } = buildSignupAnswers({});
    expect(checkIn).toBeNull();
    expect(profile).toEqual({ program_code: null, state: null, checkin_email_reminders: false, pilot_intro_seen: true });
  });

  it('"I\'d rather not say" is saved as prefer_not', () => {
    const { checkIn, profile } = buildSignupAnswers({ state: 'prefer_not', stage: 'prefer_not', confidence: 'prefer_not' });
    expect(checkIn).toEqual({ kind: 'signup', stage: 'prefer_not', confidence: 'prefer_not' });
    expect(profile.state).toBe('prefer_not');
  });

  it('drops anything that is not one of the choices', () => {
    const { checkIn, profile } = buildSignupAnswers({ state: '77002', stage: 'green card', confidence: '9' });
    expect(checkIn).toBeNull();
    expect(profile.state).toBeNull();
  });

  it('an unknown code is not saved', () => {
    expect(buildSignupAnswers({ programCode: 'NOPE' })).toEqual({ checkIn: null, profile: null, error: 'unknown_code' });
  });
});

describe('Profile: state and program code', () => {
  it('saves only state and code', () => {
    expect(buildProfileAnswers({ programCode: 'houston-pilot', state: 'CA' })).toEqual({ profile: { program_code: 'HOUSTON-PILOT', state: 'CA' }, error: null });
    expect(buildProfileAnswers({ programCode: '', state: '' })).toEqual({ profile: { program_code: null, state: null }, error: null });
    expect(buildProfileAnswers({ programCode: 'NOPE', state: 'CA' }).error).toBe('unknown_code');
  });
});

describe('when the screen shows', () => {
  const learner = { email: 'test@example.com', skill_levels: { civics: 'strong' } };
  it('learners after their first day, once', () => {
    expect(shouldShowPilotIntro({ user: learner })).toBe(true);
    expect(shouldShowPilotIntro({ user: { ...learner, pilot_intro_seen: true } })).toBe(false);
  });
  it('not on the first day (no quick check and no plan)', () => {
    expect(shouldShowPilotIntro({ user: { email: 'test@example.com' } })).toBe(false);
    expect(shouldShowPilotIntro({ user: { email: 'test@example.com' }, hasPlan: true })).toBe(true);
  });
  it('never for signed-out visitors', () => {
    expect(shouldShowPilotIntro({ user: null })).toBe(false);
  });
});

describe('pilot id', () => {
  it('is random and never the email', () => {
    const a = newPilotId();
    expect(a).not.toBe(newPilotId());
    expect(a).not.toMatch(/@/);
  });
});
