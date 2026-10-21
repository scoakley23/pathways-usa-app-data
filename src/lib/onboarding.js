// "Getting started": the questions before the first quick check. Answers
// stay on this device (like the target date). Only the tutor picture is
// saved to the account (User.tutor_profile, as before). We never ask for
// dates, case numbers, or anything else about the learner's case.

export const ONBOARDED_KEY = 'pathways_onboarded'; // '1' once finished or skipped
export const STAGE_KEY = 'pathways_stage';
export const CIVICS_VERSION_KEY = 'civicsVersion'; // shared with Practice

// Where the learner is, in broad strokes. Used to choose the civics test and
// whether to ask for an interview month.
export const STAGES = ['preparing', 'applied', 'interview', 'learning'];

// Did they send Form N-400 before October 20, 2025? (USCIS rule for which
// civics test applies.) 'unsure' starts with the 2025 test.
export const FILED_ANSWERS = { before: '2008', after: '2025', unsure: '2025' };

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

export const isOnboarded = () => get(ONBOARDED_KEY) === '1';
export const markOnboarded = () => set(ONBOARDED_KEY, '1');

export function loadStage() {
  const v = get(STAGE_KEY);
  return STAGES.includes(v) ? v : null;
}
export function saveStage(stage) {
  if (STAGES.includes(stage)) set(STAGE_KEY, stage);
}

export function saveFiledAnswer(answer) {
  const version = FILED_ANSWERS[answer];
  if (version) set(CIVICS_VERSION_KEY, version);
  return version || null;
}

// The steps, in order, given the answers so far. The "which test" question
// only makes sense once they have applied; the interview month only once an
// interview is scheduled.
export function onboardingSteps({ stage } = {}) {
  const steps = ['start', 'language', 'tutor', 'stage'];
  if (stage === 'applied' || stage === 'interview') steps.push('filed');
  if (stage === 'interview') steps.push('interview');
  steps.push('settings');
  return steps;
}

// The step after `current` (null when done).
export function nextStep(current, answers) {
  const steps = onboardingSteps(answers);
  const i = steps.indexOf(current);
  return i >= 0 && i < steps.length - 1 ? steps[i + 1] : null;
}
