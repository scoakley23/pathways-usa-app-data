// Lesson progress and lesson notes (Standalone Step 3, PR 4). Only the
// signed-in learner's own rows; nobody passes an email. Notes are the
// learner's own words: never sent to the AI and never shown to partner staff.
//
// Switch off: Base44 `LessonProgress` / `LessonNotes` (user_email).
// Switch on: Supabase `lesson_progress` / `lesson_notes` (user_id). Rows come
// back in the Base44 shape (with `user_email`) on both sides.
//
// `createLessonsApi({ provider, base44, supabase, auth })` takes its clients
// so tests can pass fakes; the app uses `lessonProgress` and `lessonNotes`.
import { DATA_PROVIDER, applySort, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';

// Columns a screen may write (user_id and id are set here). steps_done,
// stars and completed_at belong to the new course (Prompt 4).
export const LESSON_PROGRESS_COLUMNS = [
  'lesson_id', 'topic', 'completed', 'quiz_attempts', 'best_score', 'last_score', 'total_questions',
  'last_attempt_date', 'needs_review', 'steps_done', 'stars', 'completed_at',
];
export const LESSON_NOTE_COLUMNS = ['lesson_id', 'lesson_title', 'lesson_topic', 'content'];

// A lesson counts as passed with this best score (the road's "Learn" stop).
export const PASS_SCORE = 70;

const lower = (email) => (email || '').toLowerCase().trim();
const only = (cols) => (data) => Object.fromEntries(Object.entries(data).filter(([k, v]) => cols.includes(k) && v !== undefined));

export function createLessonsApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';
  const shape = (user) => (row) => (row ? { ...row, user_email: lower(user.email) } : row);

  // One learner table with list / get / save, the same way on both sides.
  const table = ({ entity, name, columns, conflict, extra = (row) => row }) => {
    const E = () => b44.entities[entity];
    const clean = only(columns);
    const shapeRow = (user) => (row) => (row ? extra(shape(user)(row)) : row);
    const api = {
      async list({ lessonId, sort, limit } = {}) {
        const user = await auth.me();
        const where = lessonId ? { lesson_id: lessonId } : {};
        if (!onSupabase) return E().filter({ user_email: lower(user.email), ...where }, sort ?? null, limit);
        const rows = await selectAll(() => {
          let q = sb().from(name).select('*').eq('user_id', user.id);
          if (lessonId) q = q.eq('lesson_id', lessonId);
          return applySort(q, sort).order('id', { ascending: true });
        }, { limit });
        return rows.map(shapeRow(user));
      },
      async get(lessonId) {
        return (await api.list({ lessonId, limit: 1 }))[0] || null;
      },
      // Updates `existing` (from get()) or makes a new row.
      async save(existing, data) {
        const user = await auth.me();
        if (!onSupabase) return existing ? E().update(existing.id, data) : E().create(data);
        const row = clean(data);
        if (existing) {
          return shapeRow(user)(await run(sb().from(name).update(row).eq('id', existing.id).eq('user_id', user.id).select('*').single()));
        }
        const q = conflict
          ? sb().from(name).upsert({ ...row, user_id: user.id }, { onConflict: conflict })
          : sb().from(name).insert({ ...row, user_id: user.id });
        return shapeRow(user)(await run(q.select('*').single()));
      },
    };
    return api;
  };

  const progress = table({ entity: 'LessonProgress', name: 'lesson_progress', columns: LESSON_PROGRESS_COLUMNS, conflict: 'user_id,lesson_id' });

  // Lessons finished with a best score of at least PASS_SCORE.
  progress.countPassed = async () => {
    const user = await auth.me();
    if (!onSupabase) {
      return b44.entities.LessonProgress.count({ user_email: lower(user.email), completed: true, best_score: { $gte: PASS_SCORE } });
    }
    return run(sb().from('lesson_progress').select('id', { count: 'exact', head: true })
      .eq('user_id', user.id).eq('completed', true).gte('best_score', PASS_SCORE));
  };

  // lesson_notes keeps only updated_at; screens read Base44's created_date
  // (the progress chart) and updated_date.
  const notes = table({
    entity: 'LessonNotes', name: 'lesson_notes', columns: LESSON_NOTE_COLUMNS,
    extra: (row) => ({ ...row, created_date: row.created_date ?? row.updated_at, updated_date: row.updated_date ?? row.updated_at }),
  });

  return { lessonProgress: progress, lessonNotes: notes };
}

const lessonsApi = createLessonsApi();
export const lessonProgress = lessonsApi.lessonProgress;
export const lessonNotes = lessonsApi.lessonNotes;
