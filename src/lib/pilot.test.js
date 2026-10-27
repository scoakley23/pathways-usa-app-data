import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeProgramCode, isAllowedProgramCode, rememberCodeFromUrl, loadPendingCode, clearPendingCode,
  stageFromOnboarding, buildSignupAnswers, buildProfileAnswers, reminderSettings,
  snoozeCheckIn, isCheckInSnoozed, skipPreInterview, loadPreInterviewSkip, shouldShowPilotIntro, newPilotId, PENDING_CODE_KEY,
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
    expect(normalizeProgramCode('  harvard-pilot ')).toBe('HARVARD-PILOT');
    expect(isAllowedProgramCode('harvard pilot')).toBe(true);
    expect(isAllowedProgramCode('HARVARD')).toBe(false);
    expect(isAllowedProgramCode('')).toBe(false);
  });
  it('keeps ?code= on the device until the screen is seen', () => {
    expect(rememberCodeFromUrl('?code=harvard-pilot&x=1')).toBe('HARVARD-PILOT');
    expect(store[PENDING_CODE_KEY]).toBe('HARVARD-PILOT');
    expect(loadPendingCode()).toBe('HARVARD-PILOT');
    clearPendingCode();
    expect(loadPendingCode()).toBe('');
  });
  it('ignores codes that are not program codes (e.g. a sign-in provider\'s ?code=)', () => {
    expect(rememberCodeFromUrl('?code=4%2F0AfJohXk-random')).toBeNull();
    expect(store[PENDING_CODE_KEY]).toBeUndefined();
  });
  it('a link without a code changes nothing', () => {
    store[PENDING_CODE_KEY] = 'HARVARD-PILOT';
    expect(rememberCodeFromUrl('?invite=ABC')).toBeNull();
    expect(loadPendingCode()).toBe('HARVARD-PILOT');
  });
  it('works when storage is blocked', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); }, removeItem: () => { throw new Error('no'); } };
    expect(rememberCodeFromUrl('?code=HARVARD-PILOT')).toBe('HARVARD-PILOT');
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
    const { checkIn, profile, error } = buildSignupAnswers({ programCode: 'harvard-pilot', state: 'TX', stage: 'filed_waiting', confidence: '3', reminders: true, language: 'es' });
    expect(error).toBeNull();
    expect(checkIn).toEqual({ kind: 'signup', stage: 'filed_waiting', confidence: '3' });
    expect(profile).toEqual({ program_code: 'HARVARD-PILOT', state: 'TX', checkin_email_reminders: true, reminder_language: 'es', pilot_intro_seen: true });
  });

  it('everything left blank: no check-in, reminders off', () => {
    const { checkIn, profile } = buildSignupAnswers({});
    expect(checkIn).toBeNull();
    expect(profile).toEqual({ program_code: null, state: null, checkin_email_reminders: false, reminder_language: null, pilot_intro_seen: true });
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
    expect(buildProfileAnswers({ programCode: 'harvard-pilot', state: 'CA' })).toEqual({ profile: { program_code: 'HARVARD-PILOT', state: 'CA' }, error: null });
    expect(buildProfileAnswers({ programCode: '', state: '' })).toEqual({ profile: { program_code: null, state: null }, error: null });
    expect(buildProfileAnswers({ programCode: 'NOPE', state: 'CA' }).error).toBe('unknown_code');
  });
});

describe('when the screen shows', () => {
  const learner = { email: 'test@example.com', skill_levels: { civics: 'strong' } };
  it('learners after their first day, once', () => {
    expect(shouldShowPilotIntro({ user: learner, role: 'student' })).toBe(true);
    expect(shouldShowPilotIntro({ user: { ...learner, pilot_intro_seen: true }, role: 'student' })).toBe(false);
  });
  it('not on the first day (no quick check and no plan)', () => {
    expect(shouldShowPilotIntro({ user: { email: 'test@example.com' }, role: 'student' })).toBe(false);
    expect(shouldShowPilotIntro({ user: { email: 'test@example.com' }, role: 'student', hasPlan: true })).toBe(true);
  });
  it('never for tutors or signed-out visitors', () => {
    expect(shouldShowPilotIntro({ user: learner, role: 'tutor' })).toBe(false);
    expect(shouldShowPilotIntro({ user: null, role: null })).toBe(false);
  });
});

describe('pilot id', () => {
  it('is random and never the email', () => {
    const a = newPilotId();
    expect(a).not.toBe(newPilotId());
    expect(a).not.toMatch(/@/);
  });
});

describe('reminders and check-in notes', () => {
  it('keeps the language only while reminders are on', () => {
    expect(reminderSettings(true, 'ar')).toEqual({ checkin_email_reminders: true, reminder_language: 'ar' });
    expect(reminderSettings(true)).toEqual({ checkin_email_reminders: true, reminder_language: 'en' });
    expect(reminderSettings(false, 'ar')).toEqual({ checkin_email_reminders: false, reminder_language: null });
  });

  it('"Not now" hides the check-in card for 7 days', () => {
    const now = new Date('2026-11-02T12:00:00');
    expect(isCheckInSnoozed(now)).toBe(false);
    snoozeCheckIn(now);
    expect(isCheckInSnoozed(new Date('2026-11-08T12:00:00'))).toBe(true);
    expect(isCheckInSnoozed(new Date('2026-11-09T13:00:00'))).toBe(false);
  });

  it('remembers a skipped pre-interview question on the device', () => {
    expect(loadPreInterviewSkip()).toBeNull();
    skipPreInterview(new Date('2026-11-02T12:00:00Z'));
    expect(loadPreInterviewSkip()).toBe('2026-11-02T12:00:00.000Z');
  });
});
