// Amio's short lines that take turns (Amio v2: Right and Not quite), so the
// same line doesn't repeat answer after answer. Pure: the caller keeps the
// count. The keys are lines in the screen's translated wording.

export const RIGHT_LINES = ['right_line_1', 'right_line_2', 'right_line_3', 'right_line_4', 'right_line_5'];
export const KIND_LINES = ['kind_line_1', 'kind_line_2', 'kind_line_3', 'kind_line_4', 'kind_line_5'];

/** The n-th line of a set, going round (n counts from 0; any integer). */
export function rotatingLine(keys, n) {
  if (!keys?.length) return null;
  const i = ((Math.trunc(Number(n)) || 0) % keys.length + keys.length) % keys.length;
  return keys[i];
}

// One counter per set for the whole visit, so each answer gets the next line.
const counters = new Map();
export function nextLine(keys) {
  const n = counters.get(keys) || 0;
  counters.set(keys, n + 1);
  return rotatingLine(keys, n);
}
