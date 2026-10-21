// Study plan (Prompt 5): pure functions that turn the learner's skill levels
// and weeks left into a few short tasks a day. Nothing here touches storage;
// the target date itself lives only on the device (see planSettings.js).

export const DEFAULT_WEEKS = 12; // "I don't know yet"
const DAY = 24 * 60 * 60 * 1000;

// Task kinds, how long each takes, and where it opens.
export const TASKS = {
  'civics-learn': { minutes: 4, href: '/learn', label: 'Learn 2 new civics questions', es: 'Aprender 2 preguntas nuevas de educación cívica' },
  'civics-review': { minutes: 3, href: '/review', label: 'Quick review of civics questions', es: 'Repaso rápido de educación cívica' },
  reading: { minutes: 3, href: '/Practice?mode=reading', label: 'Read sentences out loud', es: 'Leer oraciones en voz alta' },
  writing: { minutes: 3, href: '/Practice?mode=dictation', label: 'Write sentences you hear', es: 'Escribir oraciones que escucha' },
  speaking: { minutes: 5, href: '/Practice?mode=interview', label: 'Practice interview questions', es: 'Practicar preguntas de la entrevista' },
  n400: { minutes: 5, href: '/n400-coach', label: 'N-400 Guide', es: 'Guía del N-400' },
};

export const SKILLS = ['civics', 'reading', 'writing', 'speaking'];

// How much practice each level gets (relative). Strong skills still get
// spaced review, just less often.
const WEIGHT = { start_here: 3, getting_there: 2, strong: 1 };
const weightFor = (level) => WEIGHT[level] ?? 2; // not checked yet = middle

// Whole local days between two dates (date-only, time of day ignored).
export function dayIndex(date) {
  const d = new Date(date);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY);
}

export function daysBetween(from, to) {
  return dayIndex(to) - dayIndex(from);
}

// Weeks left until the target (null = open-ended "just let me study").
export function weeksLeft(today, target) {
  if (!target) return null;
  return Math.max(0, Math.ceil(daysBetween(today, target) / 7));
}

// How many tasks today: 3–5, about 15 minutes. Fewer after missed days
// (welcome back, never guilt), a little more when the date is close.
export function taskCount({ weeks, missedDays = 0 }) {
  if (missedDays > 0) return 3;
  if (weeks !== null && weeks !== undefined && weeks <= 4) return 5;
  return 4;
}

// Which N-400 section is "this week's", in form order. Sections the learner
// already completed are skipped; more than one per week when time is short.
export function n400ForWeek({ sections, completed = [], weekNumber, weeks }) {
  const remaining = sections.filter((id) => !completed.includes(id));
  if (remaining.length === 0) return null;
  const perWeek = weeks ? Math.max(1, Math.ceil(remaining.length / Math.max(1, weeks))) : 1;
  return remaining[Math.min(remaining.length - 1, Math.max(0, weekNumber) * perWeek)] ?? remaining[0];
}

function civicsTask(levels, day) {
  // Strong civics: mostly review. Otherwise alternate learning and review.
  if (levels.civics === 'strong') return day % 3 === 0 ? 'civics-learn' : 'civics-review';
  return day % 2 === 0 ? 'civics-learn' : 'civics-review';
}

// Tasks for one day. Deterministic: the same inputs give the same tasks.
// ctx: { date, start, target, levels, sections, completedSections, missedDays, extra }
export function tasksForDay(ctx) {
  const { date, start = date, target = null, levels = {}, sections = [], completedSections = [], missedDays = 0 } = ctx;
  const day = dayIndex(date);
  const weeks = weeksLeft(date, target);
  const count = taskCount({ weeks, missedDays });
  const weekNumber = Math.max(0, Math.floor(daysBetween(start, date) / 7));

  // Weighted rotation of skills: "Start here" skills come up most.
  const pool = [];
  for (const skill of SKILLS) {
    for (let i = 0; i < weightFor(levels[skill]); i++) pool.push(skill);
  }
  const tasks = [];
  const used = new Set();

  // N-400 section of the week, on two days a week.
  const section = n400ForWeek({ sections, completed: completedSections, weekNumber, weeks });
  if (section && (day % 7 === 1 || day % 7 === 4)) tasks.push({ kind: 'n400', section });

  // Civics every day (it's the biggest part of the test).
  tasks.push({ kind: civicsTask(levels, day) });
  used.add('civics');

  for (let i = 0; tasks.length < count && i < pool.length * 2; i++) {
    const skill = pool[(day + i) % pool.length];
    if (used.has(skill)) continue;
    // Strong skills: spaced review every third day only.
    if (levels[skill] === 'strong' && day % 3 !== 0) continue;
    used.add(skill);
    tasks.push({ kind: skill });
  }
  // Still short (strong skills were resting today): add a strong skill as
  // review, then the other civics task.
  for (const skill of SKILLS) {
    if (tasks.length >= count) break;
    if (!used.has(skill)) { used.add(skill); tasks.push({ kind: skill }); }
  }
  if (tasks.length < count) {
    const other = tasks.some((t) => t.kind === 'civics-learn') ? 'civics-review' : 'civics-learn';
    tasks.push({ kind: other });
  }

  return tasks.slice(0, count).map((t, i) => ({
    ...t,
    id: `${day}-${i}-${t.kind}${t.section ? `-${t.section}` : ''}`,
    minutes: TASKS[t.kind].minutes,
    href: t.kind === 'n400' ? `${TASKS.n400.href}?section=${t.section}` : TASKS[t.kind].href,
  }));
}

// "Keep going": two extra review tasks after today's are done.
export function extraTasks(date) {
  const day = dayIndex(date);
  return ['civics-review', day % 2 ? 'reading' : 'writing'].map((kind, i) => ({
    kind, id: `${day}-x${i}-${kind}`, minutes: TASKS[kind].minutes, href: TASKS[kind].href,
  }));
}

// The next 7 days, for a weekly view.
export function weekPlan(ctx) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(dayIndex(ctx.date) * DAY + i * DAY + 12 * 60 * 60 * 1000);
    return { date, tasks: tasksForDay({ ...ctx, date, missedDays: i === 0 ? ctx.missedDays : 0 }) };
  });
}

export const totalMinutes = (tasks) => tasks.reduce((s, t) => s + t.minutes, 0);
