// Spaced review of civics questions (Prompt 7, step 4: "quick check later in
// the week"). Pure functions; the pages save the results to UserProgress.

const DAY = 24 * 60 * 60 * 1000;

// When a question is due: last_practiced + interval days. Interval 0 (or no
// date) means due now.
export function dueTime(row) {
  const last = new Date(row.last_practiced).getTime();
  const interval = Number(row.interval) || 0;
  if (!interval || Number.isNaN(last)) return Number.isNaN(last) ? 0 : last;
  return last + interval * DAY;
}

export function isDue(row, now = new Date()) {
  return dueTime(row) <= new Date(now).getTime();
}

// Due civics rows, most overdue first, at most `limit`.
export function dueForReview(rows, now = new Date(), limit = 5) {
  return (rows || [])
    .filter((r) => r.content_type === 'civics_question' && isDue(r, now))
    .sort((a, b) => dueTime(a) - dueTime(b))
    .slice(0, limit);
}

// Earliest upcoming review (Date) among rows that are not due yet, or null.
export function nextReviewDate(rows, now = new Date()) {
  const times = (rows || [])
    .filter((r) => r.content_type === 'civics_question' && !isDue(r, now))
    .map(dueTime);
  return times.length ? new Date(Math.min(...times)) : null;
}

// Same simplified SM-2 rules as Practice.jsx's handleComplete (copied, not
// shared, so Practice is unchanged). Returns the UserProgress fields to save.
export function nextSchedule(prev, isSuccess, score = null, now = new Date()) {
  const p = prev || { ease_factor: 2.5, interval: 0, consecutive_correct: 0 };
  let ease = p.ease_factor ?? 2.5;
  let interval = p.interval ?? 0;
  let consecutive = p.consecutive_correct ?? 0;

  if (isSuccess) {
    consecutive += 1;
    if (consecutive === 1) interval = 1;
    else if (consecutive === 2) interval = 6;
    else interval = Math.round((p.interval ?? 0) * (p.ease_factor ?? 2.5));
    if (consecutive >= 2) ease = Math.min(2.5, ease + 0.1);
  } else {
    consecutive = 0;
    interval = 0;
    ease = Math.max(1.3, ease - 0.2);
  }

  return {
    status: isSuccess && consecutive >= 3 ? 'mastered' : 'practicing',
    last_practiced: new Date(now).toISOString(),
    ease_factor: ease,
    interval,
    consecutive_correct: consecutive,
    last_result: isSuccess ? 'correct' : 'incorrect',
    best_score: Math.max(p.best_score || 0, score || 0),
    last_score: score || 0,
    total_attempts: (p.total_attempts || 0) + 1,
  };
}

// First lesson on a question: schedule the quick check in 3 days.
export const FIRST_REVIEW_DAYS = 3;

export function learnedProgress(prev, isCorrect, now = new Date()) {
  const score = isCorrect ? 100 : 0;
  return {
    status: 'practicing',
    last_practiced: new Date(now).toISOString(),
    interval: FIRST_REVIEW_DAYS,
    consecutive_correct: isCorrect ? 1 : 0,
    last_result: isCorrect ? 'correct' : 'incorrect',
    ease_factor: 2.5,
    total_attempts: ((prev && prev.total_attempts) || 0) + 1,
    best_score: Math.max((prev && prev.best_score) || 0, score),
    last_score: score,
  };
}
