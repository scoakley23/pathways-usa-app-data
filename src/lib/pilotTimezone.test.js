import { describe, it, expect, afterAll } from 'vitest';
import { isoWeek, learnerSummary } from '../../base44/shared/pilotReport.js';
import { addMonths, dueWindow } from '../../base44/shared/pilotCheckIns.js';
import * as appReport from './pilotReport.js';
import * as appCheckIns from './pilotCheckIns.js';

// The pilot's day and week math is in UTC, so it gives the same answer on any
// machine (the server runs in UTC; a laptop in Chicago or Tokyo must agree).
// Node picks up a change to process.env.TZ at once, and Vitest runs each test
// file in its own process, so this doesn't touch other files.
// To run the whole suite in another timezone: TZ=America/Chicago npm test
const ZONES = ['UTC', 'America/Chicago', 'Asia/Tokyo', 'Pacific/Kiritimati', 'Pacific/Pago_Pago'];
const ORIGINAL_TZ = process.env.TZ;
afterAll(() => {
  if (ORIGINAL_TZ === undefined) delete process.env.TZ;
  else process.env.TZ = ORIGINAL_TZ;
});

const NOW = new Date('2026-11-30T12:00:00Z');
const input = {
  now: NOW,
  user: { pilot_id: 'p-1', created_date: '2026-06-01T15:00:00.000Z' },
  activityDates: ['2026-06-01', '2026-06-26', '2026-07-27', '2026-09-03'],
  sessions: [
    { created_date: '2026-06-05T00:00:00Z', overall_score: 55 },
    { created_date: '2026-06-20T23:30:00Z', overall_score: 80 },
  ],
};
const learner = { created_date: '2026-01-10T10:00:00.000Z' };
const checks = [
  '2026-04-09T23:59:00Z', '2026-04-10T00:00:00Z', '2026-05-09T23:59:00Z', '2026-05-10T00:00:00Z',
  '2026-07-10T00:00:00Z', '2027-01-10T00:00:00Z', '2027-02-08T23:59:00Z', '2027-02-09T00:00:00Z',
];

function results(report, checkIns) {
  const s = report.learnerSummary(input);
  return {
    signup_week: s.signup_week,
    days_since_signup: s.days_since_signup,
    active_weeks: s.active_weeks,
    retention: s.retention,
    first_mock_days: s.first_mock_days,
    check_ins: s.check_ins,
    weeks: ['2026-01-01T00:30:00Z', '2026-12-31T23:30:00Z', '2027-01-04T00:00:00Z'].map((t) => report.isoWeek(new Date(t))),
    months: [checkIns.addMonths(new Date('2026-01-31T00:30:00Z'), 1), checkIns.addMonths(new Date('2026-05-31T23:30:00Z'), 3)].map((d) => d.toISOString()),
    windows: checks.map((t) => checkIns.dueWindow(learner, new Date(t))),
  };
}

describe('pilot numbers are the same in every timezone', () => {
  const inUtc = (() => {
    process.env.TZ = 'UTC';
    return results({ isoWeek, learnerSummary }, { addMonths, dueWindow });
  })();

  it('the UTC answers are the expected ones', () => {
    expect(inUtc.first_mock_days).toBe(4);
    expect(inUtc.days_since_signup).toBe(182);
    expect(inUtc.retention).toEqual({ week_4: true, week_8: true });
    expect(inUtc.signup_week).toBe('2026-W23');
    expect(inUtc.weeks).toEqual(['2026-W01', '2026-W53', '2027-W01']);
    expect(inUtc.months).toEqual(['2026-02-28T00:30:00.000Z', '2026-08-31T23:30:00.000Z']);
    expect(inUtc.windows).toEqual([null, 'month_3', 'month_3', null, 'month_6', 'month_12', 'month_12', null]);
  });

  for (const zone of ZONES) {
    it(`${zone}: server and app copies match UTC`, () => {
      process.env.TZ = zone;
      expect(results({ isoWeek, learnerSummary }, { addMonths, dueWindow })).toEqual(inUtc);
      expect(results(appReport, appCheckIns)).toEqual(inUtc);
    });
  }
});
