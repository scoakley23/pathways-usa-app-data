import { describe, it, expect, beforeEach } from 'vitest';
import {
  stageFromOnboarding, buildSignupAnswers, buildProfileAnswers, reminderSettings,
  snoozeCheckIn, isCheckInSnoozed, skipPreInterview, loadPreInterviewSkip, shouldShowPilotIntro, newPilotId,
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

describe('signup answers', () => {
  it('prefills the stage from Getting started', () => {
    expect(stageFromOnboarding('preparing')).toBe('not_filed');
    expect(stageFromOnboarding('applied')).toBe('filed_waiting');
    expect(stageFromOnboarding('interview')).toBe('interview_scheduled');
    expect(stageFromOnboarding('learning')).toBe('');
    expect(stageFromOnboarding(null)).toBe('');
  });

  it('saves only the answered questions', () => {
    const { checkIn, profile } = buildSignupAnswers({ state: 'TX', stage: 'filed_waiting', confidence: '3', reminders: true, language: 'es' });
    expect(checkIn).toEqual({ kind: 'signup', stage: 'filed_waiting', confidence: '3' });
    expect(profile).toEqual({ state: 'TX', checkin_email_reminders: true, reminder_language: 'es', pilot_intro_seen: true });
  });

  it('everything left blank: no check-in, reminders off', () => {
    const { checkIn, profile } = buildSignupAnswers({});
    expect(checkIn).toBeNull();
    expect(profile).toEqual({ state: null, checkin_email_reminders: false, reminder_language: null, pilot_intro_seen: true });
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
});

describe('Profile: state', () => {
  it('saves only the state', () => {
    expect(buildProfileAnswers({ state: 'CA' })).toEqual({ state: 'CA' });
    expect(buildProfileAnswers({ state: '' })).toEqual({ state: null });
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
