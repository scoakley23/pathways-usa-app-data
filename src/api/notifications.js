// In-app notifications (Standalone Step 3, PR 6): today only the daily
// practice reminder. The learner's own rows only.
//
// Switch off: Base44 `Notification` (user_email). Switch on: Supabase
// `notifications` (user_id). Rows come back with `created_date`.
import { DATA_PROVIDER, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';

export const NOTIFICATION_COLUMNS = ['type', 'title', 'message', 'link', 'read'];

const lower = (email) => (email || '').toLowerCase().trim();
const only = (data) => Object.fromEntries(Object.entries(data).filter(([k, v]) => NOTIFICATION_COLUMNS.includes(k) && v !== undefined));

export function createNotificationsApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';
  const E = () => b44.entities.Notification;
  const shape = (user) => (row) => ({ ...row, user_email: lower(user.email), created_date: row.created_at });

  return {
    // Newest first. { limit }
    async list({ limit } = {}) {
      const user = await auth.me();
      if (!onSupabase) return E().filter({ user_email: lower(user.email) }, '-created_date', limit);
      const rows = await selectAll(() => sb().from('notifications').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).order('id', { ascending: true }), { limit });
      return rows.map(shape(user));
    },

    async create(data) {
      const user = await auth.me();
      if (!onSupabase) return E().create({ ...data, user_email: lower(user.email) });
      return shape(user)(await run(sb().from('notifications').insert({ ...only(data), user_id: user.id }).select('*').single()));
    },

    async markRead(id) {
      const user = await auth.me();
      if (!onSupabase) return E().update(id, { read: true });
      return run(sb().from('notifications').update({ read: true }).eq('id', id).eq('user_id', user.id));
    },

    async remove(id) {
      const user = await auth.me();
      if (!onSupabase) return E().delete(id);
      return run(sb().from('notifications').delete().eq('id', id).eq('user_id', user.id));
    },
  };
}

export const notifications = createNotificationsApi();
export default notifications;
