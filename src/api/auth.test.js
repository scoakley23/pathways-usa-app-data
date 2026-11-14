// The login wrapper (Standalone Step 2), with a fake Supabase client and
// fake @example.test accounts only.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSupabaseAuth, errorKind, isFirstSignIn, safeNext, signInPath,
  cleanCode, looksLikeEmail, PROFILE_COLUMNS, CODE_MINUTES, RESEND_SECONDS,
} from './supabaseAuth';
import { listPrograms, myStaffPrograms, joinProgramByCode } from './programs';

vi.mock('@/api/base44Client', () => ({
  base44: { auth: { me: vi.fn(async () => ({ email: 'b44@example.test' })), updateMe: vi.fn(), logout: vi.fn(), redirectToLogin: vi.fn() } },
}));
vi.mock('@/lib/app-params', () => ({ appParams: {} }));
vi.mock('@base44/sdk/dist/utils/axios-client', () => ({ createAxiosClient: () => ({ get: async () => ({}) }) }));
vi.mock('@/lib/profileService', () => ({ ensurePublicProfile: vi.fn(async () => ({ created: true })) }));

const LEARNER = 'learner@example.test';
const T0 = Date.parse('2026-11-14T12:00:00Z');

const authUser = (over = {}) => ({
  id: 'u-1',
  email: LEARNER,
  app_metadata: {},
  created_at: '2026-10-01T00:00:00Z',
  email_confirmed_at: '2026-10-01T00:01:00Z',
  last_sign_in_at: '2026-11-14T12:00:00Z',
  ...over,
});

const otpError = () => Object.assign(new Error('Token has expired or is invalid'), { status: 403, code: 'otp_expired' });

