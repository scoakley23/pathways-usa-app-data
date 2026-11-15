// The daily reminder switch (Prompt 11, Settings): the in-app "Your lesson
// for today is ready" notice is on unless the learner turns it off. Kept on
// this device only; Delete my data clears it (every pathways_ key). No
// reminder time and no push.
export const DAILY_REMINDER_KEY = 'pathways_daily_reminder';

export function dailyReminderOn() {
  try { return localStorage.getItem(DAILY_REMINDER_KEY) !== 'off'; } catch (e) { return true; }
}

export function setDailyReminder(on) {
  try {
    if (on) localStorage.removeItem(DAILY_REMINDER_KEY);
    else localStorage.setItem(DAILY_REMINDER_KEY, 'off');
  } catch (e) { /* storage blocked: the default (on) stays */ }
}
