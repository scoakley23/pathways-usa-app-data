import { describe, it, expect } from 'vitest';
import {
  isoWeek, learnerSummary, pilotMetrics, formatCount, formatShare, toCsv, CSV_COLUMNS, SMALL_NUMBER_LIMIT,
} from '../../base44/shared/pilotReport.js';

const d = (s) => new Date(`${s}T12:00:00`);
const NOW = d('2026-11-30');
const user = (extra = {}) => ({
  id: 'u1', email: 'test.learner@example.com', full_name: 'Test Learner', pilot_id: 'p-1',
  created_date: '2026-06-01T15:00:00.000Z', program_code: 'HARVARD-PILOT', state: 'MA', app_language: 'es', ...extra,
});
const summary = ({ user: extra, ...args } = {}) => learnerSummary({ now: NOW, ...args, user: user(extra) });

describe('ISO weeks', () => {
  it('matches ISO-8601', () => {
    expect(isoWeek(d('2026-01-01'))).toBe('2026-W01');
    expect(isoWeek(d('2026-12-31'))).toBe('2026-W53');
    expect(isoWeek(d('2027-01-03'))).toBe('2026-W53');
    expect(isoWeek(d('2026-11-02'))).toBe('2026-W45');
  });
});

describe('one learner', () => {
  it('has no email, name or account id', () => {
    const s = summary();
    expect(JSON.stringify(s)).not.toMatch(/@|Test Learner|"u1"/);
    expect(s.pilot_id).toBe('p-1');
    expect(s.signup_week).toBe('2026-W23');
  });

  it('activity: days, weeks, retention in weeks 4 and 8', () => {
    const s = summary({ activityDates: ['2026-06-01', '2026-06-01', '2026-06-25', '2026-07-30'] });
    expect(s.active_days).toBe(3);
    expect(s.weeks_active).toBe(3);
    expect(s.retention).toEqual({ week_4: true, week_8: false });
    // Days 50–56 = July 21–27; July 30 is week 9.
  });

  it('retention is unknown until the week has passed', () => {
    const s = learnerSummary({ user: user({ created_date: '2026-11-10T12:00:00Z' }), now: NOW });
    expect(s.retention).toEqual({ week_4: null, week_8: null });
  });

  it('mock interviews: count, first and latest score, days to the first', () => {
    const sessions = [
      { created_date: '2026-06-20T00:00:00Z', overall_score: 80.4 },
      { created_date: '2026-06-05T00:00:00Z', overall_score: 55.6 },
    ];
    const s = summary({ sessions });
    expect(s.mock_interviews).toBe(2);
    expect(s.first_mock_score).toBe(56);
    expect(s.latest_mock_score).toBe(80);
    expect(s.first_mock_days).toBe(4);
  });

  it('check-ins: sign-up answers, first window of each Yes, first try vs retest', () => {
    const checkIns = [
      { kind: 'signup', stage: 'filed_waiting', confidence: '2', created_date: '2026-06-02T00:00:00Z' },
      { kind: 'month_3', filed: 'yes', interviewed: 'not_yet', confidence: '3', created_date: '2026-09-02T00:00:00Z' },
      { kind: 'month_6', interviewed: 'yes', passed_tests: 'yes', oath: 'prefer_not', would_have_without_pathways: 'maybe', created_date: '2026-12-02T00:00:00Z' },
    ];
    const s = summary({ checkIns });
    expect(s.stage_at_signup).toBe('filed_waiting');
    expect(s.confidence_at_signup).toBe('2');
    expect(s.latest_confidence).toBe('3');
    expect(s.confidence_later).toBe(3);
    expect(s.first_yes).toEqual({ filed: 'month_3', interviewed: 'month_6', passed_tests: 'month_6', oath: 'prefer_not', registered_to_vote: '' });
    expect(s.passed_first_try).toBe(true);
    expect(s.would_have_without_pathways).toBe('maybe');

    const retest = summary({ checkIns: [{ kind: 'month_3', passed_tests: 'retest' }, { kind: 'month_6', passed_tests: 'yes' }] });
    expect(retest.passed_first_try).toBe(false);
    expect(retest.needed_retest).toBe(true);
  });

  it('which check-ins were due and answered', () => {
    const s = summary({ checkIns: [{ kind: 'month_3' }] });
    expect(s.check_ins).toEqual({
      month_3: { due: true, answered: true },
      month_6: { due: false, answered: false }, // opens Dec 1
      month_12: { due: false, answered: false },
    });
  });
});

