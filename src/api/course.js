// The learner's course progress for the Course tab (Prompt 5): lesson stars
// and steps from `lesson_progress`, and passed Speak it! checkpoints from
// `checkpoint_results`. Reads only; Prompts 6 and 8 save them.
//
// Switch on (Supabase): the learner's own rows. Switch off (Base44): course
// progress isn't saved on Base44, so everyone starts at the beginning.
//
// `createCourseApi({ provider, supabase, auth, lessonProgress })` takes its
// clients so tests can pass fakes; the app uses `courseProgress`.
import { DATA_PROVIDER, selectAll } from '@/api/db';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';
import { lessonProgress as appLessonProgress } from '@/api/lessons';

export function createCourseApi({ provider = DATA_PROVIDER, supabase = getSupabase, auth = appAuth, lessonProgress = appLessonProgress } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  return {
    /** { lessons: { lessonId: { completed, stars, steps_done, completed_at } }, checkpoints: Set(sectionId) } */
    async load(lessonIds = []) {
      const empty = { lessons: {}, checkpoints: new Set() };
      if (provider !== 'supabase') return empty;
      const wanted = new Set(lessonIds);
      const user = await auth.me();
      if (!user) return empty;
      const [rows, results] = await Promise.all([
        lessonProgress.list(),
        selectAll(() => sb().from('checkpoint_results').select('section_id, passed_at').eq('user_id', user.id).order('id', { ascending: true })),
      ]);
      const lessons = {};
      for (const r of rows) {
        if (!wanted.has(r.lesson_id)) continue;
        lessons[r.lesson_id] = { completed: !!(r.completed || r.completed_at), stars: r.stars || 0, steps_done: r.steps_done || 0, completed_at: r.completed_at || null };
      }
      return { lessons, checkpoints: new Set(results.filter((r) => r.passed_at).map((r) => r.section_id)) };
    },
  };
}

export const courseProgress = createCourseApi();
