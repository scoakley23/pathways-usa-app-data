// N-400 coaching (Prompt 9): one N-400 Guide section as a tutor lesson.
// 1. Learn it: the existing question cards (meaning, words, how the officer
//    might ask) and Say it back, introduced by the tutor.
// 2. Practice as a practice person: a short interview round answering as
//    one of the six made-up people (never about the learner).
// 3. Section end: talk to a lawyer if you're not sure your answer is "no".
// Nothing the learner says is saved; only section completion is.

const T = (en, es) => ({ en, es });
const pick = (t, language) => ({ en: t.en, mine: language === 'es' ? t.es : null });

export const N400_LINES = {
  intro: T(
    "This week: {title}. First we'll learn what the questions mean. Then you'll practice answering as a practice person — not about yourself.",
    'Esta semana: {title}. Primero vamos a aprender qué significan las preguntas. Luego va a practicar respondiendo como una persona de práctica, no sobre usted.',
  ),
  practice: T(
    "Now a short interview. Answer as {name}, using the facts on their card. This is practice only. Don't answer about yourself.",
    'Ahora, una entrevista corta. Responda como {name}, con los datos de su tarjeta. Es solo práctica. No responda sobre usted.',
  ),
  lawyer: T(
    "That's the end of this section. If you're not sure your answer is \"no\" to any of these questions, talk to a lawyer before you file.",
    'Terminamos esta sección. Si no está seguro o segura de que su respuesta a alguna de estas preguntas es "no", hable con un abogado antes de presentar su solicitud.',
  ),
  allDone: T(
    "You've finished every section of the N-400 Guide. When you're ready, see what to do next.",
    'Terminó todas las secciones de la Guía del N-400. Cuando esté listo o lista, vea qué hacer después.',
  ),
};

const fill = (t, vars) => {
  let s = t;
  for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(v);
  return s;
};
const line = (key, language, vars = {}) => {
  const p = pick(N400_LINES[key], language);
  return { en: fill(p.en, vars), mine: p.mine ? fill(p.mine, vars) : null };
};

// Only approved content is shown to learners.
export const liveSections = (sections) => sections.filter((s) => s.status === 'approved' && s.questions.some((q) => q.status === 'approved'));

// Next section to coach, in form order: the requested one if valid, else
// the first one not completed (null when all are done).
export function pickSection(sections, completed = [], requestedId) {
  const live = liveSections(sections);
  const requested = live.find((s) => s.id === requestedId);
  if (requested) return requested;
  return live.find((s) => !completed.includes(s.id)) || null;
}

// Practice person for this section: rotates through the six people.
export function personaForSection(sections, section, personas) {
  const i = Math.max(0, liveSections(sections).findIndex((s) => s.id === section.id));
  return personas[i % personas.length];
}

// Officer questions for the practice round: the first "how the officer
// might ask" phrasing of up to 3 approved questions.
export function practiceQuestions(section, max = 3) {
  return section.questions
    .filter((q) => q.status === 'approved' && q.officerPhrasings?.length)
    .slice(0, max)
    .map((q) => ({
      question: q.officerPhrasings[0],
      expected_response: "A short, truthful answer that matches the practice person's facts.",
      response_type: 'open_ended',
    }));
}

export function buildN400Lesson({ section, persona, personaFactsText, language = 'en' }) {
  const steps = [{ type: 'explain', text: line('intro', language, { title: section.title }) }];
  for (const q of section.questions.filter((x) => x.status === 'approved')) {
    steps.push({ type: 'n400-card', sectionId: section.id, question: q });
  }
  const practice = practiceQuestions(section);
  if (practice.length) {
    steps.push({ type: 'explain', text: line('practice', language, { name: persona.name }) });
    for (const question of practice) {
      steps.push({ type: 'n400-persona', question, personaId: persona.id, extra: personaFactsText });
    }
  }
  steps.push({ type: 'n400-lawyer', text: line('lawyer', language) });
  return { id: `n400-${section.id}`, title: section.title, art: 'pencil', steps };
}

export const allDoneLine = (language) => line('allDone', language);
