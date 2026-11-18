// N-400 lessons: one per N-400 guide section, at the end of each unit of the
// course. They teach UNDERSTANDING each question the way the officer may ask
// it, never an answer: no sample answers and no practice person.
//
// Content: content/n400/lessons.json (reviewed like the course; learners see
// only "reviewed" lessons). The form wording, meanings, words to know and the
// officer's phrasings come from the N-400 guide (src/components/n400/
// n400Content.js); lessons.json adds only the short question names, the
// "Same question?" choices, the "Spot the word" items and, for some lessons,
// a "Before you start" card (`context`) shown in Listen.
//
// Five steps: Listen → Same question? → Spot the word → Say what it asks →
// Ask for help. One star each for Same question?, Spot the word and Say what
// it asks, when every item in the step was right (a wrong tap can be fixed,
// but the star needs no misses). Saved like a course lesson (lesson_progress,
// steps and stars only); nothing the learner says is kept.
import data from '../../content/n400/lessons.json';
import { N400_SECTIONS } from '@/components/n400/n400Content';

export const N400_LESSON_STEPS = ['listen', 'same', 'spot', 'say', 'help'];
const STAR_STEPS = ['same', 'spot', 'say'];

export const N400_LESSONS = data.lessons;
export const N400_QUESTION_NAMES = data.questionNames;
export const HELP_PHRASES = data.help.phrases;
export const N400_LESSON_IDS = N400_LESSONS.map((l) => l.id);

const QUESTIONS = new Map(N400_SECTIONS.flatMap((s) => s.questions.map((q) => [q.id, { ...q, sectionId: s.id }])));

/** A guide question by id (form wording, meaning, words, the officer's phrasings). */
export const guideQuestion = (id) => QUESTIONS.get(id) || null;
export const questionName = (id) => N400_QUESTION_NAMES[id] || '';

export const findN400Lesson = (id) => N400_LESSONS.find((l) => l.id === id) || null;
export const n400LessonForSection = (sectionId) => N400_LESSONS.find((l) => l.section === sectionId) || null;

/** Learners see reviewed lessons only; admins (and the dev switch) also drafts. */
export const n400LessonVisible = (lesson, showDrafts = false) => !!lesson && (showDrafts || lesson.status === 'reviewed');

/** The guide section a lesson teaches, with its approved questions. */
export function lessonSection(lesson) {
  const section = N400_SECTIONS.find((s) => s.id === lesson?.section);
  if (!section) return null;
  return { ...section, questions: section.questions.filter((q) => q.status === 'approved') };
}

/** results: { step: 'right' | 'missed' | 'skipped' } for finished steps. */
export function n400StarsFor(results = {}) {
  return STAR_STEPS.filter((s) => results[s] === 'right').length;
}

/** How saving counts this lesson (src/lib/lessonPlayer.js progressRow). */
export const N400_RULES = { steps: N400_LESSON_STEPS, starsFor: n400StarsFor };

/** "What does “{word}” mean?" with the lesson's word. */
export const helpPhrase = (phrase, word) => phrase.say.split('{word}').join(word || '');

/**
 * Problems with the lessons, as sentences ([] = all good). `sections` is the
 * N-400 guide. Checks every reference against the guide, so nothing in a
 * lesson can drift from the form's own wording.
 */
