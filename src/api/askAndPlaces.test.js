// Ask Amio history, notifications and saved places through src/api
// (Standalone Step 3, PR 6), with fake clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createAskHistoryApi } = await import('./askHistory');
const { createNotificationsApi } = await import('./notifications');
const { createSavedPlacesApi } = await import('./savedPlaces');
const { fakeSupabase } = await import('./testing/fakeSupabase');

const ANA = { id: 'u-ana', email: 'Ana@Example.test' };
const authAs = (user) => ({ me: vi.fn(async () => user) });

const tables = () => ({
  ai_study_logs: [
    { id: 'a1', user_id: 'u-ana', question: 'What is Congress?', answer: 'The group that makes laws.', created_at: '2026-11-10T10:00:00Z' },
    { id: 'a2', user_id: 'u-ana', question: 'What is the Senate?', answer: 'One part of Congress.', created_at: '2026-11-12T10:00:00Z' },
    { id: 'a3', user_id: 'u-ben', question: 'Ben\'s question', answer: 'x', created_at: '2026-11-13T10:00:00Z' },
  ],
  notifications: [
    { id: 'n1', user_id: 'u-ana', title: 'Your practice for today', read: false, created_at: '2026-11-13T10:00:00Z' },
    { id: 'n2', user_id: 'u-ben', title: 'Ben', read: false, created_at: '2026-11-13T11:00:00Z' },
  ],
  saved_places: [
    { user_id: 'u-ana', resource_id: 'place-1', created_at: '2026-11-01T00:00:00Z' },
    { user_id: 'u-ben', resource_id: 'place-2', created_at: '2026-11-02T00:00:00Z' },
  ],
});

const onSupabase = () => {
  const sb = fakeSupabase(tables());
  const opts = { provider: 'supabase', supabase: sb, auth: authAs(ANA) };
  return { sb, ask: createAskHistoryApi(opts), notes: createNotificationsApi(opts), places: createSavedPlacesApi(opts) };
};

describe('Ask Amio history on Supabase', () => {
  it('only the learner\'s own questions, newest first', async () => {
    const { ask } = onSupabase();
    const rows = await ask.list();
    expect(rows.map((r) => r.id)).toEqual(['a2', 'a1']);
    expect(rows[0].created_date).toBe('2026-11-12T10:00:00Z');
  });

  it('saves the question, answer and language with the login id, nothing else', async () => {
    const { ask, sb } = onSupabase();
    await ask.add({ question: 'What does "federal" mean?', answer: 'The national government.', language: 'es' });
    const row = sb.tables.ai_study_logs.at(-1);
    expect(row).toMatchObject({ user_id: 'u-ana', question: 'What does "federal" mean?', answer: 'The national government.', language: 'es' });
    expect(Object.keys(row).sort()).toEqual(['answer', 'id', 'language', 'question', 'user_id']);
  });
});

describe('notifications on Supabase', () => {
  it('lists, creates, marks read and deletes only the learner\'s own', async () => {
    const { notes, sb } = onSupabase();
    expect((await notes.list({ limit: 20 })).map((n) => n.id)).toEqual(['n1']);
    await notes.create({ user_email: 'x@example.test', type: 'system', title: 'Your practice for today', message: 'A few short tasks are ready.', link: '/', read: false });
    expect(sb.tables.notifications.at(-1)).toMatchObject({ user_id: 'u-ana', type: 'system', read: false });
    expect(sb.tables.notifications.at(-1)).not.toHaveProperty('user_email');
    await notes.markRead('n1');
    await notes.markRead('n2'); // Ben's: not changed
    expect(sb.tables.notifications.find((n) => n.id === 'n1').read).toBe(true);
    expect(sb.tables.notifications.find((n) => n.id === 'n2').read).toBe(false);
    await notes.remove('n2');
    expect(sb.tables.notifications.some((n) => n.id === 'n2')).toBe(true);
    await notes.remove('n1');
    expect(sb.tables.notifications.some((n) => n.id === 'n1')).toBe(false);
  });
});

describe('saved places on Supabase', () => {
  it('lists the learner\'s places with the place id as id', async () => {
    const { places } = onSupabase();
    expect(await places.list()).toEqual([
      { user_id: 'u-ana', resource_id: 'place-1', created_at: '2026-11-01T00:00:00Z', id: 'place-1', created_date: '2026-11-01T00:00:00Z' },
    ]);
  });

  it('saving twice keeps one row; removing takes it away; place id only', async () => {
    const { places, sb } = onSupabase();
    await places.add('place-9');
    await places.add('place-9');
    const mine = sb.tables.saved_places.filter((r) => r.user_id === 'u-ana' && r.resource_id === 'place-9');
    expect(mine).toHaveLength(1);
    expect(Object.keys(mine[0]).sort()).toEqual(['id', 'resource_id', 'user_id']);
    await places.remove('place-9');
    expect(sb.tables.saved_places.some((r) => r.resource_id === 'place-9')).toBe(false);
    expect(sb.tables.saved_places.some((r) => r.resource_id === 'place-2')).toBe(true);
  });
});

describe('Base44 (switch off) makes the same calls as before', () => {
  const entity = () => ({
    filter: vi.fn(async () => []), create: vi.fn(async (d) => ({ id: 'new', ...d })),
    update: vi.fn(async () => ({})), delete: vi.fn(async () => ({})),
  });
  const setup44 = () => {
    const entities = { AIStudyLog: entity(), Notification: entity(), SavedPlace: entity() };
    const opts = { provider: 'base44', base44: { entities }, auth: authAs(ANA) };
    return { entities, ask: createAskHistoryApi(opts), notes: createNotificationsApi(opts), places: createSavedPlacesApi(opts) };
  };

  it('history: filter by email newest first; create with the email and a time', async () => {
    const { entities, ask } = setup44();
    await ask.list();
    expect(entities.AIStudyLog.filter).toHaveBeenCalledWith({ user_email: 'Ana@Example.test' }, '-created_at');
    await ask.add({ question: 'Q?', answer: 'A.', language: 'en' });
    expect(entities.AIStudyLog.create).toHaveBeenCalledWith(expect.objectContaining({ user_email: 'Ana@Example.test', question: 'Q?', answer: 'A.', language: 'en', created_at: expect.any(String) }));
  });

  it('notifications and saved places as before', async () => {
    const { entities, notes, places } = setup44();
    await notes.list({ limit: 20 });
    expect(entities.Notification.filter).toHaveBeenCalledWith({ user_email: 'ana@example.test' }, '-created_date', 20);
    await notes.markRead('n1');
    expect(entities.Notification.update).toHaveBeenCalledWith('n1', { read: true });
    await notes.remove('n1');
    expect(entities.Notification.delete).toHaveBeenCalledWith('n1');
    await places.list();
    expect(entities.SavedPlace.filter).toHaveBeenCalledWith({ user_email: 'ana@example.test' }, '-created_date', 1000);
    await places.add('place-1');
    expect(entities.SavedPlace.create).toHaveBeenCalledWith({ user_email: 'ana@example.test', resource_id: 'place-1' });
    await places.remove('place-1', [{ id: 's1' }, { id: 's2' }]);
    expect(entities.SavedPlace.delete.mock.calls).toEqual([['s1'], ['s2']]);
  });
});
