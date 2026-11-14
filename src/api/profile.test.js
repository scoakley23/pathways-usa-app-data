// The learner's profile and activity days through src/api/profile.js
// (Standalone Step 3, PR 2), with fake clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));
const ensurePublicProfile = vi.fn(async (email, data, defaults) => ({ profile: { id: 'pp-new', ...defaults, ...data, user_email: email }, created: true }));
vi.mock('@/api/base44Profile', () => ({
  ensurePublicProfile: (...args) => ensurePublicProfile(...args),
  normalizeEmail: (e) => (e || '').toLowerCase().trim(),
}));

const { createProfileApi } = await import('./profile');

const LEARNER = { id: 'u-1', email: 'Learner@Example.test', full_name: 'Ana', display_name: 'Ana', representative_state: 'MA', representative_district: '7', points: 3 };

// A fake of src/api/supabaseAuth.js: me() and updateMe() over one profile.
function fakeAuth(user = LEARNER) {
  let current = user ? { ...user } : null;
  return {
    me: vi.fn(async () => { if (!current) throw Object.assign(new Error('Not signed in'), { status: 401 }); return current; }),
    updateMe: vi.fn(async (patch) => {
      const clean = Object.fromEntries(Object.entries(patch).filter(([k]) => ['display_name', 'representative_state', 'representative_district'].includes(k)));
      current = { ...current, ...clean };
      return current;
    }),
  };
}

// activity_days on a fake Supabase: (user_id, date) is unique.
function fakeSupabase() {
  const rows = [];
  const calls = [];
  return {
    rows,
    calls,
    from: (table) => ({
      upsert: (row, opts) => ({
        select: async () => {
          calls.push({ table, row, opts });
          if (rows.some((r) => r.user_id === row.user_id && r.date === row.date)) return { data: [], error: null };
          rows.push(row);
          return { data: [{ date: row.date }], error: null };
        },
      }),
    }),
  };
}

describe('profile on Supabase (the profiles row)', () => {
  it('reads the display name and representative from the signed-in user, id = login id', async () => {
    const api = createProfileApi({ provider: 'supabase', auth: fakeAuth() });
    expect(await api.getPublic()).toEqual({ id: 'u-1', display_name: 'Ana', representative_state: 'MA', representative_district: '7' });
  });

  it('signed out: no profile', async () => {
    const api = createProfileApi({ provider: 'supabase', auth: fakeAuth(null) });
    expect(await api.getPublic()).toBeNull();
  });

  it('saving the state and district updates the profile only (old AI-found names are not a column)', async () => {
    const auth = fakeAuth();
    const api = createProfileApi({ provider: 'supabase', auth });
    const saved = await api.updatePublic('u-1', { representative_state: 'CA', representative_district: '12', representative_data: null });
    expect(auth.updateMe).toHaveBeenCalledWith({ representative_state: 'CA', representative_district: '12', representative_data: null });
    expect(saved).toMatchObject({ representative_state: 'CA', representative_district: '12' });
    expect(saved).not.toHaveProperty('representative_data');
  });

  it('savePublic never "creates": the profile exists from sign-up', async () => {
    const api = createProfileApi({ provider: 'supabase', auth: fakeAuth() });
    expect(await api.savePublic({ display_name: 'Ana P.' }, { points: 0 })).toEqual({
      profile: { id: 'u-1', display_name: 'Ana P.', representative_state: 'MA', representative_district: '7' },
      created: false,
    });
    expect(ensurePublicProfile).not.toHaveBeenCalled();
  });
});

describe('activity days on Supabase', () => {
  it('one row per day, date only, keyed by the login', async () => {
    const sb = fakeSupabase();
    const api = createProfileApi({ provider: 'supabase', auth: fakeAuth(), supabase: sb });
    expect(await api.markActiveDay('2026-11-14')).toBe(true);
    expect(await api.markActiveDay('2026-11-14')).toBe(false);
    expect(await api.markActiveDay('2026-11-15')).toBe(true);
    expect(sb.rows).toEqual([{ user_id: 'u-1', date: '2026-11-14' }, { user_id: 'u-1', date: '2026-11-15' }]);
    expect(sb.calls[0].opts).toEqual({ onConflict: 'user_id,date', ignoreDuplicates: true });
  });
});

describe('Base44 (switch off) does what the screens did before', () => {
  const entities = () => ({
    PublicProfile: { filter: vi.fn(async () => [{ id: 'pp1', display_name: 'Ana' }]), update: vi.fn(async (id, p) => ({ id, ...p })) },
    ActivityDay: { filter: vi.fn(async () => []), create: vi.fn(async (r) => r) },
  });

  it('reads the newest PublicProfile by email (lowercase)', async () => {
    const e = entities();
    const api = createProfileApi({ provider: 'base44', base44: { entities: e }, auth: fakeAuth() });
    expect(await api.getPublic()).toEqual({ id: 'pp1', display_name: 'Ana' });
    expect(e.PublicProfile.filter).toHaveBeenCalledWith({ user_email: 'learner@example.test' }, '-created_date', 1);
  });

  it('updates by record id; savePublic uses ensurePublicProfile with defaults', async () => {
    const e = entities();
    const api = createProfileApi({ provider: 'base44', base44: { entities: e }, auth: fakeAuth() });
    await api.updatePublic('pp1', { representative_state: 'TX' });
    expect(e.PublicProfile.update).toHaveBeenCalledWith('pp1', { representative_state: 'TX' });
    const res = await api.savePublic({ display_name: 'Ana' }, { points: 3, badges_count: 0 });
    expect(ensurePublicProfile).toHaveBeenCalledWith('Learner@Example.test', { display_name: 'Ana' }, { points: 3, badges_count: 0 });
    expect(res.created).toBe(true);
  });

  it('activity: email + date, only when missing', async () => {
    const e = entities();
    const api = createProfileApi({ provider: 'base44', base44: { entities: e }, auth: fakeAuth() });
    expect(await api.markActiveDay('2026-11-14')).toBe(true);
    expect(e.ActivityDay.create).toHaveBeenCalledWith({ user_email: 'learner@example.test', date: '2026-11-14' });
    e.ActivityDay.filter.mockResolvedValueOnce([{ id: 'a1' }]);
    expect(await api.markActiveDay('2026-11-14')).toBe(false);
    expect(e.ActivityDay.create).toHaveBeenCalledTimes(1);
  });
});
