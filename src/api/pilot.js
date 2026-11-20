// Pilot data (Standalone Step 3, PR 7): the learner's own check-in answers
// ("Help us improve Amio", the 3/6/12-month check-ins, the pre-interview
// question; fixed choices only) and the admins' pilot dashboard report.
//
// Check-ins: switch off = Base44 `OutcomeCheckIn` (user_email); switch on =
// Supabase `outcome_checkins` (user_id), the learner's own rows only. Never
// partner staff, never the AI.
//
// Report: one summary per learner keyed by the random pilot_id (never an
// email, name or login id), made on the server: Base44's `pilot-report`
// function, or the Supabase Edge Function of the same name
// (supabase/functions/pilot-report). Admins only; anyone else gets 404.
import { DATA_PROVIDER, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';

export const CHECK_IN_COLUMNS = [
  'kind', 'confidence', 'stage', 'filed', 'interviewed', 'passed_tests', 'oath', 'registered_to_vote', 'would_have_without_pathways',
];

const lower = (email) => (email || '').toLowerCase().trim();
const only = (data) => Object.fromEntries(Object.entries(data).filter(([k, v]) => CHECK_IN_COLUMNS.includes(k) && v !== undefined));

export function createPilotApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';
  const shape = (user) => (row) => ({ ...row, user_email: lower(user.email), created_date: row.created_at });

  return {
    // The learner's own check-ins, newest first.
    async myCheckIns() {
      const user = await auth.me().catch(() => null);
      if (!user?.email) return [];
      if (!onSupabase) return b44.entities.OutcomeCheckIn.filter({ user_email: lower(user.email) }, '-created_date', 50);
      const rows = await selectAll(() => sb().from('outcome_checkins').select('*').eq('user_id', user.id)
        .order('created_at', { ascending: false }).order('id', { ascending: true }), { limit: 50 });
      return rows.map(shape(user));
    },

    // Save one check-in (fixed choices only; anything else is dropped).
    async saveCheckIn(checkIn) {
      const user = await auth.me();
      if (!onSupabase) return b44.entities.OutcomeCheckIn.create({ user_email: lower(user.email), ...checkIn });
      return shape(user)(await run(sb().from('outcome_checkins').insert({ ...only(checkIn), user_id: user.id }).select('*').single()));
    },

    // Admins: email every learner with a check-in due (Step 5) →
    // { sent, skipped, failed }, counts only. Base44's `pilot-reminders`
    // function, or the Supabase Edge Function of the same name (Resend).
    async sendReminders(appUrl) {
      if (!onSupabase) return (await b44.functions.invoke('pilot-reminders', { action: 'send', appUrl })).data;
      const { data, error } = await sb().functions.invoke('pilot-reminders', { body: { appUrl } });
      if (error) throw new Error('Could not send reminders.');
      return data;
    },

    // Admins: { summaries, generated_at }.
    async report() {
      if (!onSupabase) return (await b44.functions.invoke('pilot-report', {})).data;
      const { data, error } = await sb().functions.invoke('pilot-report', { body: {} });
      if (error) throw new Error('Could not load the pilot report.');
      return data;
    },
  };
}

export const pilotApi = createPilotApi();
export default pilotApi;
