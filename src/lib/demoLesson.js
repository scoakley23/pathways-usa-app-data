import { splitOfficialAnswers } from './practiceChecks';

// DEMO CONTENT for the admin-only Tutor Demo page. Questions and accepted
// answers always come from the CivicsQuestion records passed in (the USCIS
// list in Base44); only the explanations, the dictation sentence, and the
// multiple-choice wrong options are written here. Prompt 7 replaces this
// with reviewed explanations for every question.
const DEMO = [
  {
    match: /supreme law/i,
    explain: {
      en: "The Constitution is the most important set of rules in the United States. Every law the government makes must follow it. If a law goes against the Constitution, courts can stop it. That is why it is called the “supreme” law: the highest law.",
      es: 'La Constitución es el conjunto de reglas más importante de los Estados Unidos. Todas las leyes que hace el gobierno deben respetarla. Si una ley va en contra de la Constitución, los tribunales pueden detenerla. Por eso se llama la ley “suprema”: la ley más alta.',
    },
    sentence: 'The Constitution is the supreme law.',
    check: {
      en: 'Quick check: What is the supreme law of the United States?',
      es: 'Repaso rápido: ¿Cuál es la ley suprema de los Estados Unidos?',
    },
    wrong: ['the Declaration of Independence', 'the Pledge of Allegiance'],
  },
  {
    match: /what does the constitution do/i,
    explain: {
      en: 'The Constitution was written in 1787. It explains how the government is organized: what each part of the government does, and the limits on its power. It also protects the basic rights of the people.',
      es: 'La Constitución se escribió en 1787. Explica cómo está organizado el gobierno: qué hace cada parte del gobierno y cuáles son los límites de su poder. También protege los derechos básicos de las personas.',
    },
    check: {
      en: 'Quick check: Which one is something the Constitution does?',
      es: 'Repaso rápido: ¿Cuál de estas cosas hace la Constitución?',
    },
    wrong: ['chooses the President', 'writes the laws for each city'],
  },
];

const COMING_SOON = { en: 'Explanation coming soon.', es: 'Explicación disponible pronto.' };

const text = (t, language) => ({ en: t.en, mine: language === 'es' ? t.es : null });

// Builds the demo lesson from 2025 CivicsQuestion records.
export function buildDemoLesson(questions, language = 'en') {
  const pool = (questions || []).filter((q) => q.version === '2025' && q.answer);
  const steps = [];

  const picked = DEMO.map((d) => ({ d, q: pool.find((q) => d.match.test(q.question)) })).filter((x) => x.q);

  if (picked.length === DEMO.length) {
    for (const { d, q } of picked) {
      const correct = splitOfficialAnswers(q.answer)[0];
      steps.push({ type: 'explain', text: text(d.explain, language) });
      steps.push({ type: 'show-english', question: q });
      steps.push({ type: 'practice-speaking', question: q });
      if (d.sentence) steps.push({ type: 'practice-writing', sentence: d.sentence });
      steps.push({
        type: 'check-understanding',
        prompt: text(d.check, language),
        options: [d.wrong[0], correct, d.wrong[1]],
        correct,
      });
    }
  } else {
    // Demo questions not in this database: use the first two 2025 questions.
    for (const q of pool.slice(0, 2)) {
      steps.push({ type: 'explain', text: text(COMING_SOON, language) });
      steps.push({ type: 'show-english', question: q });
      steps.push({ type: 'practice-speaking', question: q });
    }
  }

  return { id: 'demo', title: 'Demo lesson', steps };
}
