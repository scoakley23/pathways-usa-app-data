// How the Today card is laid out: pure helpers (practiceDaysThisWeek reads
// Today's checkmarks from this device unless given `doneOn`).
import { weeksLeft, dayIndex } from './studyPlan';
import { loadDone } from './planSettings';

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

// The five stops on Today's road, each 'done' | 'current' | 'later'. `done`
// is useRoadmapProgress's { [stopId]: bool }, `currentId` its current stop
// (the first stop not done). A learner on their first day starts at stop 1
// with nothing done.
export function roadStates(stopIds = [], done = {}, currentId, firstDay = false) {
  return stopIds.map((id) => {
    if (firstDay) return id === stopIds[0] ? 'current' : 'later';
    if (id === currentId) return 'current';
    return done[id] ? 'done' : 'later';
  });
}

// Days practiced this week (Monday–Sunday, as whole-day numbers) from saved
// progress dates and the checkmarks on this device (Today's plan).
export function practiceDaysThisWeek(dates = [], today = new Date(), doneOn = loadDone) {
  const t = dayIndex(today);
  const monday = t - ((today.getDay() + 6) % 7);
  const days = new Set();
  for (const d of dates) {
    if (!d) continue;
    const i = dayIndex(new Date(d));
    if (i >= monday && i <= t) days.add(i);
  }
  for (let i = monday; i <= t; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - (t - i));
    if (doneOn(date).length) days.add(i);
  }
  return days;
}

// The week strip on Progress: seven circles, Monday first, each 'practiced',
// 'today', 'future' or 'missed' (a past day with no practice). Today is
// 'today' whether or not it was practiced yet (`todayPracticed` says).
export function weekCircles(dayIndexes, todayIndex, todayWeekday) {
  return weekSquares(dayIndexes, todayIndex, todayWeekday).map((sq, k, all) => {
    const todayAt = all.findIndex((x) => x.today);
    if (sq.today) return { state: 'today', practiced: sq.filled };
    if (k > todayAt) return { state: 'future', practiced: false };
    return { state: sq.filled ? 'practiced' : 'missed', practiced: sq.filled };
  });
}

// One line of status per road stop on Progress, from useRoadmapProgress's
// counts (existing data only). `done` = the stop's done flag.
export function stopStatus(id, counts, done) {
  if (!counts) return '';
  if (id === 1) return done ? 'Done · 20 or more sentences mastered' : `${Math.min(counts.masteredSentences, 20)} of 20 sentences mastered`;
  if (id === 2) {
    const need = Math.ceil(counts.lessonsTotal / 2);
    return done ? `Done · ${counts.lessonsDone} of ${counts.lessonsTotal} lessons finished` : `${counts.lessonsDone} of ${need} lessons finished with 70% or more`;
  }
  if (id === 3) return done ? 'Done · you passed a mock interview' : 'Pass one mock interview';
  if (id === 4) return 'Practice the whole interview (nothing is saved)';
  return 'The finish line';
}
