import { describe, it, expect } from 'vitest';
import {
  addMonths, signupDate, dueWindow, openCheckIn, milestonesDone, latestStage, shouldAskPreInterview,
  checkInQuestions, buildCheckIn, reminderPlan, reminderText, REMINDER_SUBJECT, REMINDER_BODY, FORBIDDEN_EMAIL_WORDS,
} from '../../base44/shared/pilotCheckIns.js';

const d = (s) => new Date(`${s}T12:00:00`);
const learner = (created, extra = {}) => ({ email: 'Test@Example.com', created_date: `${created}T10:00:00.000Z`, ...extra });

describe('when a check-in is due', () => {
  it('adds months without spilling into the next month', () => {
    expect(addMonths(d('2026-01-31'), 1).getDate()).toBe(28);
    expect(addMonths(d('2026-05-15'), 3).getMonth()).toBe(7);
  });

  it('opens 3, 6 and 12 months after sign-up, for 30 days', () => {
    const u = learner('2026-01-10');
    expect(dueWindow(u, d('2026-04-09'))).toBeNull();
    expect(dueWindow(u, d('2026-04-10'))).toBe('month_3');
    expect(dueWindow(u, d('2026-05-09'))).toBe('month_3');
    expect(dueWindow(u, d('2026-05-11'))).toBeNull();
    expect(dueWindow(u, d('2026-07-20'))).toBe('month_6');
    expect(dueWindow(u, d('2027-01-10'))).toBe('month_12');
    expect(dueWindow(u, d('2027-03-01'))).toBeNull();
  });

  it('never stacks: a missed window is skipped', () => {
    const u = learner('2026-01-10');
    // month_3 never answered; in the month_6 window only month_6 shows.
    expect(openCheckIn({ user: u, rows: [], now: d('2026-07-12') })).toBe('month_6');
  });

  it('is done once answered, and stops after "Don\'t ask me again"', () => {
    const u = learner('2026-01-10');
    expect(openCheckIn({ user: u, rows: [{ kind: 'month_3' }], now: d('2026-04-15') })).toBeNull();
    expect(openCheckIn({ user: { ...u, checkins_stopped: true }, rows: [], now: d('2026-04-15') })).toBeNull();
  });

  it('admins can pretend they signed up N months ago; others cannot', () => {
    const now = d('2026-11-02');
    const admin = learner('2026-10-01', { role: 'admin', pilot_test_months_ago: 3 });
    expect(signupDate(admin, now).getMonth()).toBe(7);
    expect(dueWindow(admin, now)).toBe('month_3');
    const user = learner('2026-10-01', { role: 'user', pilot_test_months_ago: 3 });
    expect(dueWindow(user, now)).toBeNull();
  });

  it('no created date: nothing is due', () => {
    expect(dueWindow({ email: 'test@example.com' }, d('2026-11-02'))).toBeNull();
  });
});

describe('what the check-in asks', () => {
  it('milestones already answered Yes show as done, not asked', () => {
    const rows = [{ kind: 'month_3', filed: 'yes', interviewed: 'not_yet' }];
    expect(milestonesDone(rows)).toMatchObject({ filed: true, interviewed: false });
    const q = checkInQuestions({ rows });
    expect(q.done).toEqual(['filed']);
    expect(q.ask).toEqual(['interviewed', 'passed_tests', 'oath']);
  });

  it('asks about voting only once the oath is Yes', () => {
    expect(checkInQuestions({}).ask).not.toContain('registered_to_vote');
    expect(checkInQuestions({ answers: { oath: 'yes' } }).ask).toContain('registered_to_vote');
    expect(checkInQuestions({ rows: [{ oath: 'yes' }] }).ask).toContain('registered_to_vote');
  });

  it('hides readiness once they passed', () => {
    expect(checkInQuestions({}).confidence).toBe(true);
    expect(checkInQuestions({ answers: { passed_tests: 'yes' } }).confidence).toBe(false);
    expect(checkInQuestions({ answers: { passed_tests: 'retest' } }).confidence).toBe(true);
    expect(checkInQuestions({ rows: [{ passed_tests: 'yes' }] }).confidence).toBe(false);
  });

  it('asks "without Pathways" only when something new is Yes', () => {
    expect(checkInQuestions({ answers: { filed: 'not_yet' } }).wouldHave).toBe(false);
    expect(checkInQuestions({ answers: { filed: 'yes' } }).wouldHave).toBe(true);
    expect(checkInQuestions({ rows: [{ filed: 'yes' }] }).wouldHave).toBe(false);
  });

  it('saves only shown, answered, allowed choices', () => {
    const rows = [{ kind: 'month_3', filed: 'yes' }];
    const answers = {
      filed: 'not_yet', // already done: not asked again
      interviewed: 'yes',
      passed_tests: 'retest',
      oath: 'prefer_not',
      registered_to_vote: 'yes', // oath isn't Yes: not shown
      confidence: '4',
      would_have_without_pathways: 'maybe',
      notes: 'my case number is…',
    };
    expect(buildCheckIn({ kind: 'month_6', rows, answers })).toEqual({
      kind: 'month_6', interviewed: 'yes', passed_tests: 'retest', oath: 'prefer_not', confidence: '4', would_have_without_pathways: 'maybe',
    });
  });

  it('nothing answered: nothing saved', () => {
    expect(buildCheckIn({ kind: 'month_3', answers: {} })).toBeNull();
    expect(buildCheckIn({ kind: 'month_3', answers: { filed: 'sometime in May' } })).toBeNull();
  });
});

