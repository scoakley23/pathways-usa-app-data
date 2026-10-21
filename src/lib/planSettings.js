// The learner's plan settings and target date. Stored ONLY in this browser
// (CLAUDE.md: the target date never goes to Base44 or the AI). Every read and
// write is wrapped in try/catch so blocked storage just means "no plan yet".
import { DEFAULT_WEEKS } from './studyPlan';

// Same key the Progress page's date picker uses, so both stay in sync.
export const TARGET_DATE_KEY = 'pathways_target_date';
export const PLAN_KEY = 'pathways_plan'; // { mode: 'date'|'unknown'|'study', start }
export const DONE_KEY_PREFIX = 'pathways_done_'; // + yyyy-mm-dd -> [taskId]
export const LAST_VISIT_KEY = 'pathways_last_visit'; // yyyy-mm-dd

export const ymd = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const parseYmd = (s) => {
  const [y, m, d] = (s || '').split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d, 12) : null;
};

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* storage blocked */ } };
const del = (k) => { try { localStorage.removeItem(k); } catch (e) { /* storage blocked */ } };

// { mode, start: Date, target: Date|null } or null when there's no plan on
// this device (new device or cleared storage: ask again).
export function loadPlanSettings() {
  let plan = null;
  try { plan = JSON.parse(get(PLAN_KEY) || 'null'); } catch (e) { plan = null; }
  const target = parseYmd(get(TARGET_DATE_KEY));
  if (!plan || !['date', 'unknown', 'study'].includes(plan.mode)) {
    // A date set on the Progress page alone still counts as a plan.
    return target ? { mode: 'date', start: new Date(), target } : null;
  }
  return { mode: plan.mode, start: parseYmd(plan.start) || new Date(), target: plan.mode === 'study' ? null : target };
}

// choice: { mode: 'date', month: 'yyyy-mm' } | { mode: 'unknown' } | { mode: 'study' }
export function savePlanChoice(choice, today = new Date()) {
  const start = ymd(today);
  if (choice.mode === 'date') {
    const [y, m] = choice.month.split('-').map(Number);
    set(TARGET_DATE_KEY, ymd(new Date(y, m - 1, 15, 12))); // middle of the month
  } else if (choice.mode === 'unknown') {
    const t = new Date(today);
    t.setDate(t.getDate() + DEFAULT_WEEKS * 7);
    set(TARGET_DATE_KEY, ymd(t));
  } else {
    del(TARGET_DATE_KEY);
  }
  set(PLAN_KEY, JSON.stringify({ mode: choice.mode, start }));
  return loadPlanSettings();
}

export function loadDone(date) {
  try { return JSON.parse(get(DONE_KEY_PREFIX + ymd(date)) || '[]'); } catch (e) { return []; }
}
export function saveDone(date, ids) {
  set(DONE_KEY_PREFIX + ymd(date), JSON.stringify(ids));
}

// Missed days before today's first visit (0 if the learner came yesterday).
// Remembered for the rest of the day so reloading doesn't change the plan.
const MISSED_KEY = 'pathways_missed_today'; // { date, missed }
export function touchVisit(today = new Date()) {
  const todayStr = ymd(today);
  try {
    const saved = JSON.parse(get(MISSED_KEY) || 'null');
    if (saved && saved.date === todayStr) return saved.missed;
  } catch (e) { /* ignore */ }
  const last = parseYmd(get(LAST_VISIT_KEY));
  const missed = last ? Math.max(0, Math.round((parseYmd(todayStr) - last) / (24 * 60 * 60 * 1000)) - 1) : 0;
  set(LAST_VISIT_KEY, todayStr);
  set(MISSED_KEY, JSON.stringify({ date: todayStr, missed }));
  return missed;
}
