// Checks a learner's spoken answer on their device, BEFORE it is sent to the
// AI, for patterns that look like real personal data: an A-number (the letter
// A followed by 8-9 digits), a 9-digit number or SSN-style number, or a street
// address. If found, the answer is never sent anywhere.
//
// The practice applicants' fictional addresses are allowed through so learners
// can say them as instructed.

const A_NUMBER = /\ba[\s-]?\d{8,9}\b/i;
const NINE_DIGITS = /\b\d{9}\b/;
const SSN = /\b\d{3}-\d{2}-\d{4}\b/;
const STREET_ADDRESS = /\b\d{1,5}\s+(?:[a-z0-9]+\s+){0,3}(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd|court|ct|circle|way|place|pl)\b/i;

function allowedAddressTokens(applicant) {
  if (!applicant) return [];
  const tokens = [applicant.city?.toLowerCase(), applicant.street?.toLowerCase()];
  const firstStreetWord = applicant.street?.split(' ')[0]?.toLowerCase();
  if (firstStreetWord) tokens.push(firstStreetWord);
  return tokens.filter(Boolean);
}

// Returns the matched pattern type ('a_number' | 'nine_digits' |
// 'street_address') or null when the text looks clean.
export default function findPII(text, applicant) {
  const t = (text || '').trim();
  if (!t) return null;

  if (A_NUMBER.test(t)) return 'a_number';
  if (NINE_DIGITS.test(t) || SSN.test(t)) return 'nine_digits';

  const match = t.match(STREET_ADDRESS);
  if (match) {
    const said = match[0].toLowerCase();
    const allowed = allowedAddressTokens(applicant);
    const isPracticeAddress = allowed.some((token) => said.includes(token));
    if (!isPracticeAddress) return 'street_address';
  }

  return null;
}