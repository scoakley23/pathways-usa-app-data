// How the Today card is laid out (Phase 3, "X2"): pure helpers, no storage.
import { weeksLeft } from './studyPlan';

// Getting started stage (device only, src/lib/onboarding.js) → label key in
// todayStrings.js. No stage (skipped) → no label.
const STAGE_KEYS = {
  preparing: 'stage_preparing',
  applied: 'stage_applied',
  interview: 'stage_interview',
  learning: 'stage_learning',
};
export const stageKey = (stage) => STAGE_KEYS[stage] || null;

// The top card is the first task not done yet; every other task goes under
// "Also today", in plan order. All done → no top task.
export function splitTasks(tasks = [], done = []) {
  const top = tasks.find((task) => !done.includes(task.id)) || null;
  return { top, rest: tasks.filter((task) => task !== top) };
}

// "About N weeks" only when the learner chose an interview month (the target
// date stays on the device). Open-ended plans show nothing.
export function weeksToInterview(plan, today) {
  if (!plan || plan.mode !== 'date' || !plan.target) return null;
  return weeksLeft(today, plan.target);
}

// First word of the sign-in name, for "Good evening, Ana." Shown on screen
// only; never sent to translation or the AI. '' when there is none.
export function firstName(user) {
  const name = typeof user?.full_name === 'string' ? user.full_name.trim() : '';
  if (!name || name.includes('@')) return '';
  return name.split(/\s+/)[0].slice(0, 30);
}

export const timeOfDay = (d) => (d.getHours() < 12 ? 'morning' : d.getHours() < 18 ? 'afternoon' : 'evening');

// Monday-first index (0–6) of the days practiced this week, for the row of
// squares. `dayIndexes` are whole-day numbers (studyPlan.dayIndex).
export function weekSquares(dayIndexes, todayIndex, todayWeekday) {
  const monday = todayIndex - ((todayWeekday + 6) % 7);
  const filled = new Set();
  for (const i of dayIndexes) if (i >= monday && i <= todayIndex) filled.add(i - monday);
  return Array.from({ length: 7 }, (_, k) => ({ filled: filled.has(k), today: k === todayIndex - monday }));
}
