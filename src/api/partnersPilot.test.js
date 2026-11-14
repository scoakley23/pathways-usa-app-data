// Partner programs and pilot data through src/api (Standalone Step 3, PR 7),
// plus the Supabase Edge Function that makes the pilot dashboard report.
// Fake clients and @example.test accounts only.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {}, functions: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createPartnersApi, PARTNER_COLUMNS } = await import('./partners');
const { createPilotApi, CHECK_IN_COLUMNS } = await import('./pilot');
const { fakeSupabase } = await import('./testing/fakeSupabase');
const { buildPilotReport } = await import('../../supabase/functions/pilot-report/report.js');

const ROOT = path.resolve(__dirname, '../..');
const read = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');

const ANA = { id: 'u-ana', email: 'Ana@Example.test' };
const authAs = (user) => ({ me: vi.fn(async () => user) });

describe('partner programs on Supabase', () => {
  const setup = (rpc = {}) => {
    const sb = fakeSupabase({
      program_memberships: [
        { user_id: 'u-ana', partner_code: 'TEST-CLASS', status: 'pending', display_name: 'Ana', share_progress: false, created_at: '2026-11-01T00:00:00Z' },
        { user_id: 'u-ben', partner_code: 'TEST-CLASS', status: 'confirmed', created_at: '2026-11-02T00:00:00Z' },
      ],
      partners: [{ id: 'p1', name: 'Test Class', code: 'TEST-CLASS', staff_emails: ['staff@example.test'], share_learners: true, active: true }],
    }, { rpc });
    return { sb, api: createPartnersApi({ provider: 'supabase', supabase: sb, auth: authAs(ANA) }) };
  };

  it('staff: members by login id, name and status only', async () => {
    const { api, sb } = setup({ program_members: [{ user_id: 'u-ana', name: 'Ana', status: 'pending', since: '2026-11-01T00:00:00Z' }] });
    expect(await api.members('TEST-CLASS')).toEqual([{ id: 'u-ana', name: 'Ana', status: 'pending', since: '2026-11-01T00:00:00Z' }]);
    expect(sb.calls.at(-1)).toEqual({ rpc: 'program_members', args: { p_code: 'TEST-CLASS' } });
  });

  it('staff: confirm a learner through set_member_status()', async () => {
    const { api, sb } = setup({ set_member_status: null });
    expect(await api.setStatus('TEST-CLASS', { id: 'u-ana' }, 'confirmed')).toEqual({ id: 'u-ana', status: 'confirmed' });
    expect(sb.calls.at(-1)).toEqual({ rpc: 'set_member_status', args: { p_code: 'TEST-CLASS', p_user_id: 'u-ana', p_status: 'confirmed' } });
  });

  it('someone not on the staff list gets a plain message', async () => {
    const { api } = setup({ program_summary: Object.assign(new Error('not staff of this program'), { code: '42501' }) });
    await expect(api.summary('TEST-CLASS')).rejects.toMatchObject({ message: "You are not on this program's staff list.", code: '42501' });
  });

  it('the learner sees and leaves only their own program', async () => {
    const { api, sb } = setup();
    expect(await api.myMembership()).toMatchObject({ id: 'u-ana', partner_code: 'TEST-CLASS', status: 'pending', created_date: '2026-11-01T00:00:00Z' });
    await api.leave();
    expect(sb.tables.program_memberships.map((m) => m.user_id)).toEqual(['u-ben']);
  });

  it('admin: partners list and save only real columns', async () => {
    const { api, sb } = setup();
    expect((await api.admin.list()).map((p) => p.code)).toEqual(['TEST-CLASS']);
    await api.admin.create({ name: 'New Class', code: 'NEW-CLASS', staff_emails: [], share_learners: false, active: true, created_date: 'x', id: 'y' });
    expect(Object.keys(sb.calls.at(-1).payload).sort()).toEqual([...PARTNER_COLUMNS].sort());
  });

  it('an unknown join code says so', async () => {
    const { api } = setup({ join_program: Object.assign(new Error('no such program'), { code: 'P0002' }) });
    await expect(api.join('NOPE')).rejects.toMatchObject({ message: 'We could not find that program.' });
  });
});

