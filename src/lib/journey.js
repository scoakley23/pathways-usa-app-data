// The Course tab's journey (Prompt 5): which stops a learner sees, which are
// done, which one is next and which are locked. Pure functions over the
// course (src/lib/course.js) and the learner's saved progress, so tests can
// check them without a screen.
//
// - Learners see only reviewed lessons; admins (and a developer with
//   VITE_SHOW_DRAFT_LESSONS=true) also see drafts, marked "Draft".
// - Stops unlock in order, across the whole course: the first stop that
//   isn't done is "current"; everything after it is "locked".
// - Stops whose screens aren't built yet (Read and write, Speak it!, N-400
//   cards, the review chest, the practice interview: Prompt 8) are "soon"
//   and don't block what comes after them.
import { UNITS, sectionQuestionIds, showDraftLessons } from '@/lib/course';
import { OFFICEHOLDER_QUESTIONS } from '@/lib/officeholderQuestions';

// Stop types that can be played today. Prompt 8 adds the rest.
export const PLAYABLE_STOPS = ['lesson'];

export function canSeeDrafts(user, env) {
  return showDraftLessons(env) || user?.role === 'admin';
}

/** The lessons and stops a learner may see in one section. */
export function visibleSection(section, { showDrafts = false } = {}) {
  const lessons = (section.lessons || []).filter((l) => showDrafts || l.status === 'reviewed');
  const ids = new Set(lessons.map((l) => l.id));
  const byId = Object.fromEntries(lessons.map((l) => [l.id, l]));
  // A non-lesson stop is shown only once at least one of its section's lessons is.
  const stops = lessons.length
    ? (section.stops || [])
      .filter((s) => s.type !== 'lesson' || ids.has(s.lessonId))
      .map((s) => ({ ...s, lesson: s.type === 'lesson' ? byId[s.lessonId] : null }))
    : [];
  return { ...section, lessons, stops };
}

/** Units with only what this learner may see. */
export function visibleCourse(units = UNITS, opts = {}) {
  return units.map((u) => ({ ...u, sections: u.sections.map((s) => visibleSection(s, opts)) }));
}

const isDone = (stop, progress, checkpoints) => {
  if (stop.type === 'lesson') return !!(progress[stop.lessonId]?.completed || progress[stop.lessonId]?.completed_at);
  if (stop.type === 'speakit') return checkpoints.has(stop.sectionKey);
  return false;
};

/**
 * Every visible stop in course order with its state: done | current |
 * locked | soon. `progress`: { lessonId: { completed, stars, steps_done } };
 * `checkpoints`: section ids with a passed Speak it!.
 */
export function journeyStops(course, { progress = {}, checkpoints = new Set() } = {}) {
  const out = [];
  let current = null;
  for (const u of course) for (const s of u.sections) for (const stop of s.stops) {
    const item = { ...stop, unitId: u.id, sectionId: s.id, sectionKey: s.id };
    const done = isDone(item, progress, checkpoints);
    if (done) item.state = 'done';
    else if (current) item.state = 'locked';
    else if (!PLAYABLE_STOPS.includes(item.type)) item.state = 'soon';
    else { item.state = 'current'; current = item; }
    if (item.type === 'lesson') item.stars = progress[item.lessonId]?.stars || 0;
    out.push(item);
  }
  // Every stop after the current one waits for it.
  for (const item of out) if (item.state === 'locked') item.waitFor = current;
  return out;
}

/** Stars: calculated from saved lesson progress, never stored twice. */
export function totalStars(progress = {}, units = UNITS) {
  const ids = new Set(units.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).map((l) => l.id))));
  return Object.entries(progress).reduce((n, [id, p]) => n + (ids.has(id) ? Number(p?.stars) || 0 : 0), 0);
}

const lessonsOf = (unitOrSection) => (unitOrSection.sections ? unitOrSection.sections.flatMap((s) => s.lessons) : unitOrSection.lessons);

/** "8 of 26": visible lessons done in a unit or section. */
export function lessonCounts(unitOrSection, progress = {}) {
  const lessons = lessonsOf(unitOrSection);
  const done = lessons.filter((l) => progress[l.id]?.completed || progress[l.id]?.completed_at).length;
  return { done, total: lessons.length };
}

/** Test questions a unit's visible lessons cover. */
export function questionCount(unit) {
  return new Set(unit.sections.flatMap((s) => sectionQuestionIds(s))).size;
}

/** The unit with the current stop; else the first unit with visible lessons; else Unit 1. */
export function currentUnitId(course, stops) {
  const cur = stops.find((s) => s.state === 'current');
  if (cur) return cur.unitId;
  const withLessons = course.find((u) => u.sections.some((s) => s.lessons.length));
  return (withLessons || course[0])?.id;
}

/** A section's state in the unit guide: done | current | locked | empty. */
export function sectionState(section, stops) {
  const mine = stops.filter((s) => s.sectionId === section.id);
  if (!mine.length) return 'empty';
  if (mine.some((s) => s.state === 'current')) return 'current';
  if (mine.every((s) => s.state === 'done' || s.state === 'soon')) return 'done';
  return 'locked';
}

/** A unit's state on the all-units map: done | current | locked | empty. */
export function unitState(unit, stops, currentId) {
  const mine = stops.filter((s) => s.unitId === unit.id);
  if (!mine.length) return 'empty';
  if (unit.id === currentId && mine.some((s) => s.state === 'current')) return 'current';
  if (mine.every((s) => s.state === 'done' || s.state === 'soon')) return 'done';
  return 'locked';
}

const OFFICEHOLDER_TEXTS = new Set(OFFICEHOLDER_QUESTIONS.filter((q) => q.version === '2025' && ['senator', 'representative', 'governor', 'capital'].includes(q.office)).map((q) => q.question));

/** True when a lesson asks about the learner's own state or district. */
export function usesYourState(questionTexts = []) {
  return questionTexts.some((t) => OFFICEHOLDER_TEXTS.has(t));
}

// Where the winding road puts each stop, as a percent of the width
// (mirrored for right-to-left languages).
const ZIGZAG = [30, 55, 72, 50, 28, 42, 66];
export function stopX(index, rtl = false) {
  const x = ZIGZAG[index % ZIGZAG.length];
  return rtl ? 100 - x : x;
}
