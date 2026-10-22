// Rules for tutor ↔ student links, shared by the backend functions
// (base44/functions/*) and tested from src/lib/tutorLinks.test.js.
// Plain JS with no imports so it runs both in Base44 functions and in Vitest.

export const normalizeEmail = (email) => (email || '').toLowerCase().trim();

// Invite codes are typed by hand: ignore spaces and case, and accept O/0 swaps.
export function codeVariants(code) {
  const clean = String(code || '').replace(/\s+/g, '').toUpperCase();
  if (!clean) return [];
  return [...new Set([clean, clean.replace(/0/g, 'O'), clean.replace(/O/g, '0')])];
}

export function findTutorByCode(profiles, code) {
  const variants = codeVariants(code);
  if (variants.length === 0) return null;
  return profiles.find(p =>
    p.account_type === 'tutor' &&
    p.invite_code &&
    variants.includes(String(p.invite_code).toUpperCase())
  ) || null;
}

// Who sent the request. Older links only have created_by.
export const requesterOf = (rel) => normalizeEmail(rel.requested_by || rel.created_by);

// Only the person who did NOT send a pending request may accept or decline it.
// Old links with no recorded sender can only be answered by the student, so a
// tutor can never approve their own access to a learner.
export function canRespond(rel, me) {
  const email = normalizeEmail(me);
  if (!rel || rel.status !== 'pending') return false;
  const student = normalizeEmail(rel.student_email);
  const tutor = normalizeEmail(rel.tutor_email);
  if (email !== student && email !== tutor) return false;
  const requester = requesterOf(rel);
  if (!requester) return email === student;
  return requester !== email;
}

// A student joining a tutor's class (invite code, or a confirmed invite link).
export function planJoin(existing) {
  if (!existing) return 'create';
  return existing.status === 'active' ? 'none' : 'activate';
}

// The tutor may see a student's progress only through an active link.
export function hasActiveLink(rels, tutorEmail, studentEmail) {
  const tutor = normalizeEmail(tutorEmail);
  const student = normalizeEmail(studentEmail);
  return rels.some(r =>
    r.status === 'active' &&
    normalizeEmail(r.tutor_email) === tutor &&
    normalizeEmail(r.student_email) === student
  );
}

// Assignments a tutor sends: keep only the content fields. Who it is from and
// to, the status and the date are set by the server, never by the request.
const CONTENT_TYPES = ['sentence', 'vocabulary', 'civics_question', 'custom'];
const CUSTOM_TYPES = ['sentence', 'vocabulary', 'civics_question'];
export const MAX_ASSIGNMENTS = 200;

export function cleanAssignment(item) {
  if (!item || !CONTENT_TYPES.includes(item.content_type)) return null;
  const out = { content_type: item.content_type };
  if (item.content_id != null) out.content_id = String(item.content_id);
  if (item.content_type === 'custom') {
    if (!CUSTOM_TYPES.includes(item.custom_type)) return null;
    out.custom_type = item.custom_type;
    if (item.custom_content != null) out.custom_content = String(item.custom_content);
    if (item.custom_data && typeof item.custom_data === 'object' && !Array.isArray(item.custom_data)) {
      out.custom_data = item.custom_data;
    }
  } else if (!out.content_id) {
    return null;
  }
  return out;
}
