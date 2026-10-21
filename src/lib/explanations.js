import { splitOfficialAnswers } from './practiceChecks';

// Lesson explanations for the civics questions (Prompt 7: teach first, then
// practice). They are CONTENT files, reviewed by a person, not generated live:
//   content/explanations/<lang>.json = { "<official question>": {
//     question, answers, status: 'draft' | 'reviewed', explanation,
//     keyWords: [{ en, translation }] } }
// Only "reviewed" entries are shown. See content/explanations/REVIEW.md.
const files = import.meta.glob('../../content/explanations/*.json', { eager: true, import: 'default' });

export const EXPLANATIONS = Object.fromEntries(
  Object.entries(files).map(([path, table]) => [path.match(/([\w-]+)\.json$/)[1], table || {}]),
);

export const STATUSES = ['draft', 'reviewed'];

// Fixed strings (English + hand-written Spanish).
export const COMING_SOON = { en: 'Explanation coming soon.', es: 'Explicación disponible pronto.' };
export const TRANSLATION_SOON = { en: 'Translation coming soon.', es: 'Traducción disponible pronto.' };

const reviewed = (entry) => (entry && entry.status === 'reviewed' && entry.explanation ? entry : null);

// Pure selection rule. Returns { text, keyWords, source, comingSoon, englishText }:
// - the learner's language entry, only if reviewed (source 'mine');
// - else the reviewed English entry (source 'english'), with comingSoon=true
//   for non-English learners ("Translation coming soon.");
// - else nothing (source null): the app shows "Explanation coming soon."
// englishText is the reviewed English explanation (shown under a translation).
export function selectExplanation(questionText, language = 'en', tables = EXPLANATIONS) {
  const english = reviewed(tables.en?.[questionText]);
  const mine = reviewed(tables[language]?.[questionText]);
  const englishText = english ? english.explanation : null;
  if (mine) return { text: mine.explanation, keyWords: mine.keyWords || [], source: 'mine', comingSoon: false, englishText };
  if (english) return { text: english.explanation, keyWords: english.keyWords || [], source: 'english', comingSoon: language !== 'en', englishText };
  return { text: null, keyWords: [], source: null, comingSoon: false, englishText: null };
}

export function getExplanation(questionText, language = 'en') {
  return selectExplanation(questionText, language, EXPLANATIONS);
}

const pick = (t, language) => ({ en: t.en, mine: language === 'es' ? t.es : null });

// Explain-step text for TutorMessage ({ en, mine }) plus an optional note.
export function explainText(explanation, language = 'en') {
  const { text, source, comingSoon, englishText } = explanation;
  if (!source) return { text: pick(COMING_SOON, language), note: null };
  if (source === 'mine') {
    return language === 'en'
      ? { text: { en: text, mine: null }, note: null }
      : { text: { en: englishText, mine: text }, note: null };
  }
  return { text: { en: text, mine: null }, note: comingSoon ? pick(TRANSLATION_SOON, language) : null };
}

const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

// Stable lesson order: category, then question text.
export function lessonOrder(questions) {
  return [...questions].sort((a, b) => byText(a.category || '', b.category || '') || byText(a.question, b.question));
}

// The next 2025 questions this learner has not started (no UserProgress row).
export function pickNextToLearn(questions, progressRows, n = 2) {
  const started = new Set((progressRows || []).map((p) => p.content_id));
  const fresh = (questions || []).filter((q) => q.version === '2025' && q.answer && !started.has(q.id));
  return lessonOrder(fresh).slice(0, Math.max(0, n));
}

// Teach-then-practice lesson: per question, explain → bridge → speak.
export function buildLearnLesson(questions, language = 'en', lookup = getExplanation) {
  const steps = [];
  for (const q of questions) {
    const explanation = lookup(q.question, language);
    const { text, note } = explainText(explanation, language);
    steps.push({ type: 'explain', text, note, questionId: q.id });
    steps.push({ type: 'show-english', question: q, keyWords: explanation.keyWords, questionId: q.id });
    steps.push({ type: 'practice-speaking', question: q, questionId: q.id });
  }
  return { id: 'learn-civics', title: 'Learn civics', steps };
}

// Checks every explanation file against the exported official questions
// (content/civics/questions-2025.json). Returns a list of problems (empty = OK).
export function findExplanationProblems(tables, officialQuestions) {
  const official = new Map((officialQuestions || []).map((q) => [q.question, q]));
  const problems = [];
  for (const [lang, table] of Object.entries(tables)) {
    for (const [key, entry] of Object.entries(table || {})) {
      const where = `${lang}.json "${key}"`;
      if (!entry || typeof entry !== 'object') { problems.push(`${where}: entry is not an object`); continue; }
      if (entry.question !== key) problems.push(`${where}: key does not equal the "question" field`);
      if (!STATUSES.includes(entry.status)) problems.push(`${where}: status must be "draft" or "reviewed"`);
      const q = official.get(entry.question);
      if (!q) { problems.push(`${where}: question is not in content/civics/questions-2025.json`); continue; }
      const expected = splitOfficialAnswers(q.answer);
      if (JSON.stringify(entry.answers) !== JSON.stringify(expected)) {
        problems.push(`${where}: answers differ from the official answer list ${JSON.stringify(expected)}`);
      }
      const source = `${q.question} ${expected.join(' ')}`.toLowerCase();
      for (const k of entry.keyWords || []) {
        if (!k || !k.en || !source.includes(String(k.en).toLowerCase())) {
          problems.push(`${where}: key word "${k?.en}" is not in the official question or answers`);
        }
      }
    }
  }
  return problems;
}
