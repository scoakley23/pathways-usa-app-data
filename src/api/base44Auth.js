// Base44's login, behind the same shape as supabaseAuth.js. Used while the
// switch (VITE_AUTH_PROVIDER) is off, so `standalone` keeps working until
// Step 3 has moved the data. Deleted in Step 6 with the Base44 SDK.
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';
import { ensurePublicProfile } from '@/lib/profileService';

const notSupported = async () => ({ ok: false, error: 'unknown' });

export const base44Auth = {
  provider: 'base44',
  me: () => base44.auth.me(),
  updateMe: (patch) => base44.auth.updateMe(patch),
  goToSignIn: (next) => base44.auth.redirectToLogin(next ? `${window.location.origin}${next}` : window.location.href),
  signOut: () => base44.auth.logout(),
  // Base44 has its own hosted sign-in page; the code screen isn't used.
  sendCode: notSupported,
  verifyCode: notSupported,
  resendWait: () => 0,
  onChange: () => () => {},

  // The first sign-in makes the PublicProfile; `created` sends the learner
  // to Getting started and the quick check.
  ensureProfile: (user) => {
    const name = user.full_name || user.email.split('@')[0];
    return ensurePublicProfile(user.email, {}, { display_name: name });
  },

  // Who is signed in, plus Base44's app-level states (auth_required,
  // user_not_registered). Moved here unchanged from lib/AuthContext.jsx.
  async checkSession() {
    const appClient = createAxiosClient({
      baseURL: `${appParams.serverUrl}/api/apps/public`,
      headers: { 'X-App-Id': appParams.appId },
      token: appParams.token,
      interceptResponses: true,
    });
    try {
      await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
    } catch (appError) {
      const reason = appError.status === 403 ? appError.data?.extra_data?.reason : null;
      return { user: null, authError: { type: reason || 'unknown', message: appError.message || 'Failed to load app' } };
    }
    if (!appParams.token) return { user: null, authError: null };
    try {
      return { user: await base44.auth.me(), authError: null };
    } catch (error) {
      const expired = error.status === 401 || error.status === 403;
      return { user: null, authError: expired ? { type: 'auth_required', message: 'Authentication required' } : null };
    }
  },
};
