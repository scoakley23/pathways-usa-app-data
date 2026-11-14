import { base44 } from '@/api/base44Client';
import { AUTH_PROVIDER } from '@/api/auth';
import { supabasePrograms } from '@/api/programs';
import { getSupabase } from '@/api/supabaseClient';

// Partner programs (base44/functions/partner). Learners say which program
// they study with; the program's staff confirm it on /Partner. The app never
// writes ProgramMembership itself, except that a learner may delete their own
// (leaving the program). The share link lives in src/lib/programLink.js.

// Program fields (pure, no SDK) live in src/lib/partnerFields.js.
export { MAX_NAME_LENGTH, SKILLS, LEVELS, normalizeEmail, normalizeCode } from './partnerFields';

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

// With Supabase sign-in on (src/api/auth.js), picking and joining a program
// and "is this email on a staff list?" use Supabase's functions; the rest
// moves in Step 3.
const onSupabase = AUTH_PROVIDER === 'supabase';
const sb = onSupabase ? supabasePrograms(getSupabase) : null;
const friendly = (promise) => promise.catch((err) => {
  const error = new Error(err?.code === 'P0002' ? 'We could not find that program.' : 'Something went wrong. Please try again.');
  error.status = err?.status;
  throw error;
});

// [{ code, name, shareLearners }]
export const listPartners = () => (onSupabase ? friendly(sb.list()) : invoke({ action: 'list' }).then((r) => r.partners || []));
export const joinProgram = (code, { name, share } = {}) => (onSupabase
  ? friendly(sb.join(code, { name, share }))
  : invoke({ action: 'join', code, name, share }).then((r) => r.membership));
export const staffPrograms = () => (onSupabase ? friendly(sb.staff()) : invoke({ action: 'staff' }).then((r) => r.partners || []));
export const programMembers = (code) => invoke({ action: 'members', code }).then((r) => r.members || []);
// { totals, learners } over the program's confirmed learners (staff only).
export const programSummaryFor = (code) => invoke({ action: 'summary', code });
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