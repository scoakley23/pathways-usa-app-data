// Pilot dashboard numbers (Admin → /admin/pilot). The pilot-report function
// turns each learner's records into one summary keyed by pilot_id (never an
// email or name); the dashboard and the CSV are built from those summaries.
// Shared by the function and the app, tested from src/lib/pilotReport.test.js.
import { addMonths, MILESTONES, WINDOWS } from './pilotCheckIns.js';

// Counts are exact everywhere, Partner view included (Partner view only
// leaves out the CSV).
export const ACTIVATION_DAYS = 14;
// Week N after sign-up = days (N-1)*7+1 … N*7 (day 0 is the sign-up day).
export const RETENTION_WEEKS = [4, 8];
const DAY = 24 * 60 * 60 * 1000;
const CHECK_IN_ORDER = ['signup', 'pre_interview', 'month_3', 'month_6', 'month_12'];

const toDate = (v) => {
  const d = v ? new Date(v) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
};
const dayIndex = (from, to) => Math.floor((Date.UTC(to.getFullYear(), to.getMonth(), to.getDate()) - Date.UTC(from.getFullYear(), from.getMonth(), from.getDate())) / DAY);
const parseYmd = (s) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null;
};
const numeric = (v) => (['1', '2', '3', '4', '5'].includes(String(v)) ? Number(v) : null);
const byCreated = (rows) => [...rows].sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')));

// ISO-8601 week, e.g. "2026-W44".
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

// One learner → one summary. No email, name or account id.
// `programCode` is the partner program the learner picked (ProgramMembership).
export function learnerSummary({ user = {}, checkIns = [], activityDates = [], sessions = [], civicsMastered = 0, programCode = '', now = new Date() }) {
  const signup = toDate(user.created_date);
  const rows = byCreated(checkIns).sort((a, b) => CHECK_IN_ORDER.indexOf(a.kind) - CHECK_IN_ORDER.indexOf(b.kind));
  const signupRow = rows.find((r) => r.kind === 'signup') || {};
  const newestFirst = byCreated(checkIns).reverse();

  const days = [...new Set(activityDates)].map(parseYmd).filter(Boolean);
  const weeks = [...new Set(days.map(isoWeek))].sort();
  const offsets = signup ? days.map((d) => dayIndex(signup, d)) : [];
  const daysSince = signup ? dayIndex(signup, now) : -1;
  const retention = {};
  for (const w of RETENTION_WEEKS) {
    const first = (w - 1) * 7 + 1;
    const last = w * 7;
    retention[`week_${w}`] = daysSince < last ? null : offsets.some((o) => o >= first && o <= last);
  }

  const mocks = byCreated(sessions).filter((s) => typeof s.overall_score === 'number');
  const firstMock = mocks[0];
  const latestMock = mocks[mocks.length - 1];
  const firstMockDays = firstMock && signup ? dayIndex(signup, toDate(firstMock.created_date) || now) : null;

  const firstYes = {};
  for (const m of MILESTONES) {
    const yes = rows.find((r) => r.kind.startsWith('month_') && r[m] === 'yes');
    firstYes[m] = yes ? yes.kind : rows.some((r) => r[m] === 'prefer_not') ? 'prefer_not' : '';
  }
  const retest = rows.some((r) => r.passed_tests === 'retest');

  const checkInsDue = {};
  for (const w of WINDOWS) {
    const opened = signup ? addMonths(signup, w.months) : null;
    checkInsDue[w.kind] = {
      due: !!opened && opened.getTime() <= new Date(now).getTime(),
      answered: rows.some((r) => r.kind === w.kind),
    };
  }

  const wouldHave = newestFirst.find((r) => r.would_have_without_pathways)?.would_have_without_pathways || '';
  const latestConfidence = newestFirst.find((r) => r.confidence)?.confidence || '';

  return {
    pilot_id: user.pilot_id || '',
    program_code: programCode || '',
    state: user.state || '',
    app_language: user.app_language || '',
    signup_week: signup ? isoWeek(signup) : '',
    days_since_signup: daysSince,
    stage_at_signup: signupRow.stage || '',
    confidence_at_signup: signupRow.confidence || '',
    latest_confidence: latestConfidence,
    // A later readiness answer than the sign-up one, for the before/after.
    confidence_later: numeric(newestFirst.find((r) => r.kind !== 'signup' && numeric(r.confidence))?.confidence),
    active_days: days.length,
    weeks_active: weeks.length,
    active_weeks: weeks,
    retention,
    mock_interviews: mocks.length,
    first_mock_days: firstMockDays,
    first_mock_score: firstMock ? Math.round(firstMock.overall_score) : null,
    latest_mock_score: latestMock ? Math.round(latestMock.overall_score) : null,
    civics_mastered: civicsMastered,
    first_yes: firstYes,
    passed_first_try: firstYes.passed_tests.startsWith('month_') && !retest,
    needed_retest: retest,
    would_have_without_pathways: wouldHave,
    check_ins: checkInsDue,
  };
}

