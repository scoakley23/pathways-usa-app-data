import { describe, it, expect, beforeEach } from 'vitest';
import { DAILY_REMINDER_KEY, dailyReminderOn, setDailyReminder } from './reminderSetting';

const store = new Map();
globalThis.localStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
beforeEach(() => store.clear());

describe('daily reminder switch', () => {
  it('is on by default, off once turned off, and on again', () => {
    expect(dailyReminderOn()).toBe(true);
    setDailyReminder(false);
    expect(store.get(DAILY_REMINDER_KEY)).toBe('off');
    expect(dailyReminderOn()).toBe(false);
    setDailyReminder(true);
    expect(store.has(DAILY_REMINDER_KEY)).toBe(false);
    expect(dailyReminderOn()).toBe(true);
  });

  it('is a pathways_ key, so Delete my data clears it', () => {
    expect(DAILY_REMINDER_KEY.startsWith('pathways_')).toBe(true);
  });
});
