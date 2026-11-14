// Pilot check-ins (docs/AI-Policy-updated.md, "Pilot Check-ins"): when one is
// due, what to ask, and who gets a reminder email. Shared by the app
// (src/components/pilot/) and the pilot-reminders backend function, and
// tested from src/lib/pilotCheckIns.test.js. Plain JS with no imports so it
// runs both in Base44 functions and in Vitest.

export const normalizeEmail = (email) => (email || '').toLowerCase().trim();

// 3, 6 and 12 months after sign-up, each open for 30 days. A missed window
// is simply skipped; they never stack.
export const WINDOWS = [
  { kind: 'month_3', months: 3 },
  { kind: 'month_6', months: 6 },
  { kind: 'month_12', months: 12 },
];
export const OPEN_DAYS = 30;
export const PRE_INTERVIEW_GAP_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

export const MILESTONES = ['filed', 'interviewed', 'passed_tests', 'oath', 'registered_to_vote'];

export function addMonths(date, months) {
  const d = new Date(date);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

// Sign-up = the account's created date. For testing, an admin can pretend
// they signed up N months ago (User.pilot_test_months_ago); ignored for
// everyone else.
export function signupDate(user, now = new Date()) {
  const n = user?.pilot_test_months_ago;
  if (user?.role === 'admin' && Number.isInteger(n) && n >= 0 && n <= 24) return addMonths(now, -n);
  const created = user?.created_date ? new Date(user.created_date) : null;
  return created && !Number.isNaN(created.getTime()) ? created : null;
}

// The window open today, or null.
export function dueWindow(user, now = new Date()) {
  const start = signupDate(user, now);
  if (!start) return null;
  const t = new Date(now).getTime();
  for (const w of WINDOWS) {
    const opens = addMonths(start, w.months);
    opens.setHours(0, 0, 0, 0);
    if (t >= opens.getTime() && t < opens.getTime() + OPEN_DAYS * DAY) return w.kind;
  }
  return null;
}

// The check-in to show now: due, not answered yet, and not stopped.
export function openCheckIn({ user, rows = [], now = new Date() }) {
  if (!user || user.checkins_stopped) return null;
  const kind = dueWindow(user, now);
  if (!kind || rows.some((r) => r.kind === kind)) return null;
  return kind;
}

// Milestones the learner has already said "Yes" to (not asked again).
export function milestonesDone(rows = []) {
  const done = {};
  for (const m of MILESTONES) done[m] = rows.some((r) => r[m] === 'yes');
  return done;
}

const newest = (rows) => [...rows].sort((a, b) => String(b.created_date || '').localeCompare(String(a.created_date || '')));

export function latestStage(rows = []) {
  return newest(rows).find((r) => r.stage)?.stage || null;
}

// Ask "How ready do you feel?" once before a Mock Interview, when the latest
// stage is "interview scheduled" and they haven't answered or skipped it in
// the last 30 days.
export function shouldAskPreInterview({ rows = [], skippedAt = null, now = new Date() }) {
  if (latestStage(rows) !== 'interview_scheduled') return false;
  const t = new Date(now).getTime();
  const recent = (date) => date && t - new Date(date).getTime() < PRE_INTERVIEW_GAP_DAYS * DAY;
  if (recent(skippedAt)) return false;
  return !rows.some((r) => r.kind === 'pre_interview' && recent(r.created_date));
}

// Which questions the check-in screen shows, given the answers so far on
// the screen (`answers`) and earlier check-ins (`rows`).
export function checkInQuestions({ rows = [], answers = {} }) {
  const done = milestonesDone(rows);
  const yes = (m) => done[m] || answers[m] === 'yes';
  const ask = MILESTONES.filter((m) => !done[m] && (m !== 'registered_to_vote' || yes('oath')));
  const newYes = ask.some((m) => answers[m] === 'yes');
  return {
    done: MILESTONES.filter((m) => done[m]),
    ask,
    confidence: !yes('passed_tests'),
    wouldHave: newYes,
  };
}

const MILESTONE_CHOICES = {
  filed: ['yes', 'not_yet'],
  interviewed: ['yes', 'not_yet'],
  passed_tests: ['yes', 'retest', 'not_yet'],
  oath: ['yes', 'not_yet'],
  registered_to_vote: ['yes', 'not_yet'],
};
export const choicesFor = (field) => MILESTONE_CHOICES[field] || [];

// The answers → the OutcomeCheckIn to save (only questions that were shown
// and answered; only allowed choices). Null when nothing was answered.
export function buildCheckIn({ kind, rows = [], answers = {} }) {
  const q = checkInQuestions({ rows, answers });
  const out = {};
  for (const m of q.ask) {
    if ([...MILESTONE_CHOICES[m], 'prefer_not'].includes(answers[m])) out[m] = answers[m];
  }
  if (q.confidence && ['1', '2', '3', '4', '5', 'prefer_not'].includes(answers.confidence)) out.confidence = answers.confidence;
  if (q.wouldHave && ['yes', 'maybe', 'no', 'prefer_not'].includes(answers.would_have_without_pathways)) {
    out.would_have_without_pathways = answers.would_have_without_pathways;
  }
  return Object.keys(out).length ? { kind, ...out } : null;
}

// Reminder emails: learners who asked for them, with a check-in due today,
// not answered, check-ins not stopped, and no reminder sent for that window.
// Returns [{ email, kind, language }].
export function reminderPlan({ users = [], checkIns = [], reminders = [], now = new Date() }) {
  const plan = [];
  for (const user of users) {
    if (user.checkin_email_reminders !== true) continue;
    const email = normalizeEmail(user.email);
    if (!email) continue;
    const rows = checkIns.filter((r) => normalizeEmail(r.user_email) === email);
    const kind = openCheckIn({ user, rows, now });
    if (!kind) continue;
    if (reminders.some((r) => normalizeEmail(r.user_email) === email && r.kind === kind)) continue;
    plan.push({ email, kind, language: user.reminder_language || 'en' });
  }
  return plan;
}

// The email. It must not mention citizenship, immigration, the interview or
// USCIS: other people may see the inbox. {link} is the app's address.
export const REMINDER_SUBJECT = 'A quick question from Pathways';
export const REMINDER_BODY = 'Hi! You have a 1-minute question waiting in Pathways.\n\nOpen Pathways: {link}\n\nYou asked us to send this reminder. To stop, turn off reminders on your Profile page.';
export const reminderText = (template, link) => String(template).replace('{link}', link);
export const FORBIDDEN_EMAIL_WORDS = /citizen|immigra|interview|uscis|naturali|green card|n-400|oath|visa/i;
