// A tutor's view of their students' progress (My Classroom). Returns records
// only for students with an active link to the signed-in tutor; anyone else
// in the request is left out. Called from src/lib/tutorLinks.js.
//
// POST { studentEmails: string[] } →
//   { students: { [email]: { userProgress, lessonProgress, n400Progress } } }
import { createClientFromRequest } from "npm:@base44/sdk@0.8.56";
import { normalizeEmail, hasActiveLink } from "../../shared/tutorLinks.js";

const MAX_STUDENTS = 100;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    const me = normalizeEmail(user?.email);
    if (!me) return Response.json({ error: "Please sign in first." }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const requested = [...new Set((body.studentEmails || []).map(normalizeEmail).filter(Boolean))]
      .slice(0, MAX_STUDENTS);

    const db = base44.asServiceRole.entities;
    const links = await db.TutorRelationship.filter({ tutor_email: me, status: "active" }, null, 1000);
    const allowed = requested.filter(email => hasActiveLink(links, me, email));

    const students = {};
    await Promise.all(allowed.map(async (email) => {
      const [userProgress, lessonProgress, n400Progress] = await Promise.all([
        db.UserProgress.filter({ user_email: email }, "-last_practiced", 1000),
        db.LessonProgress.filter({ user_email: email }, null, 500),
        db.N400SectionProgress.filter({ user_email: email }, null, 200),
      ]);
      students[email] = { userProgress, lessonProgress, n400Progress };
    }));

    return Response.json({ students });
  } catch (error) {
    console.error("student-progress error", error);
    return Response.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
