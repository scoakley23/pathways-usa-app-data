// Partner programs, for screens. Learners say which program they study with;
// the program's staff confirm it on /Partner. The app never writes
// ProgramMembership itself, except that a learner may delete their own
// (leaving the program). The share link lives in src/lib/programLink.js.
//
// The data calls live in src/api/partners.js (Base44's `partner` function
// when the switch is off, Supabase's functions when it is on).
import { partnersApi } from '@/api/partners';

// Program fields (pure, no SDK) live in src/lib/partnerFields.js.
export { MAX_NAME_LENGTH, SKILLS, LEVELS, normalizeEmail, normalizeCode } from './partnerFields';

// [{ code, name, shareLearners }]
export const listPartners = () => partnersApi.list();
export const joinProgram = (code, { name, share } = {}) => partnersApi.join(code, { name, share });
export const staffPrograms = () => partnersApi.staffPrograms();
export const programMembers = (code) => partnersApi.members(code);
// { totals, learners } over the program's confirmed learners (staff only).
export const programSummaryFor = (code) => partnersApi.summary(code);
// Staff: `member` is a row from programMembers(code).
export const setMemberStatus = (code, member, status) => partnersApi.setStatus(code, member, status);

export async function loadMembership(user) {
  if (!user?.email) return null;
  return partnersApi.myMembership();
}
export async function leaveProgram(user) {
  if (!user?.email) return;
  await partnersApi.leave();
}