const countBy = (list, key) => {
  const out = {};
  for (const s of list) {
    const k = key(s) || 'not_answered';
    out[k] = (out[k] || 0) + 1;
  }
  return out;
};
const avg = (nums) => (nums.length ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 10) / 10 : null);

// Every number on the dashboard, from the summaries (already filtered by
// program code).
export function pilotMetrics(summaries = []) {
  const n = summaries.length;
  const reached = (days) => summaries.filter((s) => s.days_since_signup >= days);

  const activationBase = reached(ACTIVATION_DAYS);
  const retention = {};
  for (const w of RETENTION_WEEKS) {
    const base = summaries.filter((s) => s.retention[`week_${w}`] !== null);
    retention[`week_${w}`] = { count: base.filter((s) => s.retention[`week_${w}`]).length, of: base.length };
  }

  const weekly = {};
  for (const s of summaries) for (const w of s.active_weeks) weekly[w] = (weekly[w] || 0) + 1;

  const withMocks = summaries.filter((s) => s.mock_interviews > 0);
  const withTwo = summaries.filter((s) => s.mock_interviews > 1);
  const both = summaries.filter((s) => numeric(s.confidence_at_signup) && s.confidence_later);

  const responses = {};
  for (const w of WINDOWS) {
    const due = summaries.filter((s) => s.check_ins[w.kind].due);
    responses[w.kind] = { count: due.filter((s) => s.check_ins[w.kind].answered).length, of: due.length };
  }

  const milestones = {};
  for (const m of MILESTONES) {
    const yes = summaries.filter((s) => s.first_yes[m].startsWith('month_'));
    milestones[m] = { count: yes.length, of: n, byWindow: countBy(yes, (s) => s.first_yes[m]) };
  }

  return {
    n,
    signups: { count: n, withCode: summaries.filter((s) => s.program_code).length },
    activation: { count: activationBase.filter((s) => s.first_mock_days !== null && s.first_mock_days <= ACTIVATION_DAYS).length, of: activationBase.length },
    weekly: Object.entries(weekly).sort(([a], [b]) => a.localeCompare(b)).map(([week, count]) => ({ week, count })),
    retention,
    practice: {
      mocks: summaries.reduce((t, s) => t + s.mock_interviews, 0),
      learnersWithMocks: withMocks.length,
      firstScore: avg(withTwo.map((s) => s.first_mock_score)),
      latestScore: avg(withTwo.map((s) => s.latest_mock_score)),
      scoreN: withTwo.length,
      civicsMastered: summaries.reduce((t, s) => t + s.civics_mastered, 0),
    },
    readiness: { n: both.length, signup: avg(both.map((s) => numeric(s.confidence_at_signup))), latest: avg(both.map((s) => s.confidence_later)) },
    responses,
    milestones,
    passedFirstTry: { count: summaries.filter((s) => s.passed_first_try).length, of: n },
    neededRetest: { count: summaries.filter((s) => s.needed_retest).length, of: n },
    wouldHave: countBy(summaries.filter((s) => s.would_have_without_pathways), (s) => s.would_have_without_pathways),
    reach: {
      state: countBy(summaries, (s) => s.state),
      language: countBy(summaries, (s) => s.app_language),
      stage: countBy(summaries, (s) => s.stage_at_signup),
    },
  };
}

export const formatCount = (count) => String(count);
export function formatShare(count, of) {
  const head = `${count} of ${of}`;
  return of ? `${head} (${Math.round((count / of) * 100)}%)` : head;
}

// CSV: one row per learner, pilot_id only, sign-up as an ISO week.
export const CSV_COLUMNS = [
  'pilot_id', 'program_code', 'state', 'app_language', 'signup_week', 'stage_at_signup',
  'confidence_at_signup', 'latest_confidence', 'active_days', 'weeks_active',
  'mock_interviews_completed', 'first_mock_score', 'latest_mock_score', 'civics_questions_mastered',
  ...MILESTONES.map((m) => `${m}_first_yes`),
  'would_have_without_pathways',
];

const cell = (v) => {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(summaries = []) {
  const lines = [CSV_COLUMNS.join(',')];
  for (const s of summaries) {
    const row = {
      ...s,
      mock_interviews_completed: s.mock_interviews,
      civics_questions_mastered: s.civics_mastered,
      ...Object.fromEntries(MILESTONES.map((m) => [`${m}_first_yes`, s.first_yes[m]])),
    };
    lines.push(CSV_COLUMNS.map((c) => cell(row[c])).join(','));
  }
  return `${lines.join('\n')}\n`;
}
