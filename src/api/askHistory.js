// Ask Amio history (Standalone Step 3, PR 6): the learner's own questions and
// Amio's answers, shown only to them (Study History). Never partner staff,
// never admins, never sent anywhere. Declined case questions are never saved
// (StudyBuddy decides that before calling add()).
//
// Switch off: Base44 `AIStudyLog` (user_email). Switch on: Supabase
// `ai_study_logs` (user_id). src/lib/viaPrivacy.test.js allows only this file
// (and Delete my data) to touch it.
import { DATA_PROVIDER, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';

const lower = (email) => (email || '').toLowerCase().trim();

export function createAskHistoryApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';
  const shape = (user) => (row) => ({ ...row, user_email: lower(user.email), created_date: row.created_at });

  return {
    // Newest first.
    async list() {
      const user = await auth.me();
      if (!onSupabase) return b44.entities.AIStudyLog.filter({ user_email: user.email }, '-created_at');
      const rows = await selectAll(() => sb().from('ai_study_logs').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).order('id', { ascending: true }));
      return rows.map(shape(user));
    },

    // { question, answer, language }
    async add({ question, answer, language }) {
      const user = await auth.me();
      if (!onSupabase) {
        return b44.entities.AIStudyLog.create({ user_email: user.email, question, answer, language, created_at: new Date().toISOString() });
      }
      return shape(user)(await run(sb().from('ai_study_logs')
        .insert({ user_id: user.id, question, answer, language: language ?? null }).select('*').single()));
    },
  };
}

export const askHistory = createAskHistoryApi();
export default askHistory;
