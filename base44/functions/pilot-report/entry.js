// Pilot dashboard data (/admin/pilot). Admins only: anyone else gets 404.
// Reads the pilot learners' records with admin rights and returns one
// summary per learner keyed by pilot_id (base44/shared/pilotReport.js).
// Emails, names and account ids never leave this function.
// Called from src/components/pilot-admin/PilotDashboard.jsx.
//
// POST {} → { summaries, generated_at }
import { createClientFromRequest } from "npm:@base44/sdk@0.8.56";
import { normalizeEmail } from "../../shared/pilotCheckIns.js";
import { learnerSummary } from "../../shared/pilotReport.js";

const newPilotId = () => crypto.randomUUID();

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    if (!user || user.role !== "admin") return Response.json({ error: "Not found." }, { status: 404 });

    const db = base44.asServiceRole.entities;
    // Learners = student profiles. Tutors and admins are left out.
    const profiles = await db.PublicProfile.filter({ account_type: "student" }, null, 5000);
    const emails = [...new Set(profiles.map((p) => normalizeEmail(p.user_email)).filter(Boolean))];
    if (emails.length === 0) return Response.json({ summaries: [], generated_at: new Date().toISOString() });

    const [users, checkIns, activity, sessions, mastered, civics2025] = await Promise.all([
      db.User.filter({ email: { $in: emails } }, null, 5000),
      db.OutcomeCheckIn.filter({ user_email: { $in: emails } }, null, 20000),
      db.ActivityDay.filter({ user_email: { $in: emails } }, null, 50000),
      db.InterviewSession.filter({ user_email: { $in: emails } }, null, 20000),
      db.UserProgress.filter({ user_email: { $in: emails }, content_type: "civics_question", status: "mastered" }, null, 50000),
      db.CivicsQuestion.filter({ version: "2025" }, null, 500),
    ]);
    const civicsIds = new Set(civics2025.map((q) => q.id));
    const mine = (rows, email) => rows.filter((r) => normalizeEmail(r.user_email) === email);
    const now = new Date();

    const summaries = [];
    for (const u of users) {
      const email = normalizeEmail(u.email);
      if (!emails.includes(email) || u.role === "admin") continue;
      // pilot_id is normally made on the learner's first visit; make it here
      // for anyone who hasn't been back since.
      let pilotId = u.pilot_id;
      if (!pilotId) {
        pilotId = newPilotId();
        await db.User.update(u.id, { pilot_id: pilotId });
      }
      summaries.push(learnerSummary({
        user: { ...u, pilot_id: pilotId },
        checkIns: mine(checkIns, email),
        activityDates: mine(activity, email).map((r) => r.date),
        sessions: mine(sessions, email),
        civicsMastered: mine(mastered, email).filter((p) => civicsIds.has(p.content_id)).length,
        now,
      }));
    }

    return Response.json({ summaries, generated_at: now.toISOString() });
  } catch (error) {
    console.error("pilot-report error", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
