// Supabase Edge Function `pilot-reminders` (Step 5): pilot check-in reminder
// emails. An admin presses "Send due reminders" (Admin → Pilot) weekly.
// Admins only (app_metadata.role = 'admin'); anyone else gets 404.
//
// Emails every learner who turned reminders on and has a 3-, 6- or 12-month
// check-in open, once per check-in (rules: reminderPlan() in
// _shared/pilotCheckIns.js, shared with Base44), in their reminder language
// from the translation pack (_shared/reminderTexts.generated.js; English
// otherwise). Each sent email is recorded in check_in_reminders (user id,
// kind, date; admin-only, deleted with the login). Returns counts only,
// never who. The email never mentions citizenship, immigration, the
// interview or USCIS.
//
// Setup (you run these; never paste a key into a chat):
//   supabase secrets set RESEND_API_KEY=...
//   supabase functions deploy pilot-reminders
//
// POST { appUrl } → { sent, skipped, failed }
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { sendEmail } from '../_shared/email.js';
import { reminderText } from '../_shared/pilotCheckIns.js';
import { appOrigin, duePlan, reminderTextFor } from '../_shared/reminderJob.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const PAGE = 1000;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await asCaller.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') return json({ error: 'Not found.' }, 404);

    const body = await req.json().catch(() => ({}));
    const link = appOrigin((body as { appUrl?: string })?.appUrl);
    if (!link) return json({ error: 'Missing app address.' }, 400);
    const key = Deno.env.get('RESEND_API_KEY');
    if (!key) return json({ error: 'Email is not set up yet.' }, 503);

    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });
    // deno-lint-ignore no-explicit-any
    const all = async (table: string, columns: string, filter = (q: any) => q) => {
      const rows: unknown[] = [];
      for (let from = 0; ; from += PAGE) {
        const { data, error } = await filter(db.from(table).select(columns)).range(from, from + PAGE - 1);
        if (error) throw error;
        rows.push(...(data || []));
        if (!data || data.length < PAGE) break;
      }
      return rows;
    };

    // deno-lint-ignore no-explicit-any
    const profiles = await all('profiles', 'user_id, checkin_email_reminders, reminder_language, checkins_stopped, pilot_test_months_ago', (q: any) => q.eq('checkin_email_reminders', true)) as any[];
    if (!profiles.length) return json({ sent: 0, skipped: 0, failed: 0 });
    const ids = new Set(profiles.map((p) => p.user_id));

    // Logins: only the id, email, sign-up time and role are used.
    const authUsers: { id: string; email: string; created_at: string; app_metadata: { role?: string } }[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: PAGE });
      if (error) throw error;
      for (const u of data.users) if (ids.has(u.id)) authUsers.push({ id: u.id, email: u.email ?? '', created_at: u.created_at, app_metadata: { role: u.app_metadata?.role } });
      if (data.users.length < PAGE) break;
    }
    const [checkIns, reminders] = await Promise.all([
      all('outcome_checkins', 'user_id, kind, created_at'),
      all('check_in_reminders', 'user_id, kind'),
    ]);

    const plan = duePlan({ authUsers, profiles, checkIns, reminders, now: new Date() } as Parameters<typeof duePlan>[0]);
    let sent = 0;
    let failed = 0;
    for (const item of plan) {
      const text = reminderTextFor(item.language);
      try {
        await sendEmail({ key, to: item.email, subject: text.subject, text: reminderText(text.body, link) });
        const { error } = await db.from('check_in_reminders').insert({ user_id: item.user_id, kind: item.kind });
        if (error) throw error;
        sent++;
      } catch (_err) {
        console.error('pilot-reminders: one email failed'); // never who
        failed++;
      }
    }
    return json({ sent, skipped: profiles.length - plan.length, failed });
  } catch (_error) {
    console.error('pilot-reminders failed');
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