export function n400LessonProblems(content = data, sections = N400_SECTIONS) {
  const problems = [];
  const qs = new Map(sections.flatMap((s) => s.questions.map((q) => [q.id, { ...q, sectionId: s.id }])));
  const sectionIds = new Set(sections.map((s) => s.id));
  for (const id of qs.keys()) if (!content.questionNames[id]) problems.push(`questionNames: no name for ${id}`);
  for (const id of Object.keys(content.questionNames)) if (!qs.has(id)) problems.push(`questionNames: ${id} is not in the guide`);
  const seen = new Set();
  for (const l of content.lessons) {
    const at = l.id;
    if (seen.has(l.section)) problems.push(`${at}: a second lesson for ${l.section}`);
    seen.add(l.section);
    if (!sectionIds.has(l.section)) problems.push(`${at}: no guide section "${l.section}"`);
    if (l.id !== `n400-${l.section}`) problems.push(`${at}: the id must be n400-${l.section}`);
    if (!['draft', 'reviewed'].includes(l.status)) problems.push(`${at}: status must be draft or reviewed`);
    if (!l.title) problems.push(`${at}: missing title`);
    const phrasingOf = (qid, p) => !!qs.get(qid)?.officerPhrasings?.includes(p);
    for (const [i, item] of (l.same || []).entries()) {
      const w = `${at}/same[${i}]`;
      if (!qs.has(item.answer)) problems.push(`${w}: no question ${item.answer}`);
      if (!phrasingOf(item.answer, item.phrasing)) problems.push(`${w}: the phrasing must be one of the guide's officer phrasings for ${item.answer}`);
      if (item.choices?.length !== 3 || new Set(item.choices).size !== 3) problems.push(`${w}: needs 3 different choices`);
      if (!item.choices?.includes(item.answer)) problems.push(`${w}: the choices must include the answer`);
      for (const c of item.choices || []) if (!qs.has(c)) problems.push(`${w}: no question ${c}`);
    }
    for (const [i, item] of (l.spot || []).entries()) {
      const w = `${at}/spot[${i}]`;
      const q = qs.get(item.questionId);
      if (!q) { problems.push(`${w}: no question ${item.questionId}`); continue; }
      const source = [q.official, ...(q.officerPhrasings || [])];
      if (!source.some((s) => s.includes(item.text))) problems.push(`${w}: the text must be copied from the form or an officer phrasing`);
      if (!item.text.toLowerCase().includes(String(item.word).toLowerCase())) problems.push(`${w}: the word must be in the text`);
      if (item.choices?.length !== 3 || new Set(item.choices).size !== 3) problems.push(`${w}: needs 3 different choices`);
      if (!(item.answer >= 0 && item.answer < (item.choices?.length || 0))) problems.push(`${w}: answer must point to a choice`);
      const def = (q.words || []).find((x) => x.word.toLowerCase() === String(item.word).toLowerCase())?.definition;
      if (def && item.choices?.[item.answer] !== def) problems.push(`${w}: the right choice must be the guide's own definition of "${item.word}"`);
    }
    for (const [i, item] of (l.understand || []).entries()) {
      if (!phrasingOf(item.questionId, item.phrasing)) problems.push(`${at}/understand[${i}]: the phrasing must be one of the guide's officer phrasings for ${item.questionId}`);
    }
    if (l.context !== undefined && (!Array.isArray(l.context) || !l.context.length || l.context.some((x) => typeof x !== 'string' || !x.trim()))) problems.push(`${at}: context must be a list of short lines`);
    const sectionQs = new Set(sections.find((s) => s.id === l.section)?.questions.map((q) => q.id) || []);
    for (const [qid, note] of Object.entries(l.questionNotes || {})) {
      if (!sectionQs.has(qid)) problems.push(`${at}: questionNotes ${qid} is not in this section`);
      if (typeof note !== 'string' || !note.trim()) problems.push(`${at}: questionNotes ${qid} needs text`);
    }
    for (const line of l.context || []) for (const url of String(line).match(/https?:\/\/\S+/g) || []) if (!url.startsWith('https://')) problems.push(`${at}: links must be https (${url})`);
    if ((l.same || []).length < 2) problems.push(`${at}: needs at least 2 Same question? items`);
    if ((l.spot || []).length < 2) problems.push(`${at}: needs at least 2 Spot the word items`);
    if ((l.understand || []).length < 1) problems.push(`${at}: needs at least 1 Say what it asks item`);
    const words = sections.find((s) => s.id === l.section)?.questions.flatMap((q) => (q.words || []).map((x) => x.word)) || [];
    if (!words.includes(l.helpWord)) problems.push(`${at}: helpWord must be one of the section's words to know`);
  }
  return problems;
}
