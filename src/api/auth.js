// The one login module screens use (never Base44's or Supabase's directly).
//
// The switch: VITE_AUTH_PROVIDER=supabase (plus VITE_SUPABASE_URL and
// VITE_SUPABASE_ANON_KEY) uses Supabase's 6-digit email code. Anything else
// keeps Base44's login, because until Standalone Step 3 the screens still
// read and write Base44 data, which needs a Base44 login.
//
// The same calls either way:
//   auth.me()               who is signed in (throws { status: 401 } if nobody):
//                           email, role ('admin' | 'user'), full_name,
//                           created_date and the extra profile fields
//   auth.updateMe(fields)   save extra profile fields
//   auth.goToSignIn(next?)  open the sign-in screen, then come back to `next`
//   auth.signOut()
//   auth.sendCode(email) / auth.verifyCode(email, code) / auth.resendWait()
//   auth.ensureProfile(user) -> { created }   first sign-in
//   auth.onChange(cb)       'signed_in' | 'signed_out' | 'expired'
//   auth.checkSession()     -> { user, authError } (for AuthContext)
import { base44Auth } from '@/api/base44Auth';
import { createSupabaseAuth } from '@/api/supabaseAuth';
import { getSupabase, supabaseConfigured } from '@/api/supabaseClient';

const wantsSupabase = import.meta.env.VITE_AUTH_PROVIDER === 'supabase';
if (wantsSupabase && !supabaseConfigured()) {
  console.warn('VITE_AUTH_PROVIDER is "supabase" but VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing: using Base44 sign-in.');
}

export const AUTH_PROVIDER = wantsSupabase && supabaseConfigured() ? 'supabase' : 'base44';

function makeSupabaseAuth() {
  const a = createSupabaseAuth(getSupabase());
  a.checkSession = async () => {
    try {
      return { user: await a.me(), authError: null };
    } catch (e) {
      return { user: null, authError: null }; // signed out is a normal state, not an error
    }
  };
  return a;
}

export const auth = AUTH_PROVIDER === 'supabase' ? makeSupabaseAuth() : base44Auth;

export default auth;
