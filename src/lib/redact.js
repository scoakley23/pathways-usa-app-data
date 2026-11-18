// Removes personal identifiers from text a learner typed or said: emails,
// phone numbers, A-numbers and Social Security numbers. Used before text goes
// to the AI, into an email, or into History. No imports, so the server keeps
// an exact copy (supabase/functions/_shared/redact.js; a test checks they
// match: change both together).

// 7 to 9 digits, optionally with single spaces or dashes between digit groups
// (123456789, 123-456-789, 123 456 789), not followed by more digits.
const ID_DIGITS = String.raw`(?:\d[\s-]?){6,8}\d(?![\s-]?\d)`;
// An A-number after its label: "A-number 12345678", "alien number: 1234567",
// "USCIS number is 123 456 789", "número A 12345678". The label stays.
const LABELED_A_NUMBER = new RegExp(
  String.raw`\b(a[\s-]?number|alien (?:registration )?number|uscis (?:account )?number|número a)\b([\s:#-]*(?:is\s+|es\s+)?)${ID_DIGITS}`,
  'gi',
);
// An A-number itself: A123456789, A-123-456-789, a 123 456 789.
const A_NUMBER = new RegExp(String.raw`\ba[\s-]?${ID_DIGITS}`, 'gi');
// A Social Security number: 123-45-6789 or 123 45 6789.
const SSN = /\b\d{3}([-\s])\d{2}\1\d{4}\b/g;

// Learner-typed text may include an email, phone number, A-number or Social
// Security number by accident; strip them before the text is sent to the AI
// or saved. Ordinary numbers (years, question numbers, ages, zip codes) stay.
export function redactIdentifiers(text) {
  return String(text || '')
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[removed]')
    .replace(LABELED_A_NUMBER, (m, label, sep) => `${label}${sep}[removed]`)
    .replace(A_NUMBER, '[removed]')
    .replace(SSN, '[removed]')
    .replace(/\+?\d[\d\s().-]{7,}\d/g, (m) => (m.replace(/\D/g, '').length >= 10 ? '[removed]' : m))
    .trim();
}
