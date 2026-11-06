// Which official civics questions ask about a current officeholder or a state
// capital, and how they are graded: ONLY from src/data/officeholders.json via
// src/lib/officeholders.js. These questions never go to the AI or a web lookup.
//
// CivicsQuestion records carry no USCIS question number, so each row below is
// matched on its official wording (from the USCIS lists in `source`).
// detectOfficeholderKind() is only a backup, for wording that drifts slightly.

import { detectOfficeholderKind, gradeOfficeholderAnswer, normalizeText, OFFICEHOLDERS_CHECKED_ON } from './officeholders.js';

const PDF_2008 = 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/OoC_100_Questions_2008_Civics_Test_V1.pdf';
const PDF_2025 = 'https://www.uscis.gov/sites/default/files/document/questions-and-answers/2025-Civics-Test-128-Questions-and-Answers.pdf';

export const OFFICEHOLDER_QUESTIONS = [
  { version: '2008', number: 20, office: 'senator', question: 'Who is one of your state’s U.S. Senators now?', source: PDF_2008 },
  { version: '2008', number: 23, office: 'representative', question: 'Name your U.S. Representative.', source: PDF_2008 },
  { version: '2008', number: 28, office: 'president', question: 'What is the name of the President of the United States now?', source: PDF_2008 },
  { version: '2008', number: 29, office: 'vicePresident', question: 'What is the name of the Vice President of the United States now?', source: PDF_2008 },
  { version: '2008', number: 40, office: 'chiefJustice', question: 'Who is the Chief Justice of the United States now?', source: PDF_2008 },
  { version: '2008', number: 43, office: 'governor', question: 'Who is the Governor of your state now?', source: PDF_2008 },
  { version: '2008', number: 44, office: 'capital', question: 'What is the capital of your state?', source: PDF_2008 },
  { version: '2008', number: 47, office: 'speaker', question: 'What is the name of the Speaker of the House of Representatives now?', source: PDF_2008 },
  { version: '2025', number: 23, office: 'senator', question: 'Who is one of your state’s U.S. senators now?', source: PDF_2025 },
  { version: '2025', number: 29, office: 'representative', question: 'Name your U.S. representative.', source: PDF_2025 },
  { version: '2025', number: 30, office: 'speaker', question: 'What is the name of the Speaker of the House of Representatives now?', source: PDF_2025 },
  { version: '2025', number: 38, office: 'president', question: 'What is the name of the President of the United States now?', source: PDF_2025 },
  { version: '2025', number: 39, office: 'vicePresident', question: 'What is the name of the Vice President of the United States now?', source: PDF_2025 },
  { version: '2025', number: 57, office: 'chiefJustice', question: 'Who is the Chief Justice of the United States now?', source: PDF_2025 },
  { version: '2025', number: 61, office: 'governor', question: 'Who is the governor of your state now?', source: PDF_2025 },
  { version: '2025', number: 62, office: 'capital', question: 'What is the capital of your state?', source: PDF_2025 },
];

// Some question texts carry a "(2025 test)"-style note at the end.
const stripNote = (text) => String(text || '').replace(/\s*\([^)]*(?:2008|2025)[^)]*\)\s*$/i, '');
const key = (text) => normalizeText(stripNote(text));

/** The mapping row for a question ({ question, version }), or null. */
export function officeholderRowFor(question) {
  if (!question?.question) return null;
  const k = key(question.question);
  const rows = OFFICEHOLDER_QUESTIONS.filter((r) => key(r.question) === k);
  return rows.find((r) => r.version === String(question.version || '')) || rows[0] || null;
}

/**
 * The officeholders.js KIND for a civics question, or null for every other
 * question. The mapping comes first; detectOfficeholderKind() catches wording
 * that differs slightly from the official text, so such a question still never
 * reaches the AI.
 */
export function officeholderKindFor(question) {
  if (!question?.question) return null;
  const row = officeholderRowFor(question);
  if (row) return row.office;
  return detectOfficeholderKind(stripNote(question.question));
}

/**
 * Grades a typed or spoken answer from the table (no AI, no network).
 * `location` = { state, district } from the learner's saved "Who Represents Me?"
 * result, or null. Returns null when the question isn't an officeholder question.
 */
export function gradeCivicsOfficeholder(question, answer, location = null) {
  const kind = officeholderKindFor(question);
  if (!kind) return null;
  return gradeOfficeholderAnswer({ kind, answer: answer || '', state: location?.state, district: location?.district });
}

/** What to show as the answer (no learner answer needed): accepted names, notes, date. */
export function officeholderAnswerFor(question, location = null) {
  const r = gradeCivicsOfficeholder(question, '', location);
  if (!r) return null;
  return {
    accepted: r.accepted,
    message: r.message || '',
    needsLocation: !!r.needsLocation,
    mayChangeSoon: !!r.mayChangeSoon,
    checkedOn: r.checkedOn || OFFICEHOLDERS_CHECKED_ON,
  };
}

/** The one-line answer for a poster: accepted answers, or the note when there are none. */
export function officeholderAnswerLine(answer) {
  if (!answer) return '';
  if (answer.accepted.length) return answer.accepted.join(' · ');
  if (answer.needsLocation) return 'It depends on where you live.';
  return 'Check the official answer before your interview.';
}

export const FIND_REPRESENTATIVE_PATH = '/learn#find-representative';
export const MAY_CHANGE_SOON = 'This may change soon. At your interview, name the person serving that day.';
export const checkedOnText = (date) => `Checked on official government websites on ${date}`;
