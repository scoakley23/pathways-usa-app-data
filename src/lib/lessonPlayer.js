// The 5-step lesson player's rules (Prompt 6), as plain functions so tests
// can check them without a screen: the steps, stars, the Write it word bank
// and gentle fixes, and the progress row to save.
//
// Stars: one each for Teach it back, Read it + Write it, and the Officer
// question, once that step is answered right (Try again is allowed). Finishing
// all 5 steps right = 3 stars. "Skip for now" moves on without the star. A
// question that can't be graded on the device (an officeholder question
// without the learner's state) counts as neither right nor wrong: no star,
// no review item, and the step still counts as done.
import { wordDiff } from '@/components/utils/wordDiff';
import { checkDictation } from '@/lib/practiceChecks';

export const STEPS = ['listen', 'teachBack', 'readIt', 'writeIt', 'officer'];
export const STEP_TITLES = {
  listen: 'Listen',
  teachBack: 'Teach it back',
  readIt: 'Read it',
  writeIt: 'Write it',
  officer: 'Officer question',
};

// results: { stepName: 'right' | 'skipped' | 'unchecked' } for finished steps.
export function starsFor(results = {}) {
  const right = (s) => results[s] === 'right';
  return (right('teachBack') ? 1 : 0) + (right('readIt') && right('writeIt') ? 1 : 0) + (right('officer') ? 1 : 0);
}

export function stepsDone(results = {}) {
  return STEPS.filter((s) => results[s]).length;
}

/** The step to start at: the first one not finished in this run. */
export function nextStepIndex(results = {}) {
  const i = STEPS.findIndex((s) => !results[s]);
  return i === -1 ? STEPS.length : i;
}

/**
 * The lesson_progress row to save after a run. A replay never lowers saved
 * stars or steps, and completed_at keeps the first finish.
 */
export function progressRow(lessonId, results, existing = null, now = new Date()) {
  const steps = stepsDone(results);
  const stars = starsFor(results);
  const completed = steps === STEPS.length;
  return {
    lesson_id: lessonId,
    steps_done: Math.max(steps, Number(existing?.steps_done) || 0),
    stars: Math.max(stars, Number(existing?.stars) || 0),
    completed: completed || !!existing?.completed,
    completed_at: existing?.completed_at || (completed ? now.toISOString() : null),
  };
}

// A small fixed shuffle (the same order every time for the same words), so
// the word bank doesn't simply list the sentence in order.
function seededShuffle(list, seedText) {
  let seed = [...seedText].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const j = seed % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Write it level 1: the sentence's words (as written, the final period on the
 * last word) plus the extra words, shuffled. Each tile has an id so repeated
 * words stay separate.
 */
export function wordBank(sentence, distractors = []) {
  const words = String(sentence).trim().split(/\s+/);
  const tiles = [...words.map((w, i) => ({ id: `s${i}`, word: w })), ...distractors.map((w, i) => ({ id: `d${i}`, word: w }))];
  const shuffled = seededShuffle(tiles, sentence);
  // Never show the sentence already in order.
  if (shuffled.slice(0, words.length).map((t) => t.word).join(' ') === words.join(' ') && shuffled.length > 1) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }
  return shuffled;
}

/**
 * Check a written sentence (level 1 built from tiles, or level 2 typed) with
 * the existing dictation check (case and punctuation don't decide right or
 * wrong), plus gentle fixes: a capital letter at the start and a period at
 * the end.
 */
export function checkWriting(target, written) {
  const result = checkDictation(target, written);
  const text = String(written || '').trim();
  const fixes = [];
  if (result.isCorrect) {
    if (text && text[0] !== text[0].toUpperCase()) fixes.push('capital');
    if (!/[.]$/.test(text)) fixes.push('period');
  }
  return { ...result, fixes };
}

/** Read it: which words of the sentence were read clearly so far (live). */
export function readingWords(sentence, transcript) {
  const diff = wordDiff(sentence, transcript || '');
  return { words: diff.words, accuracy: diff.accuracy, passed: diff.accuracy >= READ_PASS };
}
export const READ_PASS = 70; // the existing reading practice score

/** Questions to put into review (box 1): those answered wrong in this run. */
export function missedQuestions(misses) {
  return [...new Set(misses.filter(Boolean))];
}
