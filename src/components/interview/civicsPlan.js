// The civics portion of the N-400 review interview, following the official
// rules for the 2025 civics test (N-400 applications filed on or after
// October 20, 2025):
//   - Standard: up to 20 questions from the 128-question bank, pass at 12
//     correct, ends early at 9 incorrect.
//   - 65/20 special consideration (65 or older + 20+ years as a permanent
//     resident): 10 questions from the 20 designated "asterisk" questions,
//     pass at 6 correct, ends early at 5 incorrect.

// The official 20 designated questions for the 65/20 special consideration
// (the asterisked questions in the USCIS 2025 civics test bank).
export const SPECIAL_65_20_QUESTIONS = [
  'What is the supreme law of the land?',
  'How many amendments does the U.S. Constitution have?',
  'What is the economic system of the United States?',
  'Name one power of the U.S. Congress.',
  'What is the name of the Speaker of the House of Representatives now?',
  'The President of the United States is elected for how many years?',
  'What is the name of the President of the United States now?',
  'What is the name of the Vice President of the United States now?',
  'Who vetoes bills?',
  'What is the highest court in the United States?',
  'Who is the governor of your state now?',
  'What do we show loyalty to when we say the Pledge of Allegiance?',
  'Who lived in America before the Europeans arrived?',
  'Who wrote the Declaration of Independence?',
  'George Washington is famous for many things. Name one.',
  'Abraham Lincoln is famous for many things. Name one.',
  'Martin Luther King, Jr. is famous for many things. Name one.',
  'What major event happened on September 11, 2001 in the United States?',
  'Why does the flag have 13 stripes?',
  'Name three national U.S. holidays.',
];

const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Builds the civics question set and pass/stop thresholds for a practice
// applicant, based on their age and years as a resident.
export function buildCivicsPlan(applicant, civicsBank) {
  const bank = (civicsBank || []).filter((q) => q.version === '2025' && q.question);
  const is6520 = applicant.age >= 65 && applicant.yearsInUS >= 20;

  let pool = bank;
  if (is6520) {
    const special = new Set(SPECIAL_65_20_QUESTIONS.map(norm));
    const matched = bank.filter((q) => special.has(norm(q.question)));
    if (matched.length >= 10) pool = matched;
  }

  const askCount = is6520 ? 10 : 20;
  const questions = shuffle(pool)
    .slice(0, askCount)
    .map((q) => ({
      question: q.question,
      expected_response: q.answer,
      section: 'civics_2025',
    }));

  return {
    questions,
    is6520,
    passAt: is6520 ? 6 : 12,
    stopWrong: is6520 ? 5 : 9,
  };
}