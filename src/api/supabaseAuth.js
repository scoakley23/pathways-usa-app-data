// Sign-in with Supabase Auth: a 6-digit code sent by email (never a magic
// link). Gives screens the same shape Base44's `auth` had (me, updateMe,
// sign in, sign out), so Step 3 only has to move the data calls.
//
// `createSupabaseAuth(client)` takes the client so tests can pass a fake one.

export const CODE_LENGTH = 6;
// Must match "Email OTP Expiration" in the Supabase dashboard and
// `otp_expiry` in supabase/config.toml.
export const CODE_MINUTES = 10;
// Must match "minimum interval" (`max_frequency`) for emails.
export const RESEND_SECONDS = 60;

// The extra account fields, now columns of public.profiles
// (supabase/migrations/20261114000001_schema.sql). Anything else a screen
// still sends (e.g. Base44's old max_streak) is dropped. pilot_id and
// user_id are set by the database and can't be changed.
export const PROFILE_COLUMNS = [
  'display_name', 'points', 'badges', 'tutor_profile', 'skill_levels',
  'state', 'checkin_email_reminders', 'reminder_language', 'checkins_stopped',
  'app_language', 'pilot_intro_seen', 'pilot_test_months_ago',
  'representative_state', 'representative_district',
  'lessons_per_day', 'write_level', 'write_level1_passes',
];

const SENT_AT_KEY = 'pathways_code_sent_at';

export const cleanEmail = (email) => String(email || '').trim().toLowerCase();
export const looksLikeEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(email));
export const cleanCode = (code) => String(code || '').replace(/\D/g, '').slice(0, CODE_LENGTH);

// Only addresses inside the app may follow sign-in (no "//evil.example").
export function safeNext(next) {
  if (typeof next !== 'string' || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) return '/';
  if (next.toLowerCase().startsWith('/sign-in')) return '/';
  return next;
}

export function signInPath(next, reason) {
  const params = new URLSearchParams();
  const target = safeNext(next);
  if (target !== '/') params.set('next', target);
  if (reason) params.set('reason', reason);
  const q = params.toString();
  return `/sign-in${q ? `?${q}` : ''}`;
}

// A brand-new account: this sign-in is the one that confirmed the email.
// A returning learner's email was confirmed long before this sign-in.
export function isFirstSignIn(user) {
  const confirmed = Date.parse(user?.email_confirmed_at || user?.confirmed_at || '');
  const signedIn = Date.parse(user?.last_sign_in_at || '');
  if (Number.isNaN(confirmed) || Number.isNaN(signedIn)) return false;
  return Math.abs(signedIn - confirmed) < 60 * 1000;
}

// Supabase gives the SAME error for a wrong code and an expired one
// (`otp_expired`), so the time since the code was sent tells them apart.
export function errorKind(error, { sentAt, now } = {}) {
  if (!error) return null;
  const code = error.code || '';
  const status = error.status;
  if (error.name === 'AuthRetryableFetchError' || status === 0 || /fetch|network/i.test(error.message || '')) return 'network';
  if (status === 429 || /rate_limit/.test(code)) return 'too_many';
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'bad_email';
  if (code === 'otp_expired' || code === 'otp_disabled' || /token|otp/i.test(error.message || '')) {
    if (sentAt && now - sentAt > CODE_MINUTES * 60 * 1000) return 'expired_code';
    return 'wrong_code';
  }
  return 'unknown';
}

const defaultStorage = () => {
  try { return typeof window !== 'undefined' ? window.sessionStorage : null; } catch (e) { return null; }
};
const read = (s, k) => { try { return s ? s.getItem(k) : null; } catch (e) { return null; } };
const write = (s, k, v) => { try { if (s) s.setItem(k, v); } catch (e) { /* ignore */ } };
const remove = (s, k) => { try { if (s) s.removeItem(k); } catch (e) { /* ignore */ } };

const notSignedIn = () => Object.assign(new Error('Not signed in'), { status: 401 });

