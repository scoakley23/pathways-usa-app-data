// Pilot outcome questions (docs/AI-Policy-updated.md, "Pilot Check-ins").
// Pure helpers for the "Help us improve Pathways" screen and the Profile
// card. Every answer is optional and a fixed choice; nothing here takes free
// text. (Which partner program a learner studies with is separate: see
// src/lib/partners.js.)
import { US_STATES } from '@/config/pilot';

export const PREFER_NOT = 'prefer_not';
export const STAGES = ['not_filed', 'filed_waiting', 'interview_scheduled'];
export const CONFIDENCE = ['1', '2', '3', '4', '5'];
const STATE_CODES = US_STATES.map(([code]) => code);

// Getting started's device-only answer, used only to prefill the stage
// question; the learner can change it and nothing is sent until they save.
const FROM_ONBOARDING = { preparing: 'not_filed', applied: 'filed_waiting', interview: 'interview_scheduled' };
export const stageFromOnboarding = (stage) => FROM_ONBOARDING[stage] || '';

const pick = (value, allowed) => ([...allowed, PREFER_NOT].includes(value) ? value : null);

// State (the screen and the Profile card).
export function buildProfileAnswers({ state } = {}) {
  return { state: pick(state, STATE_CODES) };
}

// The answers on the screen → what to save. Unanswered questions are left
// out. Returns { checkIn, profile }; checkIn is null when no check-in
// question was answered.
export function buildSignupAnswers({ state, stage, confidence, reminders } = {}) {
  const profile = buildProfileAnswers({ state });

  const answers = {};
  const s = pick(stage, STAGES);
  const c = pick(confidence, CONFIDENCE);
  if (s) answers.stage = s;
  if (c) answers.confidence = c;

  return {
    checkIn: Object.keys(answers).length ? { kind: 'signup', ...answers } : null,
    profile: { ...profile, checkin_email_reminders: reminders === true, pilot_intro_seen: true },
  };
}

// Show the screen once, after the learner's first day:
// new learners finish Getting started and the quick check first.
export function shouldShowPilotIntro({ user, hasPlan = false }) {
  if (!user || user.pilot_intro_seen) return false;
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
  state: null,
  checkin_email_reminders: false,
  pilot_id: null,
  pilot_intro_seen: false,
};
