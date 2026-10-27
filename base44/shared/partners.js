// Partner programs: pure helpers shared by the `partner` backend function
// (base44/functions/partner) and tested from src/lib/partners.test.js.
//
// A learner says which partner program they study with (Getting started or
// Profile). That makes a pending ProgramMembership; the program's staff
// confirm it or mark it "not ours". Staff see the optional name the learner
// gave (or their email), never their answers, chats or pilot check-ins.

export const STATUSES = ["pending", "confirmed", "removed"];
export const MAX_NAME_LENGTH = 60;

export const normalizeEmail = (email) => String(email || "").toLowerCase().trim();
export const normalizeCode = (code) => String(code || "").trim().toUpperCase().replace(/\s+/g, "-").slice(0, 40);

// What learners may know about a partner: never the staff list.
export const publicPartner = (p) => ({ code: normalizeCode(p.code), name: p.name || "", shareLearners: p.share_learners === true });

export const activePartners = (partners = []) =>
  partners.filter((p) => p.active !== false && normalizeCode(p.code) && p.name).map(publicPartner);

export const findActivePartner = (partners, code) =>
  activePartners(partners).find((p) => p.code === normalizeCode(code)) || null;

const staffOf = (p) => (Array.isArray(p.staff_emails) ? p.staff_emails : []).map(normalizeEmail).filter(Boolean);

// The partner programs this person works for.
export const partnersForStaff = (partners = [], email) => {
  const me = normalizeEmail(email);
  return me ? activePartners(partners.filter((p) => staffOf(p).includes(me))) : [];
};

// The optional name a learner gives their program: a name only, so nothing
// that looks like an email address or a case or phone number.
export function cleanName(name) {
  const s = String(name || "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME_LENGTH);
  if (!s || s.includes("@") || /\d{3,}/.test(s)) return "";
  return s;
}

// A learner picks (or re-picks) a program. Returns the fields to save.
// Same program as before: keep its status, unless the program said "not ours"
// (then it asks them again). A different program starts over as pending.
// Sharing their own progress is possible only where the program has it on.
export function planJoin(existing, partner, { name, share } = {}) {
  const same = existing && normalizeCode(existing.partner_code) === partner.code;
  const status = same && existing.status !== "removed" ? existing.status : "pending";
  return {
    partner_code: partner.code,
    status,
    display_name: cleanName(name),
    share_progress: partner.shareLearners && share === true,
    ...(same && status === existing.status ? {} : { status_changed_at: new Date().toISOString() }),
  };
}

// What staff see in the confirm list.
export const memberView = (m) => ({
  id: m.id,
  name: m.display_name || normalizeEmail(m.user_email),
  status: STATUSES.includes(m.status) ? m.status : "pending",
  since: m.created_date || null,
});

export const canManage = (membership, staffPartners = []) =>
  !!membership && staffPartners.some((p) => p.code === normalizeCode(membership.partner_code));
