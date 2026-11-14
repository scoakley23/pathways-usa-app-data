// The one review schedule (Prompt 4, saved in Supabase `review_items`): each
// missed or practiced civics question sits in a box 1-5. A right answer moves
// it up one box; a wrong answer sends it back to box 1. The box says how many
// days until it is due again. No streaks or penalties: just when to see it
// next. (The old spaced-review fields on Base44 `UserProgress`,
// src/lib/spacedReview.js, stay until Standalone Step 3 moves the screens.)

export const BOX_DAYS = { 1: 1, 2: 3, 3: 7, 4: 14, 5: 30 };
export const FIRST_BOX = 1;
export const LAST_BOX = 5;

const ymd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export function addDays(date, days) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + days);
  return d;
}

const clampBox = (box) => Math.min(LAST_BOX, Math.max(FIRST_BOX, Number.isInteger(box) ? box : FIRST_BOX));

// The next box after an answer: right → up one (stays at 5), wrong → 1.
export function nextBox(box, correct) {
  return correct ? Math.min(LAST_BOX, clampBox(box) + 1) : FIRST_BOX;
}

// The review_items row after an answer: { question_id, box, next_due }
// (next_due as yyyy-mm-dd, a date only). `item` may be null for a question
// seen for the first time.
export function afterAnswer(item, questionId, correct, today = new Date()) {
  const box = item ? nextBox(item.box, correct) : (correct ? FIRST_BOX + 1 : FIRST_BOX);
  return { question_id: item?.question_id || questionId, box, next_due: ymd(addDays(today, BOX_DAYS[box])) };
}

// Items due on or before today, oldest first; at most `limit`.
export function dueItems(items = [], today = new Date(), limit = Infinity) {
  const t = ymd(today);
  return items
    .filter((i) => i && i.next_due && i.next_due <= t)
    .sort((a, b) => a.next_due.localeCompare(b.next_due) || a.box - b.box)
    .slice(0, limit);
}
