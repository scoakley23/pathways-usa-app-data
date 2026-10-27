import { base44 } from '@/api/base44Client';

// Partner programs (base44/functions/partner). Learners say which program
// they study with; the program's staff confirm it on /Partner. The app never
// writes ProgramMembership itself, except that a learner may delete their own
// (leaving the program). The share link lives in src/lib/programLink.js.

async function invoke(payload) {
  try {
    const res = await base44.functions.invoke('partner', payload);
    return res.data;
  } catch (err) {
    const message = err?.response?.data?.error || 'Something went wrong. Please try again.';
    const error = new Error(message);
    error.status = err?.response?.status;
    throw error;
  }
}

// [{ code, name, shareLearners }]
export const listPartners = () => invoke({ action: 'list' }).then((r) => r.partners || []);
export const joinProgram = (code, { name, share } = {}) =>
  invoke({ action: 'join', code, name, share }).then((r) => r.membership);
export const staffPrograms = () => invoke({ action: 'staff' }).then((r) => r.partners || []);
export const programMembers = (code) => invoke({ action: 'members', code }).then((r) => r.members || []);
export const setMemberStatus = (id, status) => invoke({ action: 'setStatus', id, status }).then((r) => r.member);

const emailOf = (user) => (user?.email || '').toLowerCase().trim();
export async function loadMembership(user) {
  const email = emailOf(user);
  if (!email) return null;
  const rows = await base44.entities.ProgramMembership.filter({ user_email: email }, '-created_date', 10);
  return rows[0] || null;
}
export async function leaveProgram(user) {
  const email = emailOf(user);
  if (!email) return;
  const rows = await base44.entities.ProgramMembership.filter({ user_email: email }, null, 10);
  await Promise.all(rows.map((r) => base44.entities.ProgramMembership.delete(r.id)));
}
