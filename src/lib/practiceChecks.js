import { wordDiff } from '@/components/utils/wordDiff';

// Same normalization the dictation card has always used.
export const normalizeText = (text) =>
  (text || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();

// Dictation: exact match after normalizing (unchanged rule), plus which
// target words were missed so the tutor can point them out.
export function checkDictation(target, typed) {
  const diff = wordDiff(target, typed);
  return {
    isCorrect: normalizeText(typed) === normalizeText(target),
    words: diff.words,
    missing: diff.words.filter((w) => w.status === 'missing').map((w) => w.word),
  };
}

// An official answer field can list several accepted answers, one per line or
// separated by ";" or "•". Commas are kept ("Washington, D.C.").
export function splitOfficialAnswers(answer) {
  return (answer || '')
    .split(/\n|;|•/)
    .map((a) => a.trim())
    .filter(Boolean);
}

const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'or', 'in', 'on', 'for', 'is', 'are', 'it', 'its']);
const keyWords = (text) => normalizeText(text).split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));

// On-device check for TYPED civics answers (typed text never goes to the AI
// outside Study Buddy). Correct if every key word of any accepted answer is
// in what the learner typed.
export function matchOfficialAnswer(typed, officialAnswer) {
  const typedWords = new Set(keyWords(typed));
  if (typedWords.size === 0) return { isCorrect: false, matched: null };
  for (const accepted of splitOfficialAnswers(officialAnswer)) {
    // Words in parentheses are optional in USCIS answers: "(U.S.) Constitution".
    const words = keyWords(accepted.replace(/\([^)]*\)/g, ' '));
    if (words.length && words.every((w) => typedWords.has(w))) return { isCorrect: true, matched: accepted };
  }
  return { isCorrect: false, matched: null };
}
