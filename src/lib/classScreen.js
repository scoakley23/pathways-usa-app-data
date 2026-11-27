// The Class screen (desktop vision D): partner classes show official civics
// questions on a projector, one at a time, and reveal the official answer.
// It saves nothing and needs no sign-in.
//
// - Questions are the 2025 test's, word for word, from the course's reviewed
//   lessons (a topic = a unit), or every topic ('all').
// - Answers are the official ones only. Officeholder questions show the
//   names from src/data/officeholders.json (President, Vice President,
//   Speaker, Chief Justice). The ones that depend on where you live
//   (senators, representative, governor, capital) are left out: a classroom
//   has no single state.

import { UNITS, questionRecord, visibleLessons } from './course.js';
import { officeholderAnswerFor, officeholderKindFor } from './officeholderQuestions.js';
import { splitOfficialAnswers } from './practiceChecks.js';

export const CLASS_ROUND = 10;
export const DEPENDS_ON_PLACE = new Set(['senator', 'representative', 'governor', 'capital']);

/** A unit's reviewed questions (ids, no repeats, in course order). */
export function unitQuestionIds(unit) {
  const ids = [];
  for (const section of unit?.sections || []) {
    for (const lesson of visibleLessons(section, { showDrafts: false })) {
      for (const id of lesson.questionIds || []) if (!ids.includes(id)) ids.push(id);
    }
  }
  return ids;
}

/** The questions a class can use for a topic ('all' = every unit), place-dependent ones left out. */
export function classPool(topicId, units = UNITS) {
  const chosen = topicId === 'all' ? units : units.filter((u) => u.id === topicId);
  const out = [];
  for (const unit of chosen) {
    for (const id of unitQuestionIds(unit)) {
      const q = questionRecord(id);
      if (!q || out.some((x) => x.id === id)) continue;
      if (DEPENDS_ON_PLACE.has(officeholderKindFor(q))) continue;
      out.push(q);
    }
  }
  return out;
}

/** Up to `size` questions in a random order (`random` for tests). */
export function classRound(topicId, { size = CLASS_ROUND, random = Math.random, units = UNITS } = {}) {
  const pool = [...classPool(topicId, units)];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, size);
}

/**
 * What to show as the answer: { answers: [...], checkedOn? }. Officeholder
 * questions use the official list's names; every other question its official
 * accepted answers. Never AI-written.
 */
export function classAnswers(question) {
  if (officeholderKindFor(question)) {
    const r = officeholderAnswerFor(question);
    return { answers: r?.accepted || [], checkedOn: r?.checkedOn || null, mayChangeSoon: !!r?.mayChangeSoon };
  }
  return { answers: splitOfficialAnswers(question.answer), checkedOn: null, mayChangeSoon: false };
}
