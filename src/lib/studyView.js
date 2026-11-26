// The Practice page: pure helpers, no storage.

export const PRACTICE_PARTS = ['reading', 'writing', 'civics', 'speaking'];
const LEVEL_RANK = { start_here: 0, getting_there: 1, strong: 2 };

// "Suggested for you" on the Practice tab: the part with the lowest
// quick-check level (a part not checked yet counts lowest), first in
// Practice order on a tie. No quick check at all → Reading.
export function suggestPart(levels) {
  if (!levels || !PRACTICE_PARTS.some((p) => levels[p])) return PRACTICE_PARTS[0];
  let best = null;
  for (const part of PRACTICE_PARTS) {
    const rank = LEVEL_RANK[levels[part]] ?? -1;
    if (best === null || rank < best.rank) best = { part, rank };
  }
  return best.part;
}

// A practice row's status from its quick-check level: 'ready' (strong),
// 'getting_there', 'start_here' or 'not_checked'.
export function partStatus(level) {
  if (level === 'strong') return 'ready';
  return LEVEL_RANK[level] !== undefined ? level : 'not_checked';
}
