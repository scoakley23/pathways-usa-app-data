// The Course tab's journey (Prompt 5; nothing locked since Amio v2): which
// stops a learner sees, which are done and which one is suggested next. Pure
// functions over the
// course (src/lib/course.js) and the learner's saved progress, so tests can
// check them without a screen.
//
// - Learners see only reviewed lessons; admins (and a developer with
//   VITE_SHOW_DRAFT_LESSONS=true) also see drafts, marked "Draft".
// - Nothing is locked (CLAUDE.md "Nothing is locked"): every lesson, Read and
//   write and Speak it! stop can be opened at any time. The first one that
//   isn't done (from the quick check's starting unit, when there is one) is
//   the suggested next stop, "current"; the others are "open".
// - The unit practice interview, N-400 lessons and review stops are always
//   "open". A stop type that isn't built yet is "soon". An N-400
//   lesson stop (`lessonId`, content/n400/lessons.json) shows only when that
//   lesson may be seen (reviewed, or drafts for admins).
import { UNITS, sectionQuestionIds, showDraftLessons } from '@/lib/course';
import { OFFICEHOLDER_QUESTIONS } from '@/lib/officeholderQuestions';
import { checkpointStars } from '@/lib/checkpoints';
import { N400_LESSON_IDS, findN400Lesson, n400LessonVisible } from '@/lib/n400Lessons';

// Stops the suggestion walks through (the course order), and extra stops
// that are always open. Anything else is "soon".
export const PLAYABLE_STOPS = ['lesson', 'readwrite', 'speakit'];
export const OPTIONAL_STOPS = ['practiceInterview', 'n400', 'review'];

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
      .filter((s) => (s.type === 'lesson' ? ids.has(s.lessonId) : true))
      .filter((s) => s.type !== 'n400' || !s.lessonId || n400LessonVisible(findN400Lesson(s.lessonId), showDrafts))
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
  if (stop.type === 'readwrite') return checkpoints.has(stop.id); // saved under the stop id
  if (stop.type === 'n400' && stop.lessonId) return !!(progress[stop.lessonId]?.completed || progress[stop.lessonId]?.completed_at);
  return false;
};

/**
 * Every visible stop in course order with its state: done | current | open |
 * soon. Nothing is ever locked. "current" is the one suggested next stop:
 * the first lesson, Read and write or Speak it! that isn't done, starting at
 * `startUnitId` (the quick check's suggestion, Prompt 9) when given, else at
 * the beginning; when everything from there on is done, the first one not
 * done anywhere. `progress`: { lessonId: { completed, stars, steps_done } };
 * `checkpoints`: section ids with a passed Speak it! (and Read and write
 * stop ids).
 */
export function journeyStops(course, { progress = {}, checkpoints = new Set(), startUnitId = null } = {}) {
  const out = [];
  let reachedStart = !startUnitId || !course.some((u) => u.id === startUnitId);
  for (const u of course) for (const s of u.sections) for (const stop of s.stops) {
    if (u.id === startUnitId) reachedStart = true;
    const item = { ...stop, unitId: u.id, sectionId: s.id, sectionKey: s.id, fromStart: reachedStart };
    if (isDone(item, progress, checkpoints)) item.state = 'done';
    else if (PLAYABLE_STOPS.includes(item.type) || OPTIONAL_STOPS.includes(item.type)) item.state = 'open';
    else item.state = 'soon';
    if (item.type === 'lesson' || (item.type === 'n400' && item.lessonId)) item.stars = progress[item.lessonId]?.stars || 0;
    out.push(item);
  }
  const suggestable = (x) => x.state === 'open' && PLAYABLE_STOPS.includes(x.type);
  const next = out.find((x) => x.fromStart && suggestable(x)) || out.find(suggestable);
  if (next) next.state = 'current';
  for (const x of out) delete x.fromStart;
  return out;
}

/** Every lesson id progress is loaded for: the course's lessons and the N-400 lessons. */
export function courseLessonIds(units = UNITS) {
  return units.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).map((l) => l.id)));
}
export const allLessonIds = (units = UNITS) => [...courseLessonIds(units), ...N400_LESSON_IDS];

/**
 * Stars: calculated from saved lesson progress and passed Speak it!
 * checkpoints (+10 each), never stored twice.
 */
export function totalStars(progress = {}, units = UNITS, checkpoints = new Set()) {
  const ids = new Set([...courseLessonIds(units), ...N400_LESSON_IDS]);
  const lessonStars = Object.entries(progress).reduce((n, [id, p]) => n + (ids.has(id) ? Number(p?.stars) || 0 : 0), 0);
  return lessonStars + checkpointStars(checkpoints, units);
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

// Done = every lesson, Read and write and Speak it! in it is done (the extra
// stops never hold it back).
const allDone = (mine) => mine.filter((s) => PLAYABLE_STOPS.includes(s.type)).every((s) => s.state === 'done');

/** A section's state in the unit guide: done | current | open | empty. Never locked. */
export function sectionState(section, stops) {
  const mine = stops.filter((s) => s.sectionId === section.id);
  if (!mine.length) return 'empty';
  if (mine.some((s) => s.state === 'current')) return 'current';
  return allDone(mine) ? 'done' : 'open';
}

/** A unit's state on the all-units map and the topic list: done | current | open | empty. Never locked. */
export function unitState(unit, stops, currentId) {
  const mine = stops.filter((s) => s.unitId === unit.id);
  if (!mine.length) return 'empty';
  if (unit.id === currentId && mine.some((s) => s.state === 'current')) return 'current';
  return allDone(mine) ? 'done' : 'open';
}

/**
 * Course (Amio v2): a unit's test questions and how many of them the learner
 * has mastered (civics answers mastered in user_progress, `masteredIds`).
 */
export function unitQuestionsDone(unit, masteredIds = new Set()) {
  const ids = new Set(unit.sections.flatMap((s) => sectionQuestionIds(s)));
  let done = 0;
  for (const id of ids) if (masteredIds.has(id)) done += 1;
  return { done, total: ids.size };
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
