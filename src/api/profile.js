// The learner's own profile and activity days (Standalone Step 3, PR 2).
//
// Profile = the display name and the "Who Represents Me?" state and
// district (Base44: the PublicProfile record; Supabase: the learner's
// `profiles` row, the same row auth.me() reads). Activity = one row per day
// the learner opened the app (date only).
//
// Same switch as sign-in. `createProfileApi({ provider, base44, supabase,
// auth })` takes its clients so tests can pass fakes; the app uses `profile`.
import { DATA_PROVIDER, run } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';
import { ensurePublicProfile, normalizeEmail } from '@/api/base44Profile';

// The profile fields screens read here, under their Base44 names.
export const PUBLIC_FIELDS = ['display_name', 'representative_state', 'representative_district'];

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));

export function createProfileApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);

  // Supabase: the profile is part of the signed-in user (auth.me()), with
  // the login id as its id.
  const sbPublic = (user) => (user ? { id: user.id, ...pick(user, PUBLIC_FIELDS) } : null);

  return {
    // The learner's own profile, or null (none yet, or signed out).
    async getPublic() {
      const user = await auth.me().catch(() => null);
      if (!user?.email) return null;
      if (provider === 'supabase') return sbPublic(user);
      const rows = await b44.entities.PublicProfile.filter({ user_email: normalizeEmail(user.email) }, '-created_date', 1);
      return rows[0] || null;
    },

    // Change fields on the profile `getPublic()` returned.
    async updatePublic(id, patch) {
      if (provider === 'supabase') return sbPublic(await auth.updateMe(patch));
      return b44.entities.PublicProfile.update(id, patch);
    },

    // Save fields, making the profile first if there is none (Base44 only;
    // Supabase makes it at sign-up). `defaults` apply only to a new one.
    async savePublic(data = {}, defaults = {}) {
      if (provider === 'supabase') {
        const user = Object.keys(data).length ? await auth.updateMe(data) : await auth.me();
        return { profile: sbPublic(user), created: false };
      }
      const user = await auth.me();
      return ensurePublicProfile(user.email, data, defaults);
    },

    // One row per day the learner opened the app: the date only. Returns
    // true when this call added it (false: already there).
    async markActiveDay(date) {
      const user = await auth.me();
      if (provider === 'supabase') {
        const rows = await run(sb().from('activity_days')
          .upsert({ user_id: user.id, date }, { onConflict: 'user_id,date', ignoreDuplicates: true })
          .select('date'));
        return (rows || []).length > 0;
      }
      const email = normalizeEmail(user.email);
      const existing = await b44.entities.ActivityDay.filter({ user_email: email, date }, null, 1);
      if (existing.length > 0) return false;
      await b44.entities.ActivityDay.create({ user_email: email, date });
      return true;
    },
  };
}

export const profile = createProfileApi();
export default profile;
