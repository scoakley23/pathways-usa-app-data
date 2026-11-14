// Resource Hub places the learner saved (Standalone Step 3, PR 6): the
// place's id only, no location, no notes. The learner's own rows only.
//
// Switch off: Base44 `SavedPlace` (user_email + resource_id). Switch on:
// Supabase `saved_places` (user_id + resource_id, one row per place; the row's
// id is the place's id).
import { DATA_PROVIDER, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';

const lower = (email) => (email || '').toLowerCase().trim();

export function createSavedPlacesApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';
  const E = () => b44.entities.SavedPlace;

  return {
    // Newest first: [{ id, resource_id }]
    async list() {
      const user = await auth.me();
      if (!onSupabase) return E().filter({ user_email: lower(user.email) }, '-created_date', 1000);
      const rows = await selectAll(() => sb().from('saved_places').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).order('resource_id', { ascending: true }));
      return rows.map((r) => ({ ...r, id: r.resource_id, created_date: r.created_at }));
    },

    async add(resourceId) {
      const user = await auth.me();
      if (!onSupabase) return E().create({ user_email: lower(user.email), resource_id: resourceId });
      return run(sb().from('saved_places')
        .upsert({ user_id: user.id, resource_id: resourceId }, { onConflict: 'user_id,resource_id', ignoreDuplicates: true }));
    },

    // `rows`: the learner's saved rows for this place (from list()).
    async remove(resourceId, rows = []) {
      const user = await auth.me();
      if (!onSupabase) return Promise.all(rows.map((r) => E().delete(r.id)));
      return run(sb().from('saved_places').delete().eq('user_id', user.id).eq('resource_id', resourceId));
    },
  };
}

export const savedPlaces = createSavedPlacesApi();
export default savedPlaces;
