// Pre-written answers for Ask Amio's suggested questions (Step 4): reviewed
// text in content/ask/answers.json, shown instead of asking the AI. Used only
// when the answer is "reviewed" AND we have it in the learner's language (the
// translation pack; English needs nothing). Otherwise the question goes to
// the AI as before, so Amio still explains in the learner's language.
import ANSWERS_FILE from '../../content/ask/answers.json';
import { packText } from '@/lib/translationPack';

// Same words, ignoring case, punctuation and spacing.
export const normalizeQuestion = (text) => String(text || '')
  .toLowerCase()
  .replace(/[“”"'’‘«»¿?¡!.,:;()]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export function reviewedAnswers(file = ANSWERS_FILE) {
  return (file?.answers || []).filter((a) => a?.status === 'reviewed' && a.question && a.answer);
}

// The reviewed entry for a suggestion id, or for words that are exactly one
// of the questions (in English, or as `translations` = { id: translated
// question } gives them for the learner's language).
export function findAnswer({ id = null, text = '', translations = {} } = {}, { file = ANSWERS_FILE } = {}) {
  const entries = reviewedAnswers(file);
  if (id) {
    const byId = entries.find((a) => a.id === id);
    if (byId) return byId;
  }
  const said = normalizeQuestion(text);
  if (!said) return null;
  return entries.find((a) => normalizeQuestion(a.question) === said
    || (translations[a.id] && normalizeQuestion(translations[a.id]) === said)) || null;
}

// → { en, mine } (mine = null in English), or null to ask the AI instead.
// `translate(lang, english)` is packText() unless a test passes its own.
export async function preparedAnswer({ id = null, text = '', language = 'en', translations = {} } = {}, { file = ANSWERS_FILE, translate = packText } = {}) {
  const entry = findAnswer({ id, text, translations }, { file });
  if (!entry) return null;
  if (!language || language === 'en') return { en: entry.answer, mine: null, id: entry.id };
  const mine = await translate(language, entry.answer);
  return mine ? { en: entry.answer, mine, id: entry.id } : null;
}
