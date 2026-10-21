// Lesson data and step rules for TutorLesson.
//
// A lesson is { id, title, steps: [step] }. Step types:
//   explain            { text: {en, mine?}, note?: {en, mine?} }
//   show-english       { question, keyWords?: [{en, translation}] }  (bridge: official
//                      question + accepted answers, key words highlighted)
//   practice-speaking  { question }            (civics question record)
//   practice-writing   { sentence }            (English sentence to dictate)
//   check-understanding{ prompt: {en, mine?}, options: [string], correct: string }
//   practice-reading   { sentence }            (read an English sentence aloud)
//   practice-interview { question }            (InterviewQuestion, answered aloud)
//   part-intro         { part, title, text, art }   (opens a part of a lesson)
//
// Any step may have `part` (a section that can be skipped when the lesson has
// skippableParts) and `mode: 'check'` (record the answer, no teaching).

export const STEP_TYPES = [
  'explain', 'show-english', 'practice-speaking', 'practice-writing', 'check-understanding',
  'practice-reading', 'practice-interview', 'part-intro',
];

// Steps that need an answer (or "Show me") before Continue unlocks.
const NEEDS_ANSWER = new Set(['practice-speaking', 'practice-writing', 'check-understanding', 'practice-reading', 'practice-interview']);

// stepState: { answered?: boolean, shown?: boolean }
export function canContinue(step, stepState = {}) {
  if (!step || !STEP_TYPES.includes(step.type)) return false;
  if (!NEEDS_ANSWER.has(step.type)) return true;
  return !!(stepState.answered || stepState.shown);
}

export function progressLabel(index, total) {
  return `Step ${index + 1} of ${total}`;
}

export function progressPercent(index, total) {
  if (!total) return 0;
  return Math.round(((index + 1) / total) * 100);
}

// Index of the first step after the current part (steps.length if none).
export function nextPartIndex(steps, index) {
  const part = steps[index]?.part;
  let i = index + 1;
  while (i < steps.length && part && steps[i].part === part) i++;
  return i;
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Splits text into [{ text, mark }] so key words (case-insensitive, whole
// words, longest first) can be highlighted. Joining the parts gives the text.
export function markKeyWords(text, words) {
  const list = [...new Set((words || []).map((w) => String(w || '').trim()).filter(Boolean))]
    .sort((a, b) => b.length - a.length);
  if (!text || !list.length) return text ? [{ text, mark: false }] : [];
  const re = new RegExp(`(?<![A-Za-z0-9])(${list.map(escapeRe).join('|')})(?![A-Za-z0-9])`, 'gi');
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (m.index > last) parts.push({ text: text.slice(last, m.index), mark: false });
    parts.push({ text: m[0], mark: true });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last), mark: false });
  return parts;
}
