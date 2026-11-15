// Checkpoints (Prompt 8): Speak it!, Read and write stops, the review chest,
// Unit complete and the badges. Plain functions over the course
// (src/lib/course.js) and saved progress, so tests can check them.
//
// Saved data (Supabase only, src/api/checkpoints.js): one `checkpoint_results`
// row per try. Speak it! uses the section id; a Read and write stop uses its
// stop id (e.g. "u2-s2-rw"). Stars and badges are calculated from these and
// lesson progress, never stored.
import { UNITS, questionRecord, sectionQuestionIds } from '@/lib/course';

export const SPEAK_IT_STARS = 10;
export const CHEST_SIZE = 6;
export const READ_WRITE_COUNT = 3;

/** The questions a Speak it! asks: the section's visible lessons' questions. */
export function speakItQuestions(section) {
  return sectionQuestionIds(section).map(questionRecord).filter(Boolean);
}

/**
 * Pass = all but one right. Answers the app can't check yet (correct ===
 * null) don't count either way: they're left out of the total.
 * answers: [{ correct: true | false | null }]
 */
export function speakItScore(answers = []) {
  const counted = answers.filter((a) => a && a.correct !== null && a.correct !== undefined);
  const correct = counted.filter((a) => a.correct).length;
  const total = counted.length;
  return { correct, total, passed: total > 0 && correct >= total - 1 };
}

/** "5 of 6 to pass": the number needed out of n questions. */
export const passMark = (n) => Math.max(1, n - 1);

/**
 * Sentences for a Read and write stop: up to 3 to read and 3 to write, from
 * the lessons it lists (`fromLessons`) that the learner may see. A section
 * with fewer lessons has fewer sentences (each lesson has one of each).
 */
export function readWriteSentences(stop, section) {
  const byId = Object.fromEntries((section?.lessons || []).map((l) => [l.id, l]));
  const lessons = (stop?.fromLessons || []).map((id) => byId[id]).filter(Boolean);
  const pick = (from) => (from.length <= READ_WRITE_COUNT ? from : from.slice(-READ_WRITE_COUNT));
  const chosen = pick(lessons);
  return {
    read: chosen.map((l) => ({ lesson: l, sentence: l.steps.readIt.sentence })),
    write: chosen.map((l) => ({ lesson: l, sentence: l.steps.writeIt.sentence })),
  };
}

/** Questions for one review chest: the first `CHEST_SIZE` due ones that still exist. */
export function chestQuestions(dueIds = [], size = CHEST_SIZE) {
  return dueIds.map(questionRecord).filter(Boolean).slice(0, size);
}

/** Which screen asks each chest question: the first half Teach it back, the rest the officer. */
export function chestKind(index, count) {
  return index < Math.ceil(count / 2) ? 'teach' : 'officer';
}

const BLOCKING = new Set(['lesson', 'readwrite', 'speakit']);

/** True when every lesson, Read and write and Speak it! stop in the unit is done. */
export function unitComplete(unitId, stops = []) {
  const mine = stops.filter((s) => s.unitId === unitId && BLOCKING.has(s.type));
  return mine.length > 0 && mine.every((s) => s.state === 'done');
}

/** The unit whose last checkpoint this section is, when passing it finishes the unit. */
export function unitFinishedBy(sectionId, stops = []) {
  const mine = stops.find((s) => s.sectionId === sectionId);
  if (!mine) return null;
  const unitStops = stops.filter((s) => s.unitId === mine.unitId && BLOCKING.has(s.type));
  const others = unitStops.filter((s) => !(s.sectionId === sectionId && s.type === 'speakit'));
  return others.every((s) => s.state === 'done') ? mine.unitId : null;
}

/**
 * Unit complete numbers: lessons, test questions, and sentences read and
 * written (each lesson reads one and writes one; each Read and write stop
 * adds its own).
 */
export function unitStats(unit) {
  const lessons = unit.sections.flatMap((s) => s.lessons || []);
  const questions = new Set(unit.sections.flatMap((s) => sectionQuestionIds(s))).size;
  let sentences = lessons.length * 2;
  for (const s of unit.sections) for (const stop of s.stops || []) {
    if (stop.type !== 'readwrite') continue;
    const { read, write } = readWriteSentences(stop, s);
    sentences += read.length + write.length;
  }
  return { lessons: lessons.length, questions, sentences };
}

const speakItSections = (units) => new Set(units.flatMap((u) => u.sections.filter((s) => (s.stops || []).some((st) => st.type === 'speakit')).map((s) => s.id)));

/** Stars from passed Speak it! checkpoints (+10 each). */
export function checkpointStars(checkpoints = new Set(), units = UNITS) {
  const ids = speakItSections(units);
  return [...checkpoints].filter((id) => ids.has(id)).length * SPEAK_IT_STARS;
}

/**
 * Badges, calculated: one per section with a passed Speak it!, one per unit
 * finished. [{ id, kind: 'section' | 'unit', title, icon }]
 */
export function courseBadges(stops = [], units = UNITS) {
  const out = [];
  for (const u of units) {
    for (const s of u.sections) {
      const speak = stops.find((st) => st.sectionId === s.id && st.type === 'speakit');
      if (speak?.state === 'done') out.push({ id: `section:${s.id}`, kind: 'section', title: s.title, icon: u.icon });
    }
    if (unitComplete(u.id, stops)) out.push({ id: `unit:${u.id}`, kind: 'unit', title: u.title, icon: u.icon, number: u.number });
  }
  return out;
}

/**
 * Where an N-400 stop opens: { section, card } on the stop → the guide's card
 * (/n400-guide?section=…&card=n). null without a section.
 */
export function n400Href(stop) {
  if (!stop?.section) return null;
  const card = Number(stop.card) || 1;
  return `/n400-guide?section=${encodeURIComponent(stop.section)}&card=${card}`;
}