describe('before the interview', () => {
  const scheduled = [{ kind: 'signup', stage: 'interview_scheduled', created_date: '2026-10-01T00:00:00Z' }];
  const now = d('2026-11-02');

  it('asks when the latest stage is "interview scheduled"', () => {
    expect(shouldAskPreInterview({ rows: scheduled, now })).toBe(true);
    expect(shouldAskPreInterview({ rows: [{ kind: 'signup', stage: 'filed_waiting' }], now })).toBe(false);
    expect(shouldAskPreInterview({ rows: [], now })).toBe(false);
  });

  it('uses the newest stage', () => {
    const rows = [...scheduled, { kind: 'signup', stage: 'not_filed', created_date: '2026-10-20T00:00:00Z' }];
    expect(latestStage(rows)).toBe('not_filed');
  });

  it('not again within 30 days of an answer or a skip', () => {
    const answered = [...scheduled, { kind: 'pre_interview', confidence: '3', created_date: '2026-10-20T00:00:00Z' }];
    expect(shouldAskPreInterview({ rows: answered, now })).toBe(false);
    expect(shouldAskPreInterview({ rows: answered, now: d('2026-11-25') })).toBe(true);
    expect(shouldAskPreInterview({ rows: scheduled, skippedAt: '2026-10-25T00:00:00Z', now })).toBe(false);
  });
});

describe('reminder emails', () => {
  const now = d('2026-04-15');
  const base = learner('2026-01-10', { checkin_email_reminders: true, reminder_language: 'es' });

  it('only learners who asked, with a check-in due and not answered', () => {
    const users = [
      base,
      { ...base, email: 'off@example.com', checkin_email_reminders: false },
      { ...base, email: 'stopped@example.com', checkins_stopped: true },
      { ...base, email: 'answered@example.com' },
      { ...base, email: 'notdue@example.com', created_date: '2026-03-01T00:00:00Z' },
    ];
    const checkIns = [{ user_email: 'answered@example.com', kind: 'month_3' }];
    expect(reminderPlan({ users, checkIns, now })).toEqual([{ email: 'test@example.com', kind: 'month_3', language: 'es' }]);
  });

  it('once per check-in window', () => {
    const reminders = [{ user_email: 'test@example.com', kind: 'month_3' }];
    expect(reminderPlan({ users: [base], reminders, now })).toEqual([]);
    expect(reminderPlan({ users: [base], reminders, now: d('2026-07-12') })).toEqual([{ email: 'test@example.com', kind: 'month_6', language: 'es' }]);
  });

  it('defaults to English', () => {
    const [item] = reminderPlan({ users: [{ ...base, reminder_language: null }], now });
    expect(item.language).toBe('en');
  });

  it('never mentions citizenship, immigration, the interview or USCIS', () => {
    const body = reminderText(REMINDER_BODY, 'https://app.example.com');
    expect(REMINDER_SUBJECT).toBe('A quick question from Pathways');
    expect(body).toContain('https://app.example.com');
    expect(body).toContain('turn off reminders on your Profile page');
    expect(FORBIDDEN_EMAIL_WORDS.test(REMINDER_SUBJECT)).toBe(false);
    expect(FORBIDDEN_EMAIL_WORDS.test(body)).toBe(false);
    expect(FORBIDDEN_EMAIL_WORDS.test('Your citizenship interview')).toBe(true);
  });
});
