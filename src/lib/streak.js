// The kind streak (Prompt 7): days in a row the learner opened the app,
// from the saved days the app was opened (read by src/api/profile.js),
// never stored twice. One missed day a week (Monday to Sunday) is a rest day: it doesn't
// break the streak (and doesn't add to it). Today not opened yet never
// breaks it either: the day isn't over.

const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// The Monday of the week a date is in, as YYYY-MM-DD.
function weekOf(d) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
  const back = (x.getDay() + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - back);
  return ymd(x);
}

/**
 * activeDays: dates ('YYYY-MM-DD') the learner opened the app.
 * Returns { days, restUsed } where restUsed = rest days taken in the streak.
 */
export function streak(activeDays = [], today = new Date()) {
  const active = new Set(activeDays);
  if (!active.size) return { days: 0, restUsed: 0 };
  const earliest = [...active].sort()[0];
  const restWeeks = new Set();
  let days = 0;
  const d = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  if (!active.has(ymd(d))) d.setDate(d.getDate() - 1); // today isn't over
  for (let i = 0; i < 1000; i++) {
    const key = ymd(d);
    if (key < earliest) break;
    if (active.has(key)) {
      days += 1;
    } else {
      const week = weekOf(d);
      if (restWeeks.has(week)) break; // a second missed day this week
      restWeeks.add(week);
    }
    d.setDate(d.getDate() - 1);
  }
  return { days, restUsed: restWeeks.size };
}
