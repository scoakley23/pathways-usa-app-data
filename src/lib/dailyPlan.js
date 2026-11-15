// The daily plan (Prompt 7): lessons per day, the "ready by" month, today's
// lesson and goal, Amio's one line, and what comes tomorrow. Plain functions
// over the course (src/lib/journey.js) and saved progress, so tests can check
// them. No minutes anywhere: the app doesn't time anything.

export const PACES = [
  { perDay: 1, id: 'easy' },
  { perDay: 2, id: 'steady' },
  { perDay: 3, id: 'fast' },
];
export const STUDY_DAYS_PER_WEEK = 6; // room for one rest day a week

const dayStart = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);

/** The day the course would be finished at `perDay` lessons a day. */
export function readyBy(lessonsLeft, perDay, today = new Date()) {
  const studyDays = Math.ceil(Math.max(0, lessonsLeft) / Math.max(1, perDay));
  const calendarDays = Math.ceil((studyDays * 7) / STUDY_DAYS_PER_WEEK);
  const d = dayStart(today);
  d.setDate(d.getDate() + calendarDays);
  return d;
}

/**
 * The lightest pace that is ready by the end of the interview month; the
 * fastest when none is; "steady" when there's no month.
 */
export function recommendedPace(lessonsLeft, target, today = new Date()) {
  if (!target) return 2;
  const end = new Date(target.getFullYear(), target.getMonth() + 1, 0, 12);
  const fits = PACES.find((p) => readyBy(lessonsLeft, p.perDay, today) <= end);
  return fits ? fits.perDay : 3;
}

/** This month and the next four, as { month: 'YYYY-MM', date }. */
export function monthChoices(today = new Date(), count = 5) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1, 12);
    return { month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, date: d };
  });
}

const sameDay = (iso, today) => {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
};

/** Course lessons first finished today (from saved completed_at). */
export function finishedToday(progress = {}, today = new Date()) {
  return Object.entries(progress).filter(([, p]) => sameDay(p?.completed_at, today)).map(([id]) => id);
}

/** Stars from lessons finished today. */
export function starsToday(progress = {}, today = new Date()) {
  return finishedToday(progress, today).reduce((n, id) => n + (Number(progress[id]?.stars) || 0), 0);
}

/**
 * Today's lesson: the lesson at the current stop of the journey, with where
 * it sits ("Congress · lesson 3 of 7"). null when every open lesson is done.
 */
export function todayLesson(course, stops) {
  const cur = stops.find((s) => s.state === 'current' && s.type === 'lesson');
  if (!cur) return null;
  const unit = course.find((u) => u.id === cur.unitId);
  const section = unit?.sections.find((s) => s.id === cur.sectionId);
  if (!section) return null;
  const lesson = section.lessons.find((l) => l.id === cur.lessonId);
  return { unit, section, lesson, number: section.lessons.indexOf(lesson) + 1, of: section.lessons.length };
}

/**
 * Amio's one line on Today. goal: lessons per day (0 = none set);
 * done: lessons finished today.
 */
export function amioLineKey(goal, done) {
  if (!goal) return { key: 'amio_ready' };
  if (done >= goal) return { key: 'amio_goal_done' };
  if (done === 0) return { key: 'amio_first' };
  if (done + 1 === goal) return { key: 'amio_last', vars: { n: done + 1 } };
  return { key: 'amio_next', vars: { n: done + 1 } };
}

/**
 * Progress toward the section's Speak it! checkpoint: lessons done of the
 * section's lessons, and how many are left.
 */
export function checkpointProgress(section, progress = {}) {
  const lessons = section?.lessons || [];
  const done = lessons.filter((l) => progress[l.id]?.completed || progress[l.id]?.completed_at).length;
  return { done, total: lessons.length, left: Math.max(0, lessons.length - done) };
}

/** Lessons left in the whole course (all lessons, reviewed or not yet). */
export function lessonsLeft(units, progress = {}) {
  const all = units.flatMap((u) => u.sections.flatMap((s) => s.lessons || []));
  return all.filter((l) => !(progress[l.id]?.completed || progress[l.id]?.completed_at)).length;
}
