// Mock interview scores and N-400 sections read (Standalone Step 3, PR 5).
// Only the signed-in learner's own rows; nobody passes an email.
//
// Privacy, on both sides:
// - Interview sessions keep scores only. A result row keeps the officer's
//   question, its part and the scores, never what the learner said or the
//   AI text built from it (RESULT_FIELDS).
// - N-400 progress is "this section was read" + a date. On Supabase not even
//   the section's title is kept, only its id.
//
// Switch off: Base44 `InterviewSession` / `N400SectionProgress` (user_email).
// Switch on: Supabase `interview_sessions` / `n400_section_progress`
// (user_id). Rows come back in the Base44 shape (`created_date`, `id`).
//
// `createInterviewApi({ provider, base44, supabase, auth })` takes its
// clients so tests can pass fakes; the app uses `interviewSessions` and
// `n400Progress`.
import { DATA_PROVIDER, applySort, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';

export const SESSION_COLUMNS = ['overall_score', 'passed', 'question_count', 'passed_count', 'results'];
export const RESULT_FIELDS = ['question', 'section', 'content_score', 'grammar_score', 'fluency_score', 'overall_score', 'is_acceptable'];

const lower = (email) => (email || '').toLowerCase().trim();
const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => obj?.[k] !== undefined).map((k) => [k, obj[k]]));
const day = (iso) => String(iso || new Date().toISOString()).slice(0, 10);

export function createInterviewApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';

  const sessionRow = (user) => (row) => (row ? { ...row, user_email: lower(user.email), created_date: row.created_at } : row);
  const n400Row = (user) => (row) => (row ? { ...row, id: row.section_id, user_email: lower(user.email) } : row);

  const interviewSessions = {
    // { sort ('-created_date'), limit }
    async list({ sort, limit } = {}) {
      const user = await auth.me();
      if (!onSupabase) return b44.entities.InterviewSession.filter({ user_email: lower(user.email) }, sort ?? null, limit);
      const rows = await selectAll(
        () => applySort(sb().from('interview_sessions').select('*').eq('user_id', user.id), sort, { created_date: 'created_at' }).order('id', { ascending: true }),
        { limit },
      );
      return rows.map(sessionRow(user));
    },

    // Practice interviews the learner passed.
    async countPassed() {
      const user = await auth.me();
      if (!onSupabase) return b44.entities.InterviewSession.count({ user_email: lower(user.email), passed: true });
      return run(sb().from('interview_sessions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('passed', true));
    },

    // Save one finished practice interview: scores only.
    async create(data) {
      const user = await auth.me();
      const results = (data.results || []).map((r) => pick(r, RESULT_FIELDS));
      if (!onSupabase) return b44.entities.InterviewSession.create({ ...data, user_email: lower(user.email), results });
      const row = { ...pick(data, SESSION_COLUMNS), results, user_id: user.id };
      return sessionRow(user)(await run(sb().from('interview_sessions').insert(row).select('*').single()));
    },
  };

  const n400Progress = {
    async list() {
      const user = await auth.me();
      if (!onSupabase) return b44.entities.N400SectionProgress.filter({ user_email: lower(user.email) });
      const rows = await selectAll(() => sb().from('n400_section_progress').select('*').eq('user_id', user.id).order('section_id', { ascending: true }));
      return rows.map(n400Row(user));
    },

    // "I read this section". `existing` is the learner's row for it (from
    // list()) or null; `title` is kept on Base44 only.
    async markRead(existing, { sectionId, title, date = new Date().toISOString() }) {
      const user = await auth.me();
      if (!onSupabase) {
        if (existing) return b44.entities.N400SectionProgress.update(existing.id, { completed: true, completed_date: date });
        return b44.entities.N400SectionProgress.create({
          user_email: user.email, section_id: sectionId, section_title: title, completed: true, completed_date: date,
        });
      }
      return n400Row(user)(await run(sb().from('n400_section_progress')
        .upsert({ user_id: user.id, section_id: sectionId, completed: true, completed_date: day(date) }, { onConflict: 'user_id,section_id' })
        .select('*').single()));
    },
  };

  return { interviewSessions, n400Progress };
}

const interviewApi = createInterviewApi();
export const interviewSessions = interviewApi.interviewSessions;
export const n400Progress = interviewApi.n400Progress;
