// Pilot check-in reminder emails on Supabase (`pilot-reminders` Edge
// Function). The "who is due" rules are reminderPlan() in pilotCheckIns.js,
// shared with Base44; this file turns Supabase rows (keyed by user_id) into
// what it expects and picks each email's text. Pure: no network.
import { FORBIDDEN_EMAIL_WORDS, REMINDER_BODY, REMINDER_SUBJECT, normalizeEmail, reminderPlan } from './pilotCheckIns.js';
import { REMINDER_TEXTS } from './reminderTexts.generated.js';

// authUsers: [{ id, email, created_at, app_metadata: { role } }];
// profiles: [{ user_id, checkin_email_reminders, reminder_language,
//   checkins_stopped, pilot_test_months_ago }]; checkIns / reminders:
// [{ user_id, kind, created_at? }] → [{ user_id, email, kind, language }].
export function duePlan({ authUsers = [], profiles = [], checkIns = [], reminders = [], now = new Date() }) {
  const byId = new Map(authUsers.map((u) => [u.id, u]));
  const emailOf = (id) => normalizeEmail(byId.get(id)?.email);
  const users = profiles
    .filter((p) => p.checkin_email_reminders === true && emailOf(p.user_id))
    .map((p) => {
      const u = byId.get(p.user_id);
      return {
        email: emailOf(p.user_id),
        role: u.app_metadata?.role === 'admin' ? 'admin' : 'user',
        created_date: u.created_at,
        checkin_email_reminders: true,
        reminder_language: p.reminder_language,
        checkins_stopped: !!p.checkins_stopped,
        pilot_test_months_ago: p.pilot_test_months_ago,
      };
    });
  const withEmail = (rows) => rows.map((r) => ({ ...r, user_email: emailOf(r.user_id), created_date: r.created_at })).filter((r) => r.user_email);
  const idOf = new Map(profiles.map((p) => [emailOf(p.user_id), p.user_id]));
  return reminderPlan({ users, checkIns: withEmail(checkIns), reminders: withEmail(reminders), now })
    .map((item) => ({ user_id: idOf.get(item.email), ...item }));
}

// The email's subject and body in `language`: the translation pack's copy
// (reviewed wins; built by scripts/supabase/build-reminder-texts.mjs), used
// only when it keeps {link} and none of the forbidden words; otherwise English.
export function reminderTextFor(language, texts = REMINDER_TEXTS) {
  const t = texts[language];
  const ok = t && typeof t.subject === 'string' && typeof t.body === 'string' && t.body.includes('{link}') &&
    !FORBIDDEN_EMAIL_WORDS.test(t.subject) && !FORBIDDEN_EMAIL_WORDS.test(t.body);
  return ok ? { subject: t.subject.slice(0, 120), body: t.body.slice(0, 1000) } : { subject: REMINDER_SUBJECT, body: REMINDER_BODY };
}

// The app address the email links to: https origins only.
export function appOrigin(value) {
  try {
    const u = new URL(String(value || ''));
    return u.protocol === 'https:' ? u.origin : '';
  } catch (e) {
    return '';
  }
}