describe('the dashboard numbers', () => {
  const learners = [
    summary({ user: { pilot_id: 'a' }, sessions: [{ created_date: '2026-06-05T00:00:00Z', overall_score: 60 }, { created_date: '2026-07-01T00:00:00Z', overall_score: 90 }], activityDates: ['2026-06-24'],
      checkIns: [{ kind: 'signup', confidence: '2', stage: 'not_filed', created_date: '2026-06-02T00:00:00Z' }, { kind: 'month_3', confidence: '4', filed: 'yes', created_date: '2026-09-02T00:00:00Z' }] }),
    summary({ user: { pilot_id: 'b', program_code: '', state: 'prefer_not' }, sessions: [{ created_date: '2026-07-01T00:00:00Z', overall_score: 70 }] }),
    summary({ user: { pilot_id: 'c', created_date: '2026-11-25T00:00:00Z' } }),
  ];
  const m = pilotMetrics(learners);

  it('sign-ups and activation (only learners past 14 days count)', () => {
    expect(m.signups).toEqual({ count: 3, withCode: 2 });
    expect(m.activation).toEqual({ count: 1, of: 2 });
  });

  it('retention, practice, readiness, responses, milestones, reach', () => {
    expect(m.retention.week_4).toEqual({ count: 1, of: 2 });
    expect(m.practice).toMatchObject({ mocks: 3, learnersWithMocks: 2, firstScore: 60, latestScore: 90, scoreN: 1 });
    expect(m.readiness).toEqual({ n: 1, signup: 2, latest: 4 });
    expect(m.responses.month_3).toEqual({ count: 1, of: 2 });
    expect(m.milestones.filed).toMatchObject({ count: 1, of: 3, byWindow: { month_3: 1 } });
    expect(m.reach.state).toEqual({ MA: 2, prefer_not: 1 });
    expect(m.reach.stage).toEqual({ not_filed: 1, not_answered: 2 });
    expect(m.weekly).toEqual([{ week: '2026-W26', count: 1 }]);
  });
});

describe('Partner view', () => {
  it(`hides counts from 1 to ${SMALL_NUMBER_LIMIT - 1} and their percentages`, () => {
    expect(formatCount(3, { partner: true })).toBe('fewer than 5');
    expect(formatCount(0, { partner: true })).toBe('0');
    expect(formatCount(5, { partner: true })).toBe('5');
    expect(formatCount(3)).toBe('3');
    expect(formatShare(3, 30, { partner: true })).toBe('fewer than 5 of 30');
    expect(formatShare(11, 30, { partner: true })).toBe('11 of 30 (37%)');
    expect(formatShare(11, 30)).toBe('11 of 30 (37%)');
    expect(formatShare(0, 0)).toBe('0 of 0');
  });
});

describe('CSV', () => {
  it('one row per learner, pilot_id only, sign-up as a week', () => {
    const csv = toCsv([summary({ checkIns: [{ kind: 'month_3', filed: 'yes' }] })]);
    const [head, row] = csv.trim().split('\n');
    expect(head.split(',')).toEqual(CSV_COLUMNS);
    expect(head).toContain('signup_week');
    expect(row.startsWith('p-1,HARVARD-PILOT,MA,es,2026-W23,')).toBe(true);
    expect(csv).not.toMatch(/@|Test Learner|2026-06-01/);
    expect(CSV_COLUMNS.join(',')).not.toMatch(/email|name|date/);
  });

  it('quotes commas and quotes', () => {
    const csv = toCsv([{ ...summary(), program_code: 'A,"B"' }]);
    expect(csv).toContain('"A,""B"""');
  });
});
