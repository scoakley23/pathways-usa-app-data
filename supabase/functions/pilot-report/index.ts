// Supabase Edge Function `pilot-report` (Standalone Step 3, PR 7): the admin
// pilot dashboard (/admin/pilot). Admins only (app_metadata.role = 'admin');
// anyone else gets 404. Reads the pilot learners' rows with the service role
// (only the columns below) and returns one summary per learner keyed by
// pilot_id (report.js). Emails, names and login ids never leave this
// function.
//
// Deploy (you run this once, and again when this folder changes):
//   supabase functions deploy pilot-report
//
// POST {} → { summaries, generated_at }
import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { buildPilotReport } from './report.js';

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
    // Who is asking: the caller's own login.
    const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await asCaller.auth.getUser();
    if (!user || user.app_metadata?.role !== 'admin') return json({ error: 'Not found.' }, 404);

    const db = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } });

    // Every row of a table, PAGE at a time.
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

    // Logins: only the id, sign-up time and role are used.
    const users: { id: string; created_at: string; app_metadata?: { role?: string } }[] = [];
    for (let page = 1; ; page += 1) {
      const { data, error } = await db.auth.admin.listUsers({ page, perPage: PAGE });
      if (error) throw error;
      users.push(...data.users.map((u) => ({ id: u.id, created_at: u.created_at, app_metadata: { role: u.app_metadata?.role } })));
      if (data.users.length < PAGE) break;
    }

    const [profiles, checkIns, activity, sessions, mastered, civics, memberships, lessonProgress, checkpointResults] = await Promise.all([
      all('profiles', 'user_id, pilot_id, state, app_language'),
      all('outcome_checkins', 'user_id, kind, confidence, stage, filed, interviewed, passed_tests, oath, registered_to_vote, would_have_without_pathways, created_at'),
      all('activity_days', 'user_id, date'),
      all('interview_sessions', 'user_id, overall_score, created_at'),
      all('user_progress', 'user_id, content_id', (q) => q.eq('content_type', 'civics_question').eq('status', 'mastered')),
      all('civics_questions', 'id', (q) => q.eq('version', '2025')),
      all('program_memberships', 'user_id, partner_code, status'),
      all('lesson_progress', 'user_id, completed, completed_at, stars'),
      all('checkpoint_results', 'user_id, passed_at'),
    ]);

    const now = new Date();
    const summaries = buildPilotReport({
      users, profiles, checkIns, activity, sessions, mastered,
      civicsIds: (civics as { id: string }[]).map((q) => q.id),
      memberships, lessonProgress, checkpointResults, now,
    } as Parameters<typeof buildPilotReport>[0]);
    return json({ summaries, generated_at: now.toISOString() });
  } catch (error) {
    console.error('pilot-report error', error);
    return json({ error: 'Something went wrong. Please try again.' }, 500);
  }
});
