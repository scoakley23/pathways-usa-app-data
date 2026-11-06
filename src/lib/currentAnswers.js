import { officeholderAnswerFor, officeholderKindFor } from './officeholderQuestions';

// Answers that are not fixed in the official list ("Answers change": President,
// Vice President, Speaker, Chief Justice; "Answers vary by where you live":
// your senators, representative, governor, state capital) come ONLY from
// src/data/officeholders.json, checked against official government websites
// every month. For "your state's ..." answers the table is read with the
// learner's saved "Who Represents Me?" state and district. Nothing here is
// ever AI-written, and nothing is looked up on the web.

// What to show next to the official "Answers change / vary" text:
//   { kind: 'current', text, accepted, checkedOn, mayChangeSoon, message }
//   { kind: 'find', message }      "your state's ..." with no saved place yet
//   null                           a fixed answer (nothing to add)
export function currentAnswerFor(question, { location = null } = {}) {
  if (!question || !officeholderKindFor(question)) return null;
  const a = officeholderAnswerFor(question, location);
  if (a.needsLocation) return { kind: 'find', message: a.message };
  return {
    kind: 'current',
    text: a.accepted.join(' · '),
    accepted: a.accepted,
    checkedOn: a.checkedOn,
    mayChangeSoon: a.mayChangeSoon,
    message: a.message,
  };
}
