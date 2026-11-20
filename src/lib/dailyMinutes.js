// The plan picker's minutes (CLAUDE.md "Minutes"): "about 5 / 10 / 15 min a
// day" is the only place minutes appear, and they map to lessons_per_day
// 1 / 2 / 3. Nothing else stores or shows minutes.

export const MINUTE_CHOICES = [
  { minutes: 5, perDay: 1 },
  { minutes: 10, perDay: 2 },
  { minutes: 15, perDay: 3 },
];

// First open starts on the middle choice (2 a day, "steady"), the same pace
// Your plan recommends when there is no interview month.
export const DEFAULT_PER_DAY = 2;

export const minutesForPerDay = (perDay) => MINUTE_CHOICES.find((c) => c.perDay === Number(perDay))?.minutes ?? null;
export const perDayForMinutes = (minutes) => MINUTE_CHOICES.find((c) => c.minutes === Number(minutes))?.perDay ?? null;