// A stand-in for supabase-js: just the calls the wrapper makes.
function fakeClient({ user = null, profile = { display_name: 'Ana', points: 5, pilot_id: 'p1' }, verifyUser = authUser(), rpcData = {} } = {}) {
  const state = { session: user ? { user } : null, profile, listener: null, updates: [], otpCalls: [], verifyResult: null };
  const client = {
    state,
    auth: {
      getSession: vi.fn(async () => ({ data: { session: state.session }, error: null })),
      signInWithOtp: vi.fn(async (args) => { state.otpCalls.push(args); return { data: {}, error: state.otpError || null }; }),
      verifyOtp: vi.fn(async ({ token }) => {
        if (state.verifyResult) return state.verifyResult;
        if (token !== '123456') return { data: {}, error: otpError() };
        state.session = { user: verifyUser };
        state.listener?.('SIGNED_IN', state.session);
        return { data: { user: verifyUser, session: state.session }, error: null };
      }),
      signOut: vi.fn(async () => { state.session = null; state.listener?.('SIGNED_OUT', null); return { error: null }; }),
      onAuthStateChange: vi.fn((cb) => { state.listener = cb; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
    },
    from: vi.fn(() => {
      const q = {
        _patch: null,
        select: () => q,
        eq: () => q,
        update: (patch) => { q._patch = patch; state.updates.push(patch); return q; },
        maybeSingle: async () => ({ data: state.profile, error: null }),
        single: async () => { state.profile = { ...state.profile, ...q._patch }; return { data: state.profile, error: null }; },
      };
      return q;
    }),
    rpc: vi.fn(async (name, args) => {
      const r = rpcData[name];
      if (r instanceof Error) return { data: null, error: r };
      return { data: typeof r === 'function' ? r(args) : r ?? null, error: null };
    }),
  };
  return client;
}

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function setup(opts = {}) {
  let t = T0;
  const client = fakeClient(opts);
  const navigate = vi.fn();
  const a = createSupabaseAuth(client, {
    now: () => t,
    storage: memoryStorage(),
    navigate,
    currentPath: () => '/Progress?x=1',
  });
  return { a, client, navigate, advance: (ms) => { t += ms; } };
}

describe('sign in with a 6-digit code', () => {
  it('sends a code to the email (new emails get an account), then signs in with it', async () => {
    const { a, client } = setup();
    expect(await a.sendCode('  Learner@Example.test ')).toEqual({ ok: true });
    expect(client.state.otpCalls[0]).toEqual({ email: LEARNER, options: { shouldCreateUser: true } });
    const res = await a.verifyCode(LEARNER, '123 456');
    expect(res).toEqual({ ok: true, firstSignIn: false });
    expect(client.auth.verifyOtp).toHaveBeenCalledWith({ email: LEARNER, token: '123456', type: 'email' });
    expect((await a.me()).email).toBe(LEARNER);
  });

  it('never sends a code to something that is not an email', async () => {
    const { a, client } = setup();
    expect(await a.sendCode('not-an-email')).toEqual({ ok: false, error: 'bad_email' });
    expect(client.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('a wrong code says so and does not sign in', async () => {
    const { a } = setup();
    await a.sendCode(LEARNER);
    expect(await a.verifyCode(LEARNER, '000000')).toEqual({ ok: false, error: 'wrong_code' });
    await expect(a.me()).rejects.toMatchObject({ status: 401 });
  });

  it('a code that is too short is wrong without asking the server', async () => {
    const { a, client } = setup();
    expect(await a.verifyCode(LEARNER, '12')).toEqual({ ok: false, error: 'wrong_code' });
    expect(client.auth.verifyOtp).not.toHaveBeenCalled();
  });

  it('an old code is called expired (Supabase gives one error for both)', async () => {
    const { a, advance } = setup();
    await a.sendCode(LEARNER);
    advance((CODE_MINUTES + 1) * 60 * 1000);
    expect(await a.verifyCode(LEARNER, '999999')).toEqual({ ok: false, error: 'expired_code' });
  });

  it('too many codes or tries: the rate limit message', async () => {
    const { a, client } = setup();
    client.state.otpError = Object.assign(new Error('Email rate limit exceeded'), { status: 429, code: 'over_email_send_rate_limit' });
    expect(await a.sendCode(LEARNER)).toEqual({ ok: false, error: 'too_many' });
    client.state.verifyResult = { data: {}, error: Object.assign(new Error('Too many requests'), { status: 429, code: 'over_request_rate_limit' }) };
    expect(await a.verifyCode(LEARNER, '123456')).toEqual({ ok: false, error: 'too_many' });
  });

  it('no internet: the network message', async () => {
    const { a, client } = setup();
    client.auth.signInWithOtp.mockRejectedValueOnce(Object.assign(new TypeError('Failed to fetch'), { name: 'AuthRetryableFetchError', status: 0 }));
    expect(await a.sendCode(LEARNER)).toEqual({ ok: false, error: 'network' });
  });

  it('"Send a new code" waits the minimum gap between emails', async () => {
    const { a, advance } = setup();
    expect(a.resendWait()).toBe(0);
    await a.sendCode(LEARNER);
    expect(a.resendWait()).toBe(RESEND_SECONDS);
    advance(45 * 1000);
    expect(a.resendWait()).toBe(15);
    advance(15 * 1000);
    expect(a.resendWait()).toBe(0);
  });
});

describe('first sign-in', () => {
  it('a brand-new account (email confirmed by this sign-in) goes to Getting started', async () => {
    const fresh = authUser({ id: 'u-new', email: 'new@example.test', email_confirmed_at: '2026-11-14T12:00:00Z', last_sign_in_at: '2026-11-14T12:00:01Z' });
    const { a } = setup({ verifyUser: fresh });
    await a.sendCode('new@example.test');
    expect(await a.verifyCode('new@example.test', '123456')).toEqual({ ok: true, firstSignIn: true });
  });

  it('isFirstSignIn: returning learners and missing dates are not first', () => {
    expect(isFirstSignIn(authUser())).toBe(false);
    expect(isFirstSignIn({})).toBe(false);
    expect(isFirstSignIn(null)).toBe(false);
  });

  it('the database trigger makes the profile, so ensureProfile never re-routes', async () => {
    const { a } = setup({ user: authUser() });
    expect(await a.ensureProfile({ email: LEARNER })).toEqual({ created: false });
  });
});

describe('who is signed in', () => {
  it('me() gives the old Base44 shape from the login plus the profiles row', async () => {
    const { a } = setup({ user: authUser() });
    expect(await a.me()).toMatchObject({
      id: 'u-1', email: LEARNER, role: 'user', full_name: 'Ana', points: 5, pilot_id: 'p1', created_date: '2026-10-01T00:00:00Z',
    });
  });

  it('me() looks the profile up once, not once per screen', async () => {
    const { a, client } = setup({ user: authUser() });
    await Promise.all([a.me(), a.me(), a.me()]);
    expect(client.from).toHaveBeenCalledTimes(1);
  });

  it('signed out: me() throws 401, like Base44', async () => {
    const { a } = setup();
    await expect(a.me()).rejects.toMatchObject({ status: 401 });
  });

  it('admin comes from app_metadata.role only', async () => {
    const admin = setup({ user: authUser({ email: 'admin@example.test', app_metadata: { role: 'admin' } }) });
    expect((await admin.a.me()).role).toBe('admin');
    const sneaky = setup({ user: authUser({ user_metadata: { role: 'admin' } }) });
    expect((await sneaky.a.me()).role).toBe('user');
  });

  it('updateMe saves only profile columns (old Base44-only fields and pilot_id are dropped)', async () => {
    const { a, client } = setup({ user: authUser() });
    const user = await a.updateMe({ skill_levels: { civics: 'strong' }, max_streak: 9, pilot_id: 'mine', role: 'admin', email: 'x@example.test' });
    expect(client.state.updates).toEqual([{ skill_levels: { civics: 'strong' } }]);
    expect(user.skill_levels).toEqual({ civics: 'strong' });
    expect(user.role).toBe('user');
    expect(user.email).toBe(LEARNER);
    expect(PROFILE_COLUMNS).not.toContain('pilot_id');
  });

  it('updateMe with nothing to save makes no write', async () => {
    const { a, client } = setup({ user: authUser() });
    await a.updateMe({ max_streak: 3 });
    expect(client.state.updates).toEqual([]);
  });

  it('updateMe when signed out throws 401', async () => {
    const { a } = setup();
    await expect(a.updateMe({ points: 1 })).rejects.toMatchObject({ status: 401 });
  });
});

describe('sign out and session expiry', () => {
  it('sign out ends the login on this device and says signed_out', async () => {
    const { a, client } = setup({ user: authUser() });
    const events = [];
    a.onChange((k) => events.push(k));
    client.state.listener('INITIAL_SESSION', client.state.session);
    await a.me();
    await a.signOut();
    expect(client.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(events).toEqual(['signed_out']);
    await expect(a.me()).rejects.toMatchObject({ status: 401 });
  });

  it('sign out still works when the server cannot be reached', async () => {
    const { a, client } = setup({ user: authUser() });
    client.auth.signOut.mockRejectedValueOnce(new Error('Failed to fetch'));
    await expect(a.signOut()).resolves.toBeUndefined();
  });

  it('a login that ends by itself says expired (not signed_out)', async () => {
    const { a, client } = setup({ user: authUser() });
    const events = [];
    a.onChange((k) => events.push(k));
    client.state.listener('INITIAL_SESSION', client.state.session);
    await a.me();
    client.state.session = null;
    client.state.listener('SIGNED_OUT', null);
    expect(events).toEqual(['expired']);
    await expect(a.me()).rejects.toMatchObject({ status: 401 });
  });

  it('signing in says signed_in once', async () => {
    const { a } = setup();
    const events = [];
    a.onChange((k) => events.push(k));
    await a.sendCode(LEARNER);
    await a.verifyCode(LEARNER, '123456');
    expect(events).toEqual(['signed_in']);
  });

  it('goToSignIn opens /sign-in and comes back to the page', () => {
    const { a, navigate } = setup();
    a.goToSignIn();
    expect(navigate).toHaveBeenCalledWith('/sign-in?next=%2FProgress%3Fx%3D1');
    a.goToSignIn('/quick-check', 'expired');
    expect(navigate).toHaveBeenLastCalledWith('/sign-in?next=%2Fquick-check&reason=expired');
  });
});

describe('partner programs: staff and joining by code', () => {
  const PROGRAMS = [{ code: 'TEST-CLASS', name: 'Test Class', share_learners: true }];

  it('lists the programs a learner can pick', async () => {
    const client = fakeClient({ rpcData: { active_programs: PROGRAMS } });
    expect(await listPrograms(client)).toEqual([{ code: 'TEST-CLASS', name: 'Test Class', shareLearners: true }]);
  });

  it('staff = the signed-in email is on a program staff list', async () => {
    const staff = fakeClient({ rpcData: { my_staff_programs: PROGRAMS } });
    expect(await myStaffPrograms(staff)).toHaveLength(1);
    const learner = fakeClient({ rpcData: { my_staff_programs: [] } });
    expect(await myStaffPrograms(learner)).toEqual([]);
  });

  it('joins a program by code through join_program()', async () => {
    const client = fakeClient({ rpcData: { join_program: (args) => ({ partner_code: args.p_code, status: 'pending' }) } });
    expect(await joinProgramByCode(client, 'TEST-CLASS', { name: 'Ana', share: true })).toEqual({ partner_code: 'TEST-CLASS', status: 'pending' });
    expect(client.rpc).toHaveBeenCalledWith('join_program', { p_code: 'TEST-CLASS', p_name: 'Ana', p_share: true });
  });

  it('an unknown code is an error', async () => {
    const client = fakeClient({ rpcData: { join_program: Object.assign(new Error('no such program'), { code: 'P0002' }) } });
    await expect(joinProgramByCode(client, 'NOPE')).rejects.toMatchObject({ code: 'P0002' });
  });
});

describe('small helpers', () => {
  it('safeNext keeps only addresses inside the app', () => {
    expect(safeNext('/study?tab=practice')).toBe('/study?tab=practice');
    expect(safeNext('https://evil.example.test')).toBe('/');
    expect(safeNext('//evil.example.test')).toBe('/');
    expect(safeNext('/\\evil.example.test')).toBe('/');
    expect(safeNext('/sign-in?next=/x')).toBe('/');
    expect(safeNext(undefined)).toBe('/');
    expect(signInPath('/')).toBe('/sign-in');
  });

  it('cleanCode keeps 6 digits; looksLikeEmail', () => {
    expect(cleanCode(' 12-34 567 ')).toBe('123456');
    expect(looksLikeEmail('a@example.test')).toBe(true);
    expect(looksLikeEmail('a@b')).toBe(false);
  });

  it('errorKind maps unknown errors to a plain message', () => {
    expect(errorKind(null)).toBe(null);
    expect(errorKind({ status: 500, code: 'unexpected_failure', message: 'boom' })).toBe('unknown');
  });
});

describe('the switch', () => {
  beforeEach(() => { vi.resetModules(); vi.unstubAllEnvs(); });

  it('without the Supabase settings, Base44 sign-in stays on (standalone keeps working)', async () => {
    vi.stubEnv('VITE_AUTH_PROVIDER', '');
    const { AUTH_PROVIDER, auth } = await import('./auth');
    expect(AUTH_PROVIDER).toBe('base44');
    expect(auth.provider).toBe('base44');
    expect(await auth.ensureProfile({ email: 'b44@example.test' })).toEqual({ created: true });
  });

  it('asking for Supabase without its URL and key falls back to Base44', async () => {
    vi.stubEnv('VITE_AUTH_PROVIDER', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { AUTH_PROVIDER } = await import('./auth');
    expect(AUTH_PROVIDER).toBe('base44');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('with the switch and settings, Supabase sign-in is used', async () => {
    vi.stubEnv('VITE_AUTH_PROVIDER', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', 'http://127.0.0.1:54321');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'fake-anon-key');
    const { AUTH_PROVIDER, auth } = await import('./auth');
    expect(AUTH_PROVIDER).toBe('supabase');
    expect(auth.provider).toBe('supabase');
    auth.unsubscribe();
  });
});

describe('the sign-in email (supabase/templates/sign-in-code.html)', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { FORBIDDEN_EMAIL_WORDS } = await import('../../base44/shared/pilotCheckIns.js');
  const html = fs.readFileSync(path.resolve(__dirname, '../../supabase/templates/sign-in-code.html'), 'utf8');
  const config = fs.readFileSync(path.resolve(__dirname, '../../supabase/config.toml'), 'utf8');

  it('shows the code and has no sign-in link', () => {
    expect(html).toContain('{{ .Token }}');
    expect(html).not.toMatch(/ConfirmationURL|TokenHash|RedirectTo|<a\s/i);
  });

  it('never mentions citizenship, immigration, the interview or USCIS (inboxes can be shared)', () => {
    expect(FORBIDDEN_EMAIL_WORDS.test(html)).toBe(false);
  });

  it('config.toml matches the app: 6 digits, 10 minutes, 60 seconds between codes', () => {
    expect(config).toMatch(/otp_length = 6\b/);
    expect(config).toMatch(new RegExp(`otp_expiry = ${CODE_MINUTES * 60}\\b`));
    expect(config).toMatch(new RegExp(`max_frequency = "${RESEND_SECONDS}s"`));
  });
});
