// Interview Day: a full practice rehearsal of the naturalization interview
// (/interview-day). Pure rules only; the page keeps everything in memory and
// saves nothing (no Base44 records, no browser storage).

// Civics test rules. Check on uscis.gov (https://www.uscis.gov/citizenship/testupdates).
// The officer stops as soon as the learner passes (passAt correct) or can no
// longer pass (failAt wrong).
export const CIVICS_TEST_RULES = {
  '2025': { maxQuestions: 20, passAt: 12, failAt: 9 },
  '2008': { maxQuestions: 10, passAt: 6, failAt: 5 },
};

// Reading and writing: up to 3 sentences, stop after the first correct one.
export const SENTENCE_TRIES = 3;

export const REHEARSAL_PARTS = [
  { id: 'oath', label: 'Oath' },
  { id: 'interview', label: 'Small talk and N-400 review' },
  { id: 'reading', label: 'Reading' },
  { id: 'writing', label: 'Writing' },
  { id: 'civics', label: 'Civics' },
  { id: 'results', label: 'Results' },
];

export const civicsRules = (version) => CIVICS_TEST_RULES[version] || CIVICS_TEST_RULES['2025'];

// `outcomes` = one boolean per civics question asked, in order.
// `available` = how many questions were loaded (may be fewer than the max).
export function civicsStatus(outcomes, version, available = Infinity) {
  const { maxQuestions, passAt, failAt } = civicsRules(version);
  const correct = outcomes.filter(Boolean).length;
  const wrong = outcomes.length - correct;
  const passed = correct >= passAt;
  const done = passed || wrong >= failAt || outcomes.length >= Math.min(maxQuestions, available);
  return { correct, wrong, passed, done };
}

// Reading or writing: `outcomes` = one boolean per sentence tried.
export function sentenceStatus(outcomes, available = SENTENCE_TRIES) {
  const passed = outcomes.some(Boolean);
  const done = passed || outcomes.length >= Math.min(SENTENCE_TRIES, available);
  return { passed, done };
}

// Speaking passes with the Mock Interview's own rule: at least 70% of the
// questions answered acceptably.
export function speakingPassed(results, questionCount) {
  if (!questionCount) return false;
  return results.filter((r) => r.is_acceptable).length >= questionCount * 0.7;
}

// The oath: "I do" (or "yes"), checked on the device only.
export const heardOathYes = (text) => /\b(i do|yes)\b/i.test(String(text || ''));

// Pick `n` random items without changing the list.
export function pickRandom(list, n, random = Math.random) {
  const copy = [...(list || [])];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

// Results rows: one per skill, each "Practice more" goes to that skill's page.
export function rehearsalResults({ speaking, reading, writing, civics }) {
  return [
    { skill: 'speaking', passed: !!speaking, practicePath: '/Practice?mode=interview' },
    { skill: 'reading', passed: !!reading, practicePath: '/Practice?mode=reading' },
    { skill: 'writing', passed: !!writing, practicePath: '/Practice?mode=dictation' },
    { skill: 'civics', passed: !!civics, practicePath: '/Practice?mode=civics' },
  ];
}
