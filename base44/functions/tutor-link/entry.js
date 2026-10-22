// Every change to a tutor ↔ student link goes through here, so the app never
// writes TutorRelationship records itself. Called from src/lib/tutorLinks.js.
//
// Actions (POST body { action, ... }):
//   lookupCode { code }            → { tutor: { email, displayName } }
//   join       { code | tutorEmail } student joins a class → active link
//   request    { tutorEmail }      student asks a tutor   → pending link
//   invite     { studentEmail }    tutor invites a student → pending link
//   respond    { id, accept }      the other person accepts or declines
//   assign     { studentEmail, assignments } tutor sends practice to an
//              actively linked student → { count }
import { createClientFromRequest } from "npm:@base44/sdk@0.8.56";
import {
  normalizeEmail,
  findTutorByCode,
  canRespond,
  planJoin,
  hasActiveLink,
  cleanAssignment,
  MAX_ASSIGNMENTS,
} from "../../shared/tutorLinks.js";

const fail = (error, status = 400) => Response.json({ error }, { status });

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    let user = null;
    try { user = await base44.auth.me(); } catch { user = null; }
    const me = normalizeEmail(user?.email);
    if (!me) return fail("Please sign in first.", 401);

    const body = await req.json().catch(() => ({}));
    const db = base44.asServiceRole.entities;

    const tutorProfiles = () => db.PublicProfile.filter({ account_type: "tutor" }, "-created_date", 5000);
    const findLink = async (tutor, student) =>
      (await db.TutorRelationship.filter({ tutor_email: tutor, student_email: student }, null, 1))[0] || null;
    const tutorByEmail = async (email) =>
      (await db.PublicProfile.filter({ user_email: email, account_type: "tutor" }, null, 1))[0] || null;

    switch (body.action) {
      case "lookupCode": {
        const tutor = findTutorByCode(await tutorProfiles(), body.code);
        if (!tutor) return fail("Invalid invite code. Please check and try again.", 404);
        return Response.json({ tutor: { email: tutor.user_email, displayName: tutor.display_name || "" } });
      }

      case "join": {
        let tutorEmail = "";
        if (body.code) {
          const tutor = findTutorByCode(await tutorProfiles(), body.code);
          if (!tutor) return fail("Invalid invite code. Please check and try again.", 404);
          tutorEmail = normalizeEmail(tutor.user_email);
        } else {
          tutorEmail = normalizeEmail(body.tutorEmail);
          if (!tutorEmail || !(await tutorByEmail(tutorEmail))) return fail("We couldn't find that tutor.", 404);
        }
        if (tutorEmail === me) return fail("You cannot add yourself as a tutor.");

        const existing = await findLink(tutorEmail, me);
        const plan = planJoin(existing);
        if (plan === "none") return Response.json({ relationship: existing, already: true });
        const relationship = plan === "create"
          ? await db.TutorRelationship.create({ tutor_email: tutorEmail, student_email: me, status: "active", requested_by: me })
          : await db.TutorRelationship.update(existing.id, { status: "active" });
        return Response.json({ relationship: { ...existing, ...relationship, status: "active" } });
      }

      case "request": {
        const tutorEmail = normalizeEmail(body.tutorEmail);
        if (!tutorEmail) return fail("Enter your tutor's email.");
        if (tutorEmail === me) return fail("You cannot add yourself as a tutor.");
        if (await findLink(tutorEmail, me)) return fail("You are already connected with this tutor.", 409);
        const relationship = await db.TutorRelationship.create({
          tutor_email: tutorEmail, student_email: me, status: "pending", requested_by: me,
        });
        return Response.json({ relationship });
      }

      case "invite": {
        const studentEmail = normalizeEmail(body.studentEmail);
        if (!studentEmail) return fail("Enter your student's email.");
        if (studentEmail === me) return fail("You cannot add yourself as a student");
        if (!(await tutorByEmail(me))) return fail("Only tutors can invite students.", 403);
        if (await findLink(me, studentEmail)) return fail("Student already added", 409);
        const relationship = await db.TutorRelationship.create({
          tutor_email: me, student_email: studentEmail, status: "pending", requested_by: me,
        });
        return Response.json({ relationship });
      }

      case "respond": {
        const rel = body.id ? await db.TutorRelationship.get(body.id).catch(() => null) : null;
        if (!canRespond(rel, me)) return fail("You can't answer this request.", 403);
        const status = body.accept ? "active" : "rejected";
        await db.TutorRelationship.update(rel.id, { status });
        return Response.json({ relationship: { ...rel, status } });
      }

      case "assign": {
        const studentEmail = normalizeEmail(body.studentEmail);
        const link = studentEmail ? await findLink(me, studentEmail) : null;
        if (!link || !hasActiveLink([link], me, studentEmail)) {
          return fail("You can only send practice to your own active students.", 403);
        }
        const items = Array.isArray(body.assignments) ? body.assignments : [];
        if (items.length === 0 || items.length > MAX_ASSIGNMENTS) return fail("Choose between 1 and 200 items.");
        const cleaned = items.map(cleanAssignment);
        if (cleaned.some(a => !a)) return fail("Some items couldn't be assigned.");
        const assigned_date = new Date().toISOString();
        await db.Assignment.bulkCreate(cleaned.map(a => ({
          ...a, tutor_email: me, student_email: studentEmail, status: "pending", assigned_date,
        })));
        return Response.json({ count: cleaned.length });
      }

      default:
        return fail("Unknown action.");
    }
  } catch (error) {
    console.error("tutor-link error", error);
    return fail("Something went wrong. Please try again.", 500);
  }
}
