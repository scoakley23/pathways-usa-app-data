// Pilot outcome questions (docs/AI-Policy-updated.md, "Pilot Check-ins").
// Pure helpers for the "Help us improve Pathways" screen and the Profile
// card. Every answer is optional and a fixed choice; nothing here takes free
// text except the program code, which must match ALLOWED_PROGRAM_CODES.
import { ALLOWED_PROGRAM_CODES, US_STATES } from '@/config/pilot';

export const PREFER_NOT = 'prefer_not';
export const STAGES = ['not_filed', 'filed_waiting', 'interview_scheduled'];
export const CONFIDENCE = ['1', '2', '3', '4', '5'];
const STATE_CODES = US_STATES.map(([code]) => code);

// A code from a partner link waits here (device only) until the learner sees
// the screen, so it survives the sign-in redirect.
export const PENDING_CODE_KEY = 'pathways_program_code';

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };
const remove = (k) => { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } };

export function normalizeProgramCode(code) {
  return String(code || '').trim().toUpperCase().replace(/\s+/g, '-').slice(0, 40);
}

export function isAllowedProgramCode(code, allowed = ALLOWED_PROGRAM_CODES) {
  const c = normalizeProgramCode(code);
  return !!c && allowed.map(normalizeProgramCode).includes(c);
}

// ?code=XXXX on any link. Only known program codes are kept, so a sign-in
// provider's own ?code= is never mistaken for one. Returns the code it kept.
export function rememberCodeFromUrl(search) {
  const code = normalizeProgramCode(new URLSearchParams(search || '').get('code'));
  if (!isAllowedProgramCode(code)) return null;
  set(PENDING_CODE_KEY, code);
  return code;
}
export const loadPendingCode = () => get(PENDING_CODE_KEY) || '';
export const clearPendingCode = () => remove(PENDING_CODE_KEY);

// Getting started's device-only answer, used only to prefill the stage
// question; the learner can change it and nothing is sent until they save.
const FROM_ONBOARDING = { preparing: 'not_filed', applied: 'filed_waiting', interview: 'interview_scheduled' };
export const stageFromOnboarding = (stage) => FROM_ONBOARDING[stage] || '';

const pick = (value, allowed) => ([...allowed, PREFER_NOT].includes(value) ? value : null);

// State and program code (the screen and the Profile card). Returns
// { profile, error }; `error` is 'unknown_code' for a code we don't know.
export function buildProfileAnswers({ programCode, state } = {}) {
  const code = normalizeProgramCode(programCode);
  if (code && !isAllowedProgramCode(code)) return { profile: null, error: 'unknown_code' };
  return { profile: { program_code: code || null, state: pick(state, STATE_CODES) }, error: null };
}

// The answers on the screen → what to save. Unanswered questions are left
// out. Returns { checkIn, profile, error }; checkIn is null when no check-in
// question was answered.
export function buildSignupAnswers({ programCode, state, stage, confidence, reminders } = {}) {
  const { profile, error } = buildProfileAnswers({ programCode, state });
  if (error) return { checkIn: null, profile: null, error };

  const answers = {};
  const s = pick(stage, STAGES);
  const c = pick(confidence, CONFIDENCE);
  if (s) answers.stage = s;
  if (c) answers.confidence = c;

  return {
    checkIn: Object.keys(answers).length ? { kind: 'signup', ...answers } : null,
    profile: { ...profile, checkin_email_reminders: reminders === true, pilot_intro_seen: true },
    error: null,
  };
}

// Show the screen once, to learners (not tutors), after their first day:
// new learners finish Getting started and the quick check first.
export function shouldShowPilotIntro({ user, role, hasPlan = false }) {
  if (!user || role === 'tutor' || user.pilot_intro_seen) return false;
  return !!(user.skill_levels || hasPlan);
}

export function newPilotId() {
  try {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch (e) {
    // fall through
  }
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// What "Delete all my data" puts back on the account.
export const PILOT_ACCOUNT_RESET = {
  program_code: null,
  state: null,
  checkin_email_reminders: false,
  pilot_id: null,
  pilot_intro_seen: false,
};
