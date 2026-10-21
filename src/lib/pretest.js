// "Start with a quick check" (Prompt 4): build the pretest lesson and turn its
// answers into one level per skill. Only the levels are ever saved.

export const PRETEST_PARTS = ['civics', 'reading', 'writing', 'speaking'];
export const LEVELS = {
  strong: { label: 'Strong', es: 'Fuerte' },
  getting_there: { label: 'Getting there', es: 'Va por buen camino' },
  start_here: { label: 'Start here', es: 'Empiece aquí' },
};
export const READING_PASS = 70; // same bar as reading practice

const COUNTS = { civics: 10, reading: 3, writing: 3, speaking: 2 };

// Fisher–Yates on a copy. `rand` is injectable for tests.
export function sample(list, n, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

// 2025 questions only, without answers that change (current officials) or
// depend on where the learner lives; no duplicates.
export function pickCivicsQuestions(questions, n = COUNTS.civics, rand) {
  const seen = new Set();
  const pool = (questions || []).filter((q) => {
    if (q.version !== '2025' || !q.answer || !q.question) return false;
    if (/^Answers (change|vary)/.test(q.answer)) return false;
    if (seen.has(q.question)) return false;
    seen.add(q.question);
    return true;
  });
  return sample(pool, n, rand);
}

const T = (en, es) => ({ en, es });
const INTROS = {
  civics: {
    art: 'capitol',
    title: T('Civics', 'Educación cívica'),
    text: T(
      "First, 10 civics questions. Answer out loud in English. It's okay not to know. This only helps us plan.",
      'Primero, 10 preguntas de educación cívica. Conteste en voz alta, en inglés. No pasa nada si no sabe. Esto solo nos ayuda a planear.',
    ),
  },
  reading: {
    art: 'book',
    title: T('Reading', 'Lectura'),
    text: T('Now read 3 sentences out loud.', 'Ahora lea 3 oraciones en voz alta.'),
  },
  writing: {
    art: 'pencil',
    title: T('Writing', 'Escritura'),
    text: T('Now listen to 3 sentences and write them in English.', 'Ahora escuche 3 oraciones y escríbalas en inglés.'),
  },
  speaking: {
    art: 'speech',
    title: T('Speaking', 'Conversación'),
    text: T(
      'Last part: 2 questions like the officer asks at the start of the interview. Answer in English.',
      'Última parte: 2 preguntas como las que hace el oficial al inicio de la entrevista. Conteste en inglés.',
    ),
  },
};

const pick = (t, language) => ({ en: t.en, mine: language === 'es' ? t.es : null });

// sources: { civics: CivicsQuestion[], reading: ReadingSentence[],
//            writing: Sentence[], speaking: InterviewQuestion[] (small_talk) }
export function buildPretestLesson(sources, language = 'en', rand) {
  const items = {
    civics: pickCivicsQuestions(sources.civics, COUNTS.civics, rand),
    reading: sample((sources.reading || []).filter((s) => s.text), COUNTS.reading, rand),
    writing: sample((sources.writing || []).filter((s) => s.text), COUNTS.writing, rand),
    speaking: sample((sources.speaking || []).filter((q) => q.section === 'small_talk'), COUNTS.speaking, rand),
  };

  const steps = [];
  for (const part of PRETEST_PARTS) {
    if (!items[part].length) continue;
    const intro = INTROS[part];
    steps.push({ type: 'part-intro', part, art: intro.art, title: pick(intro.title, language), text: pick(intro.text, language) });
    for (const item of items[part]) {
      if (part === 'civics') steps.push({ type: 'practice-speaking', part, mode: 'check', question: item });
      if (part === 'reading') steps.push({ type: 'practice-reading', part, mode: 'check', sentence: item.text });
      if (part === 'writing') steps.push({ type: 'practice-writing', part, mode: 'check', sentence: item.text });
      if (part === 'speaking') steps.push({ type: 'practice-interview', part, mode: 'check', question: item });
    }
  }
  return { id: 'pretest', title: 'Quick check', art: 'compass', skippableParts: true, steps };
}

// Cutoffs. A skipped or empty part has no level (null = "Not checked yet").
export function levelFor(part, outcomes) {
  if (!outcomes || outcomes.length === 0) return null;
  if (part === 'speaking') {
    const avg = outcomes.reduce((s, o) => s + (o.score || 0), 0) / outcomes.length;
    return avg >= 80 ? 'strong' : avg >= 60 ? 'getting_there' : 'start_here';
  }
  const right = outcomes.filter((o) => o.correct).length;
  const ratio = right / outcomes.length;
  if (part === 'civics') return right >= 8 || ratio >= 0.8 ? 'strong' : ratio >= 0.5 ? 'getting_there' : 'start_here';
  return ratio === 1 ? 'strong' : ratio >= 0.6 ? 'getting_there' : 'start_here';
}

// states: { [stepIndex]: { outcome } } from TutorLesson; skipped: Set of parts.
// Unanswered steps in a part that was started count as not correct.
export function scorePretest(lesson, states = {}, skipped = new Set()) {
  const levels = {};
  for (const part of PRETEST_PARTS) {
    const idx = lesson.steps.map((s, i) => (s.part === part && s.type !== 'part-intro' ? i : -1)).filter((i) => i >= 0);
    if (skipped.has(part) || idx.length === 0) {
      levels[part] = null;
      continue;
    }
    const outcomes = idx.map((i) => states[i]?.outcome || { correct: false, score: 0 });
    levels[part] = levelFor(part, outcomes);
  }
  return levels;
}

// The only pretest data saved to the account.
export function toSavedLevels(levels, now = new Date()) {
  const clean = {};
  for (const part of PRETEST_PARTS) clean[part] = LEVELS[levels?.[part]] ? levels[part] : null;
  return { ...clean, checked_at: now.toISOString() };
}
