import { describe, it, expect, beforeEach } from 'vitest';
import { recordActivityDay, ACTIVITY_KEY } from './activityDay';

let store;
let rows;
let updates;
const entities = {
  ActivityDay: {
    filter: async (q) => rows.filter((r) => r.user_email === q.user_email && r.date === q.date),
    create: async (r) => { rows.push(r); return r; },
  },
};
const auth = { updateMe: async (d) => { updates.push(d); } };
const day = (s) => new Date(`${s}T09:30:00`);

beforeEach(() => {
  store = {};
  rows = [];
  updates = [];
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
});

describe('activity days', () => {
  const user = { email: 'Test@Example.com', pilot_id: 'abc' };

  it('saves the email and the date only, once a day', async () => {
    expect(await recordActivityDay(user, { today: day('2026-11-02'), entities, auth })).toBe(true);
    expect(await recordActivityDay(user, { today: day('2026-11-02'), entities, auth })).toBe(false);
    expect(rows).toEqual([{ user_email: 'test@example.com', date: '2026-11-02' }]);
    expect(store[ACTIVITY_KEY]).toBe('test@example.com|2026-11-02');
  });

  it('a new day gets a new row', async () => {
    await recordActivityDay(user, { today: day('2026-11-02'), entities, auth });
    await recordActivityDay(user, { today: day('2026-11-03'), entities, auth });
    expect(rows.map((r) => r.date)).toEqual(['2026-11-02', '2026-11-03']);
  });

  it('another device the same day does not add a second row', async () => {
    rows.push({ user_email: 'test@example.com', date: '2026-11-02' });
    expect(await recordActivityDay(user, { today: day('2026-11-02'), entities, auth })).toBe(false);
    expect(rows).toHaveLength(1);
  });

  it('gives the account a pilot id once', async () => {
    await recordActivityDay({ email: 'test@example.com' }, { today: day('2026-11-02'), entities, auth });
    expect(updates).toHaveLength(1);
    expect(updates[0].pilot_id).toEqual(expect.any(String));
    await recordActivityDay(user, { today: day('2026-11-03'), entities, auth });
    expect(updates).toHaveLength(1);
  });

  it('two calls at once still make one row', async () => {
    const [a, b] = await Promise.all([
      recordActivityDay(user, { today: day('2026-11-04'), entities, auth }),
      recordActivityDay(user, { today: day('2026-11-04'), entities, auth }),
    ]);
    expect([a, b].sort()).toEqual([false, true]);
    expect(rows).toHaveLength(1);
  });

  it('does nothing without a signed-in learner', async () => {
    expect(await recordActivityDay(null, { entities, auth })).toBe(false);
    expect(rows).toHaveLength(0);
  });
});
