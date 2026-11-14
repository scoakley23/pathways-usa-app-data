// The course (Prompt 4): reviewed content in the repo, never generated live by
// AI. content/course/units.json is the outline (units → sections); each
// section with a `file` has its stops and lessons in content/course/sections/.
// Learners see only "reviewed" lessons; drafts show only on a developer's
// machine with VITE_SHOW_DRAFT_LESSONS=true. The screens come in Prompts 5-8.
import outline from '../../content/course/units.json';

const sectionFiles = import.meta.glob('../../content/course/sections/*.json', { eager: true, import: 'default' });

export const STOP_TYPES = ['lesson', 'readwrite', 'speakit', 'n400', 'review', 'practiceInterview'];
export const LESSON_STEPS = ['listen', 'teachBack', 'readIt', 'writeIt', 'officer'];
export const LESSON_STATUSES = ['draft', 'reviewed'];

const byFile = Object.fromEntries(Object.entries(sectionFiles).map(([path, data]) => [path.split('/').pop(), data]));

// Every unit with its sections; a section with a file gets its stops and lessons.
export const UNITS = outline.units.map((unit) => ({
  ...unit,
  sections: unit.sections.map((s) => ({ ...s, ...(s.file ? byFile[s.file] : { stops: [], lessons: [] }) })),
}));

export const SECTION_FILES = byFile;

export function showDraftLessons(env = import.meta.env) {
  return !!env?.DEV && env?.VITE_SHOW_DRAFT_LESSONS === 'true';
}

// The lessons a learner may see.
export function visibleLessons(section, { showDrafts = showDraftLessons() } = {}) {
  return (section?.lessons || []).filter((l) => showDrafts || l.status === 'reviewed');
}

export function findLesson(lessonId, units = UNITS) {
  for (const u of units) for (const s of u.sections) {
    const lesson = (s.lessons || []).find((l) => l.id === lessonId);
    if (lesson) return { unit: u, section: s, lesson };
  }
  return null;
}

// All question ids a section asks (its lessons' questionIds, in order, once).
export function sectionQuestionIds(section) {
  const ids = [];
  for (const l of section?.lessons || []) for (const id of l.questionIds || []) if (!ids.includes(id)) ids.push(id);
  return ids;
}

/**
 * Problems with the course files, as plain sentences ([] = all good). Used by
 * src/lib/course.test.js. `questions`: { id → { question, answer } } for the
 * 2025 list; `explanations`: { question text → entry }; `reading` / `writing`:
 * Sets of allowed words; `wordsNotOnList(sentence, set)`.
 */
export function courseProblems(units, { questions, explanations, reading, writing, wordsNotOnList }) {
  const problems = [];
  const ids = new Set();
  const seen = (id, where) => {
    if (!id) problems.push(`${where}: missing id`);
    else if (ids.has(id)) problems.push(`${where}: id "${id}" is used twice`);
    else ids.add(id);
  };
  units.forEach((u, ui) => {
    seen(u.id, `unit ${ui + 1}`);
    if (u.number !== ui + 1) problems.push(`${u.id}: number should be ${ui + 1}`);
    for (const k of ['title', 'icon']) if (!u[k]) problems.push(`${u.id}: missing ${k}`);
    for (const s of u.sections) {
      seen(s.id, `${u.id} section`);
      if (!s.title) problems.push(`${s.id}: missing title`);
      if (!s.file) continue;
      if (!s.stops?.length) problems.push(`${s.id}: no stops (is ${s.file} in content/course/sections/?)`);
      const lessons = new Map((s.lessons || []).map((l) => [l.id, l]));
      for (const stop of s.stops || []) {
        if (!STOP_TYPES.includes(stop.type)) problems.push(`${s.id}/${stop.id}: unknown stop type "${stop.type}"`);
        if (!stop.title) problems.push(`${s.id}/${stop.id}: missing title`);
        if (stop.type === 'lesson' && !lessons.has(stop.lessonId)) problems.push(`${s.id}/${stop.id}: lesson "${stop.lessonId}" not in the section`);
        for (const id of stop.fromLessons || []) if (!lessons.has(id)) problems.push(`${s.id}/${stop.id}: lesson "${id}" not in the section`);
      }
      for (const l of lessons.values()) {
        const at = `${s.id}/${l.id}`;
        seen(l.id, at);
        if (!LESSON_STATUSES.includes(l.status)) problems.push(`${at}: status must be "draft" or "reviewed"`);
        if (!Array.isArray(l.questionIds) || l.questionIds.length < 1 || l.questionIds.length > 2) problems.push(`${at}: needs 1-2 questionIds`);
        for (const qid of l.questionIds || []) if (!questions[qid]) problems.push(`${at}: question "${qid}" is not a 2025 question`);
        const steps = l.steps || {};
        for (const step of LESSON_STEPS) if (!steps[step]) problems.push(`${at}: missing step ${step}`);
        const listen = steps.listen || {};
        if (!explanations[listen.explanationKey]) problems.push(`${at}: listen.explanationKey has no explanation in content/explanations/en.json`);
        if (!Array.isArray(listen.facts)) problems.push(`${at}: listen.facts must be a list`);
        if (!Array.isArray(listen.newWords) || listen.newWords.some((w) => !w?.word || !w?.meaning)) problems.push(`${at}: listen.newWords must be { word, meaning } items`);
        for (const step of ['teachBack', 'officer']) {
          const qid = steps[step]?.questionId;
          if (!l.questionIds?.includes(qid)) problems.push(`${at}: ${step}.questionId must be one of the lesson's questionIds`);
        }
        const read = steps.readIt?.sentence || '';
        const write = steps.writeIt?.sentence || '';
        if (!/\?$/.test(read.trim())) problems.push(`${at}: the Read it sentence must be a question`);
        if (!/\.$/.test(write.trim()) || /\?/.test(write)) problems.push(`${at}: the Write it sentence must be a statement`);
        const offRead = wordsNotOnList(read, reading);
        if (offRead.length) problems.push(`${at}: Read it uses words not on the reading list: ${offRead.join(', ')}`);
        const readWords = steps.readIt?.words || [];
        const wordsOfSentence = read.replace(/[?.,]/g, '').split(/\s+/).filter(Boolean);
        if (readWords.join(' ') !== wordsOfSentence.join(' ')) problems.push(`${at}: readIt.words must be the sentence's words in order`);
        const offWrite = wordsNotOnList(write, writing);
        if (offWrite.length) problems.push(`${at}: Write it uses words not on the writing list: ${offWrite.join(', ')}`);
        for (const d of steps.writeIt?.distractorWords || []) {
          const off = wordsNotOnList(d, writing);
          if (off.length) problems.push(`${at}: distractor "${d}" is not on the writing list`);
        }
      }
    }
  });
  return problems;
}
