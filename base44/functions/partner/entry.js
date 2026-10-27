// Partner programs. Every ProgramMembership change goes through here, so a
// learner can't confirm themself and staff see only their own program's
// learners. Called from src/lib/partners.js.
//
// Actions (POST body { action, ... }):
//   list                         → { partners }  active programs (name, code)
//   join      { code, name?, share? } learner picks a program → { membership }
//   staff                        → { partners }  the programs this person works for
//   members   { code }           staff: who said they're with the program → { members }
//   setStatus { id, status }     staff: "confirmed" or "removed" (not ours)
import { createClientFromRequest } from "npm:@base44/sdk@0.8.56";
import {
  normalizeEmail,
  normalizeCode,
  findActivePartner,
  partnersForStaff,
  activePartners,
  planJoin,
  memberView,
  canManage,
} from "../../shared/partners.js";

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
    const allPartners = () => db.Partner.list("name", 500);

    switch (body.action) {
      case "list":
        return Response.json({ partners: activePartners(await allPartners()) });

      case "join": {
        const partner = findActivePartner(await allPartners(), body.code);
        if (!partner) return fail("We couldn't find that program.", 404);
        const existing = (await db.ProgramMembership.filter({ user_email: me }, "-created_date", 10))[0] || null;
        const fields = planJoin(existing, partner, { name: body.name, share: body.share });
        const membership = existing
          ? { ...existing, ...(await db.ProgramMembership.update(existing.id, fields)), ...fields }
          : await db.ProgramMembership.create({ user_email: me, ...fields });
        return Response.json({ membership });
      }

      case "staff":
        return Response.json({ partners: partnersForStaff(await allPartners(), me) });

      case "members": {
        const mine = partnersForStaff(await allPartners(), me);
        const partner = mine.find((p) => p.code === normalizeCode(body.code));
        if (!partner) return fail("This list is only for the program's staff.", 403);
        const rows = await db.ProgramMembership.filter({ partner_code: partner.code }, "-created_date", 5000);
        return Response.json({ members: rows.map(memberView) });
      }

      case "setStatus": {
        if (!["confirmed", "removed"].includes(body.status)) return fail("Unknown status.");
        const membership = body.id ? await db.ProgramMembership.get(body.id).catch(() => null) : null;
        if (!canManage(membership, partnersForStaff(await allPartners(), me))) {
          return fail("This list is only for the program's staff.", 403);
        }
        await db.ProgramMembership.update(membership.id, { status: body.status, status_changed_at: new Date().toISOString() });
        return Response.json({ member: memberView({ ...membership, status: body.status }) });
      }

      default:
        return fail("Unknown action.");
    }
  } catch (error) {
    console.error("partner error", error);
    return fail("Something went wrong. Please try again.", 500);
  }
}