export function createSupabaseAuth(client, {
  now = () => Date.now(),
  storage = defaultStorage(),
  navigate = (path) => { window.location.assign(path); },
  currentPath = () => `${window.location.pathname}${window.location.search}`,
} = {}) {
  let cached = null; // { id, promise } for me(): one profile lookup, not one per screen
  let signingOut = false;
  const listeners = new Set();

  const toUser = (authUser, profile) => {
    const p = profile || {};
    return {
      ...p,
      id: authUser.id,
      email: cleanEmail(authUser.email),
      role: authUser.app_metadata?.role === 'admin' ? 'admin' : 'user',
      full_name: p.display_name || '',
      created_date: authUser.created_at,
    };
  };

  async function loadUser(authUser) {
    const { data, error } = await client.from('profiles').select('*').eq('user_id', authUser.id).maybeSingle();
    if (error) throw error;
    return toUser(authUser, data);
  }

  async function currentAuthUser() {
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session?.user) return null;
    return data.session.user;
  }

  const api = {
    provider: 'supabase',

    async me() {
      const authUser = await currentAuthUser();
      if (!authUser) { cached = null; throw notSignedIn(); }
      if (!cached || cached.id !== authUser.id) {
        const promise = loadUser(authUser);
        cached = { id: authUser.id, promise };
        promise.catch(() => { if (cached?.promise === promise) cached = null; });
      }
      return cached.promise;
    },

    async updateMe(patch = {}) {
      const authUser = await currentAuthUser();
      if (!authUser) throw notSignedIn();
      const clean = {};
      for (const key of PROFILE_COLUMNS) if (key in patch) clean[key] = patch[key];
      if ('full_name' in patch && !('display_name' in patch)) clean.display_name = patch.full_name;
      if (Object.keys(clean).length === 0) return api.me();
      const { data, error } = await client.from('profiles').update(clean).eq('user_id', authUser.id).select('*').single();
      if (error) throw error;
      const user = toUser(authUser, data);
      cached = { id: authUser.id, promise: Promise.resolve(user) };
      return user;
    },

    // Step 1 of sign-in: email a 6-digit code. New emails get an account.
    async sendCode(email) {
      const address = cleanEmail(email);
      if (!looksLikeEmail(address)) return { ok: false, error: 'bad_email' };
      try {
        const { error } = await client.auth.signInWithOtp({ email: address, options: { shouldCreateUser: true } });
        if (error) return { ok: false, error: errorKind(error) };
      } catch (e) {
        return { ok: false, error: errorKind(e) || 'network' };
      }
      write(storage, SENT_AT_KEY, String(now()));
      return { ok: true };
    },

    // Step 2: check the code. `firstSignIn` sends new learners to Getting started.
    async verifyCode(email, code) {
      const token = cleanCode(code);
      if (token.length !== CODE_LENGTH) return { ok: false, error: 'wrong_code' };
      const sentAt = Number(read(storage, SENT_AT_KEY)) || null;
      try {
        const { data, error } = await client.auth.verifyOtp({ email: cleanEmail(email), token, type: 'email' });
        if (error) return { ok: false, error: errorKind(error, { sentAt, now: now() }) };
        remove(storage, SENT_AT_KEY);
        cached = null;
        return { ok: true, firstSignIn: isFirstSignIn(data?.user) };
      } catch (e) {
        return { ok: false, error: errorKind(e, { sentAt, now: now() }) || 'network' };
      }
    },

    // Seconds left before "Send a new code" works again (0 = now).
    resendWait() {
      const sentAt = Number(read(storage, SENT_AT_KEY));
      if (!sentAt) return 0;
      return Math.max(0, Math.ceil((sentAt + RESEND_SECONDS * 1000 - now()) / 1000));
    },

    goToSignIn(next, reason) {
      navigate(signInPath(next ?? currentPath(), reason));
    },

    // Sign out on this device. Works offline too: the saved login is removed
    // even when the server can't be reached.
    async signOut() {
      signingOut = true;
      cached = null;
      try {
        await client.auth.signOut({ scope: 'local' });
      } catch (e) {
        // the local session is cleared either way
      } finally {
        signingOut = false;
      }
    },

    // The profile is made by a database trigger on sign-up, and the sign-in
    // screen already sent a new learner to Getting started.
    async ensureProfile() {
      return { created: false };
    },

    // cb('signed_in' | 'signed_out' | 'expired'). 'expired' = the login ended
    // without the learner signing out (renewal failed, or signed out elsewhere).
    onChange(cb) {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
  };

  let hadSession = false;
  const sub = client.auth.onAuthStateChange((event, session) => {
    let kind = null;
    if (event === 'SIGNED_IN' && !hadSession) kind = 'signed_in';
    if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session && hadSession)) {
      kind = signingOut || !hadSession ? 'signed_out' : 'expired';
    }
    hadSession = Boolean(session);
    if (!session) cached = null;
    if (kind) listeners.forEach((cb) => { try { cb(kind); } catch (e) { /* ignore */ } });
  });
  api.unsubscribe = () => sub?.data?.subscription?.unsubscribe?.();

  return api;
}
