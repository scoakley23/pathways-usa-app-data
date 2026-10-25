// How a finished practice card went, for the stars on a poster run:
// 'right' (green), 'close' (yellow, "almost") or 'missed' (red).
// `score` is a 0–100 word or answer score when the card has one.
export const CLOSE_SCORE = 60;

export function cardOutcome(isSuccess, score = null) {
  if (isSuccess) return 'right';
  return typeof score === 'number' && score >= CLOSE_SCORE ? 'close' : 'missed';
}

// Share of the sentence's words the learner got (0–100), from wordDiff words.
export function wordScore(words = []) {
  const target = words.filter((w) => w.status !== 'extra');
  if (!target.length) return 0;
  return Math.round((target.filter((w) => w.status === 'correct').length / target.length) * 100);
}

// Counts for the end-of-run summary and the screen-reader label.
export function countOutcomes(results = []) {
  const counts = { right: 0, close: 0, missed: 0 };
  for (const r of results) if (counts[r] !== undefined) counts[r] += 1;
  return counts;
}

export function outcomesLabel(index, total, results = []) {
  const c = countOutcomes(results);
  return `Card ${index + 1} of ${total}. ${c.right} right, ${c.close} almost, ${c.missed} missed.`;
}
