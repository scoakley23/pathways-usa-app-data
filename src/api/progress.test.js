// Practice progress through src/api/progress.js (Standalone Step 3, PR 3),
// with fake clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createProgressApi, PROGRESS_COLUMNS } = await import('./progress');
const { fakeSupabase } = await import('./testing/fakeSupabase');

const ANA = { id: 'u-ana', email: 'Ana@Example.test' };
const BEN = { id: 'u-ben', email: 'ben@example.test' };
const authAs = (user) => ({ me: vi.fn(async () => user) });

const rows = () => ([
  { id: 'r1', user_id: 'u-ana', content_id: 's1', content_type: 'sentence', status: 'mastered', last_practiced: '2026-11-10T10:00:00Z' },
  { id: 'r2', user_id: 'u-ana', content_id: 'q1', content_type: 'civics_question', status: 'practicing', last_practiced: '2026-11-12T10:00:00Z' },
  { id: 'r3', user_id: 'u-ben', content_id: 'q1', content_type: 'civics_question', status: 'mastered', last_practiced: '2026-11-13T10:00:00Z' },
]);

const setup = (user = ANA) => {
  const sb = fakeSupabase({ user_progress: rows() });
  return { sb, api: createProgressApi({ provider: 'supabase', supabase: sb, auth: authAs(user) }) };
};

describe('progress on Supabase', () => {
  it('lists only the signed-in learner\'s rows, in the old shape', async () => {
    const { sb, api } = setup();
    const list = await api.list({ sort: '-last_practiced', limit: 500 });
    expect(list.map((r) => r.id)).toEqual(['r2', 'r1']);
    expect(list[0].user_email).toBe('ana@example.test');
    expect(sb.calls[0].filters[0]).toEqual(['user_id', 'eq', 'u-ana']);
    expect(sb.calls[0].order[0]).toEqual(['last_practiced', false]);
  });

  it('filters by kind and counts', async () => {
    const { api } = setup();
    expect((await api.list({ contentType: 'civics_question' })).map((r) => r.id)).toEqual(['r2']);
    expect(await api.count()).toBe(2);
    expect(await api.count({ contentType: 'sentence', status: 'mastered' })).toBe(1);
  });

  it('get() finds one item; another learner\'s row never shows', async () => {
    const { api } = setup(BEN);
    expect((await api.get('q1')).id).toBe('r3');
    expect(await api.get('s1')).toBeNull();
  });

  it('save() makes a new row with the login id and drops user_email', async () => {
    const { sb, api } = setup();
    const saved = await api.save(null, {
      user_email: 'ana@example.test', content_id: 'w9', content_type: 'vocabulary', status: 'practicing',
      last_practiced: '2026-11-14T09:00:00Z', ease_factor: 2.5, interval: 1, consecutive_correct: 1,
      last_result: 'correct', best_score: 100, last_score: 100, total_attempts: 1, not_a_column: 'x',
    });
    const row = sb.tables.user_progress.find((r) => r.content_id === 'w9');
    expect(row.user_id).toBe('u-ana');
    expect(row).not.toHaveProperty('user_email');
    expect(row).not.toHaveProperty('not_a_column');
    expect(saved.user_email).toBe('ana@example.test');
    expect(sb.calls.at(-1).opts).toEqual({ onConflict: 'user_id,content_type,content_id' });
  });

  it('save() updates an existing row (only the learner\'s own)', async () => {
    const { sb, api } = setup();
    const existing = await api.get('q1');
    await api.save(existing, { content_id: 'q1', content_type: 'civics_question', status: 'mastered', total_attempts: 4 });
    expect(sb.tables.user_progress.find((r) => r.id === 'r2')).toMatchObject({ status: 'mastered', total_attempts: 4 });
    expect(sb.calls.at(-1).filters).toEqual([['id', 'eq', 'r2'], ['user_id', 'eq', 'u-ana']]);
    expect(sb.tables.user_progress.find((r) => r.id === 'r3').status).toBe('mastered');
  });

  it('update() changes the next review date', async () => {
    const { sb, api } = setup();
    await api.update('r2', { interval: 6, last_practiced: '2026-11-14T00:00:00Z', ignored: 1 });
    expect(sb.tables.user_progress.find((r) => r.id === 'r2')).toMatchObject({ interval: 6, last_practiced: '2026-11-14T00:00:00Z' });
    expect(sb.calls.at(-1).payload).toEqual({ interval: 6, last_practiced: '2026-11-14T00:00:00Z' });
  });

  it('a save the learner may not make fails plainly (not someone else\'s row)', async () => {
    const { api } = setup();
    await expect(api.update('r3', { status: 'practicing' })).rejects.toBeTruthy();
  });

  it('the columns match the Step 1 table', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const schema = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261114000001_schema.sql'), 'utf8');
    const table = schema.slice(schema.indexOf('create table public.user_progress'), schema.indexOf('unique (user_id, content_type, content_id)'));
    for (const col of PROGRESS_COLUMNS) expect(table).toMatch(new RegExp(`\\n\\s+"?${col}"?\\s`));
  });
});

describe('Base44 (switch off) makes the same calls as before', () => {
  const entity = () => ({
    filter: vi.fn(async () => [{ id: 'b1', content_id: 'q1' }]), count: vi.fn(async () => 3),
    update: vi.fn(async (id, d) => ({ id, ...d })), create: vi.fn(async (d) => ({ id: 'new', ...d })),
  });
  const setup44 = () => {
    const UserProgress = entity();
    return { UserProgress, api: createProgressApi({ provider: 'base44', base44: { entities: { UserProgress } }, auth: authAs(ANA) }) };
  };

  it('filter by the lowercase email, sort and limit', async () => {
    const { UserProgress, api } = setup44();
    await api.list({ contentType: 'civics_question', sort: '-last_practiced', limit: 500 });
    expect(UserProgress.filter).toHaveBeenCalledWith({ user_email: 'ana@example.test', content_type: 'civics_question' }, '-last_practiced', 500);
    await api.get('q1');
    expect(UserProgress.filter).toHaveBeenLastCalledWith({ user_email: 'ana@example.test', content_id: 'q1' }, null, 1);
    expect(await api.count({ contentType: 'sentence', status: 'mastered' })).toBe(3);
    expect(UserProgress.count).toHaveBeenCalledWith({ user_email: 'ana@example.test', content_type: 'sentence', status: 'mastered' });
  });

  it('save: update when there is a row, create when not', async () => {
    const { UserProgress, api } = setup44();
    await api.save({ id: 'b1' }, { status: 'mastered' });
    expect(UserProgress.update).toHaveBeenCalledWith('b1', { status: 'mastered' });
    await api.save(null, { content_id: 'q2' });
    expect(UserProgress.create).toHaveBeenCalledWith({ content_id: 'q2' });
  });
});
