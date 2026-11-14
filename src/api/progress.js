// Practice progress (Standalone Step 3, PR 3): one row per sentence, word or
// civics question the learner practiced (status, review timing, scores).
// Only the signed-in learner's own rows; nobody passes an email.
//
// Switch off: Base44 `UserProgress` (user_email). Switch on: Supabase
// `user_progress` (user_id). Rows come back in the Base44 shape on both
// sides (with `user_email`), so screens don't change.
//
// `createProgressApi({ provider, base44, supabase, auth })` takes its clients
// so tests can pass fakes; the app uses `progress`.
import { DATA_PROVIDER, applySort, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';

// The Supabase columns a screen may write (user_id and id are set here).
export const PROGRESS_COLUMNS = [
  'content_id', 'content_type', 'status', 'last_practiced', 'ease_factor', 'interval',
  'consecutive_correct', 'last_result', 'best_score', 'last_score', 'total_attempts',
];

const clean = (data) => Object.fromEntries(Object.entries(data).filter(([k, v]) => PROGRESS_COLUMNS.includes(k) && v !== undefined));
const lower = (email) => (email || '').toLowerCase().trim();

// { contentType, contentId, status } → column filters.
const whereOf = ({ contentType, contentId, status } = {}) => {
  const where = {};
  if (contentType) where.content_type = contentType;
  if (contentId) where.content_id = contentId;
  if (status) where.status = status;
  return where;
};

export function createProgressApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const E = () => b44.entities.UserProgress;
  const me = () => auth.me();
  // Numbers come back from Postgres numeric columns as numbers already;
  // add user_email so rows look like Base44's.
  const shape = (user) => (row) => (row ? { ...row, user_email: lower(user.email) } : row);

  const api = {
    // The learner's rows. { contentType?, contentId?, status?, sort? ('-last_practiced'), limit? }
    async list(opts = {}) {
      const user = await me();
      const where = whereOf(opts);
      if (provider !== 'supabase') return E().filter({ user_email: lower(user.email), ...where }, opts.sort ?? null, opts.limit);
      const rows = await selectAll(() => {
        let q = sb().from('user_progress').select('*').eq('user_id', user.id);
        for (const [k, v] of Object.entries(where)) q = q.eq(k, v);
        return applySort(q, opts.sort).order('id', { ascending: true }); // stable pages
      }, { limit: opts.limit });
      return rows.map(shape(user));
    },

    // How many of the learner's rows match. { contentType?, status? }
    async count(opts = {}) {
      const user = await me();
      const where = whereOf(opts);
      if (provider !== 'supabase') return E().count({ user_email: lower(user.email), ...where });
      let q = sb().from('user_progress').select('id', { count: 'exact', head: true }).eq('user_id', user.id);
      for (const [k, v] of Object.entries(where)) q = q.eq(k, v);
      return run(q);
    },

    // The learner's row for one sentence, word or question, or null.
    async get(contentId) {
      const rows = await api.list({ contentId, limit: 1 });
      return rows[0] || null;
    },

    // Save a row: updates `existing` (from get()) or makes a new one.
    // `data` uses the Base44 field names (user_email is ignored on Supabase).
    async save(existing, data) {
      const user = await me();
      if (provider !== 'supabase') {
        return existing ? E().update(existing.id, data) : E().create(data);
      }
      const row = clean(data);
      if (existing) {
        return shape(user)(await run(sb().from('user_progress').update(row).eq('id', existing.id).eq('user_id', user.id).select('*').single()));
      }
      return shape(user)(await run(sb().from('user_progress')
        .upsert({ ...row, user_id: user.id }, { onConflict: 'user_id,content_type,content_id' })
        .select('*').single()));
    },

    // Change some fields of one row (e.g. the next review date).
    async update(id, patch) {
      const user = await me();
      if (provider !== 'supabase') return E().update(id, patch);
      return shape(user)(await run(sb().from('user_progress').update(clean(patch)).eq('id', id).eq('user_id', user.id).select('*').single()));
    },
  };
  return api;
}

export const progress = createProgressApi();
export default progress;