describe('pilot check-ins on Supabase', () => {
  const setup = () => {
    const sb = fakeSupabase({
      outcome_checkins: [
        { id: 'c1', user_id: 'u-ana', kind: 'signup', stage: 'not_filed', confidence: '3', created_at: '2026-10-01T00:00:00Z' },
        { id: 'c2', user_id: 'u-ben', kind: 'signup', created_at: '2026-10-02T00:00:00Z' },
      ],
    });
    sb.functions = { invoke: vi.fn(async () => ({ data: { summaries: [{ pilot_id: 'abc' }], generated_at: 'now' }, error: null })) };
    return { sb, api: createPilotApi({ provider: 'supabase', supabase: sb, auth: authAs(ANA) }) };
  };

  it('reads only the learner\'s own check-ins', async () => {
    const { api } = setup();
    expect((await api.myCheckIns()).map((c) => c.id)).toEqual(['c1']);
  });

  it('saves fixed choices only, with the login id', async () => {
    const { api, sb } = setup();
    await api.saveCheckIn({ kind: 'month_3', filed: 'yes', confidence: '4', note: 'free text is never saved', user_email: 'x@example.test' });
    const row = sb.tables.outcome_checkins.at(-1);
    expect(row).toMatchObject({ user_id: 'u-ana', kind: 'month_3', filed: 'yes', confidence: '4' });
    expect(row).not.toHaveProperty('note');
    expect(row).not.toHaveProperty('user_email');
    expect(CHECK_IN_COLUMNS).not.toContain('note');
  });

  it('the dashboard report comes from the pilot-report Edge Function', async () => {
    const { api, sb } = setup();
    expect(await api.report()).toEqual({ summaries: [{ pilot_id: 'abc' }], generated_at: 'now' });
    expect(sb.functions.invoke).toHaveBeenCalledWith('pilot-report', { body: {} });
  });
});

describe('the pilot-report Edge Function', () => {
  const NOW = new Date('2026-11-14T12:00:00Z');
  const input = {
    users: [
      { id: 'u-ana', created_at: '2026-09-01T10:00:00Z', app_metadata: {} },
      { id: 'u-admin', created_at: '2026-08-01T10:00:00Z', app_metadata: { role: 'admin' } },
      { id: 'u-ben', created_at: '2026-10-20T10:00:00Z', app_metadata: {} },
    ],
    profiles: [
      { user_id: 'u-ana', pilot_id: 'pilot-ana', state: 'MA', app_language: 'es' },
      { user_id: 'u-admin', pilot_id: 'pilot-admin', state: 'CA', app_language: 'en' },
      { user_id: 'u-ben', pilot_id: 'pilot-ben', state: 'prefer_not', app_language: 'ar' },
    ],
    checkIns: [{ user_id: 'u-ana', kind: 'signup', stage: 'not_filed', confidence: '3', created_at: '2026-09-01T11:00:00Z' }],
    activity: [{ user_id: 'u-ana', date: '2026-09-01' }, { user_id: 'u-ana', date: '2026-09-25' }, { user_id: 'u-ben', date: '2026-10-20' }],
    sessions: [{ user_id: 'u-ana', overall_score: 72, created_at: '2026-09-05T10:00:00Z' }],
    mastered: [{ user_id: 'u-ana', content_id: 'q2025-1' }, { user_id: 'u-ana', content_id: 'q2008-1' }],
    civicsIds: ['q2025-1'],
    memberships: [{ user_id: 'u-ana', partner_code: 'test-class', status: 'confirmed' }, { user_id: 'u-ben', partner_code: 'TEST-CLASS', status: 'removed' }],
    lessonProgress: [{ user_id: 'u-ana', completed: true, stars: 3 }],
    checkpointResults: [{ user_id: 'u-ana', passed_at: '2026-09-10T00:00:00Z' }],
    now: NOW,
  };

  it('one summary per learner, admins left out, keyed by pilot_id', () => {
    const out = buildPilotReport(input);
    expect(out.map((s) => s.pilot_id)).toEqual(['pilot-ana', 'pilot-ben']);
    const ana = out[0];
    expect(ana).toMatchObject({
      program_code: 'TEST-CLASS', state: 'MA', app_language: 'es', stage_at_signup: 'not_filed',
      active_days: 2, mock_interviews: 1, first_mock_score: 72, civics_mastered: 1,
      lessons_completed: 1, stars: 3, checkpoints_passed: 1,
    });
    expect(out[1].program_code).toBe(''); // the program said "not ours"
  });

  it('never returns an email, name or login id', () => {
    const text = JSON.stringify(buildPilotReport(input));
    expect(text).not.toMatch(/u-ana|u-ben|u-admin|@|user_id|email/i);
  });

  it('the function is admins only and never reads emails or names', () => {
    const fn = read('supabase/functions/pilot-report/index.ts');
    expect(fn).toMatch(/user\.app_metadata\?\.role !== 'admin'\) return json\(\{ error: 'Not found\.' \}, 404\)/);
    const selects = [...fn.matchAll(/all\('[a-z_]+', '([^']+)'/g)].map((m) => m[1]).join(',');
    expect(selects).not.toMatch(/email|name|answer|question|content\b|notes|display/);
    expect(fn).toMatch(/users\.push\(\.\.\.data\.users\.map\(\(u\) => \(\{ id: u\.id, created_at: u\.created_at, app_metadata: \{ role: u\.app_metadata\?\.role \} \}\)\)\)/);
  });

  it('uses the same pilot math as Base44 (the shared copies match)', () => {
    for (const file of ['pilotReport.js', 'pilotCheckIns.js']) {
      expect(read(`supabase/functions/_shared/${file}`), file).toBe(read(`base44/shared/${file}`));
    }
  });
});

