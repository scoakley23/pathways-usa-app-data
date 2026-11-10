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

// The real test's pass rule for a civics version (shown on "Round complete").
export function passRule(version) {
  return String(version) === '2008' ? { need: 6, of: 10 } : { need: 12, of: 20 };
}

// The questions to go over again after a round: every card that was counted
// and not right, in run order. Uncounted cards (results[i] undefined, e.g. an
// officeholder question the app can't grade) are left out.
export function missedItems(items = [], results = []) {
  return items.filter((_, i) => results[i] !== undefined && results[i] !== 'right');
}

// Where the star sits on the road progress bar (0–1): the share of the
// round's questions answered so far. `answered` = the current question has
// its result, so the star moves one step.
export function roadFraction(index = 0, total = 0, answered = false) {
  if (!total) return 0;
  return Math.min(1, Math.max(0, (index + (answered ? 1 : 0)) / total));
}
