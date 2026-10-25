// Badges: earned from what the app already saves (UserProgress rows and
// User.points), never from streaks or answers "in a row" (CLAUDE.md: no
// punishing streaks). A badge stays earned once it is in User.badges.

export const FULL_MARKS_MIN_CARDS = 5;
export const POINTS_BADGE = 1000;

export const BADGES = [
  { id: 'first_step', name: 'First Step', description: 'Get your first practice card right' },
  { id: 'ten_right', name: '10 Right', description: 'Get 10 different cards or questions right' },
  { id: 'fifty_right', name: '50 Right', description: 'Get 50 different cards or questions right' },
  { id: 'scholar', name: 'Civics Scholar', description: 'Master 50 civics questions' },
  { id: 'full_marks', name: 'Full Marks', description: `Get every card right in a practice run of ${FULL_MARKS_MIN_CARDS} or more` },
  { id: 'points_1000', name: '1,000 Points', description: `Earn ${POINTS_BADGE.toLocaleString('en-US')} points` },
];

const BADGE_IDS = new Set(BADGES.map((b) => b.id));

export function badgeName(id) {
  return BADGES.find((b) => b.id === id)?.name || id;
}

// An item counts as right if its last try was right or it is mastered.
const isRight = (row) => row?.last_result === 'correct' || row?.status === 'mastered';

// True when a finished run had every card right and enough cards.
export function isFullMarks(results = []) {
  return results.length >= FULL_MARKS_MIN_CARDS && Array.from(results).every((r) => r === 'right');
}

// The badge IDs earned now that are not already owned, in BADGES order.
// `run` is the finished practice run's outcomes ('right' | 'close' | 'missed'),
// only for runs whose answers are checked.
export function newBadges({ owned = [], progressRows = [], points = 0, run = null } = {}) {
  const have = new Set(owned);
  const right = progressRows.filter(isRight).length;
  const civicsMastered = progressRows.filter((r) => r?.content_type === 'civics_question' && r.status === 'mastered').length;

  const earned = {
    first_step: right >= 1,
    ten_right: right >= 10,
    fifty_right: right >= 50,
    scholar: civicsMastered >= 50,
    full_marks: !!run && isFullMarks(run),
    points_1000: (points || 0) >= POINTS_BADGE,
  };
  return BADGES.map((b) => b.id).filter((id) => earned[id] && !have.has(id));
}

// Owned badges plus new ones, dropping IDs that are no longer badges.
export function mergeBadges(owned = [], added = []) {
  return [...new Set([...owned, ...added])].filter((id) => BADGE_IDS.has(id));
}