describe('Base44 (switch off) makes the same calls as before', () => {
  it('partner function, memberships, partners and check-ins', async () => {
    const invoke = vi.fn(async (_n, p) => ({ data: { members: [{ id: 'm1' }], member: { id: 'm1', status: p.status }, partners: [], membership: { id: 'm2' } } }));
    const entities = {
      ProgramMembership: { filter: vi.fn(async () => [{ id: 'm1' }]), delete: vi.fn(async () => ({})) },
      Partner: { list: vi.fn(async () => []), create: vi.fn(), update: vi.fn() },
      OutcomeCheckIn: { filter: vi.fn(async () => []), create: vi.fn(async (d) => d) },
    };
    const b44 = { entities, functions: { invoke } };
    const partners = createPartnersApi({ provider: 'base44', base44: b44, auth: authAs(ANA) });
    await partners.members('TEST-CLASS');
    expect(invoke).toHaveBeenLastCalledWith('partner', { action: 'members', code: 'TEST-CLASS' });
    expect(await partners.setStatus('TEST-CLASS', { id: 'm1' }, 'confirmed')).toEqual({ id: 'm1', status: 'confirmed' });
    expect(invoke).toHaveBeenLastCalledWith('partner', { action: 'setStatus', id: 'm1', status: 'confirmed' });
    await partners.leave();
    expect(entities.ProgramMembership.filter).toHaveBeenCalledWith({ user_email: 'ana@example.test' }, null, 10);
    expect(entities.ProgramMembership.delete).toHaveBeenCalledWith('m1');
    await partners.admin.list();
    expect(entities.Partner.list).toHaveBeenCalledWith('name', 500);

    const pilot = createPilotApi({ provider: 'base44', base44: b44, auth: authAs(ANA) });
    await pilot.myCheckIns();
    expect(entities.OutcomeCheckIn.filter).toHaveBeenCalledWith({ user_email: 'ana@example.test' }, '-created_date', 50);
    await pilot.saveCheckIn({ kind: 'signup', stage: 'filed' });
    expect(entities.OutcomeCheckIn.create).toHaveBeenCalledWith({ user_email: 'ana@example.test', kind: 'signup', stage: 'filed' });
    await pilot.report();
    expect(invoke).toHaveBeenLastCalledWith('pilot-report', {});
  });
});
