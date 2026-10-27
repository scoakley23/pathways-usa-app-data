// Pilot check-in reminder emails. Base44 can't run a daily job from this
// repo, so an admin presses "Send due reminders" (Admin → Pilot), weekly.
// Called from src/lib/pilotReminders.js.
//
// Actions (POST body { action, ... }):
//   send   { appUrl }  admins only: email every learner with a check-in due
//                      (rules in base44/shared/pilotCheckIns.js) → { sent, skipped, failed }
//                      Counts only, never who.
//   forget            any signed-in learner: delete their own CheckInReminder
//                      rows ("Delete all my data"; learners can't read them).
//
// CheckInReminder rows (email, kind, sent date) are admin-only. The email
// never mentions citizenship, immigration, the interview or USCIS.
import { createClientFromRequest } from "npm:@base44/sdk@0.8.56";
import {
  normalizeEmail,
  reminderPlan,
  reminderText,
  REMINDER_SUBJECT,
  REMINDER_BODY,
  FORBIDDEN_EMAIL_WORDS,
} from "../../shared/pilotCheckIns.js";

const fail = (error, status = 400) => Response.json({ error }, { status });

// The fixed email text in the learner's language, translated once per
// language per run. Falls back to English, and to English again if the
// translation slips in a word the email must not use.
async function textFor(base44, language, cache) {
  const english = { subject: REMINDER_SUBJECT, body: REMINDER_BODY };
  if (!language || language === "en") return english;
  if (cache[language]) return cache[language];
  let text = english;
  try {
    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `Translate the values of this JSON into the language with code "${language}". Keep the keys. Keep {link} exactly as written. Keep it short and friendly. Do not add anything.\n\n${JSON.stringify(english, null, 2)}`,
      response_json_schema: {
        type: "object",
        properties: { subject: { type: "string" }, body: { type: "string" } },
        required: ["subject", "body"],
      },
    });
    const ok = res && typeof res.subject === "string" && typeof res.body === "string" &&
      res.body.includes("{link}") &&
      !FORBIDDEN_EMAIL_WORDS.test(res.subject) && !FORBIDDEN_EMAIL_WORDS.test(res.body);
    if (ok) text = { subject: res.subject.slice(0, 120), body: res.body.slice(0, 1000) };
  } catch {
    // keep English
  }
  cache[language] = text;
  return text;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    const me = normalizeEmail(user?.email);
    if (!me) return fail("Please sign in first.", 401);

    const body = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;

    if (body.action === "forget") {
      await db.CheckInReminder.deleteMany({ user_email: me });
      return Response.json({ ok: true });
    }

    if (body.action !== "send") return fail("Unknown action.");
    if (user.role !== "admin") return fail("Not found.", 404);

    let appUrl = "";
    try {
      const u = new URL(String(body.appUrl || ""));
      if (u.protocol === "https:") appUrl = u.origin;
    } catch {
      appUrl = "";
    }
    if (!appUrl) return fail("Missing app address.");

    const users = await db.User.filter({ checkin_email_reminders: true }, null, 5000);
    const emails = users.map((u) => normalizeEmail(u.email)).filter(Boolean);
    if (emails.length === 0) return Response.json({ sent: 0, skipped: 0, failed: 0 });

    const [checkIns, reminders] = await Promise.all([
      db.OutcomeCheckIn.filter({ user_email: { $in: emails } }, null, 20000),
      db.CheckInReminder.filter({ user_email: { $in: emails } }, null, 20000),
    ]);
    const plan = reminderPlan({ users, checkIns, reminders, now: new Date() });

    const cache = {};
    let sent = 0;
    let failed = 0;
    for (const item of plan) {
      const text = await textFor(base44, item.language, cache);
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: item.email,
          subject: text.subject,
          body: reminderText(text.body, appUrl),
          from_name: "Pathways",
        });
        await db.CheckInReminder.create({
          user_email: item.email,
          kind: item.kind,
          sent_date: new Date().toISOString().slice(0, 10),
        });
        sent++;
      } catch (err) {
        console.error("pilot-reminders send error", err?.message || err);
        failed++;
      }
    }

    return Response.json({ sent, skipped: users.length - plan.length, failed });
  } catch (error) {
    console.error("pilot-reminders error", error);
    return fail("Something went wrong. Please try again.", 500);
  }
}
