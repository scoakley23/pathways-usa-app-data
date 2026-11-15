// What Today, Your plan and Done for today read and save (Prompt 7).
// - Lessons per day: the learner's profile on Supabase (`lessons_per_day`);
//   with the switch off (Base44) it's kept on this device only
//   (`pathways_lessons_per_day`, cleared by Delete my data).
// - Active days for the streak (src/api/profile.js), and how many review
//   questions are due (src/api/review.js). Reads only otherwise.
// The interview month stays on the device (src/lib/planSettings.js).
//
// `createTodayApi({ provider, auth, profile, review })` takes its clients so
// tests can pass fakes; the app uses `today`.
import { DATA_PROVIDER } from '@/api/db';
import { auth as appAuth } from '@/api/auth';
import { profile as appProfile } from '@/api/profile';
import appReview from '@/api/review';

export const LESSONS_PER_DAY_KEY = 'pathways_lessons_per_day';
const clamp = (n) => (n >= 1 && n <= 3 ? Math.round(n) : 0);
const readLocal = () => { try { return clamp(Number(localStorage.getItem(LESSONS_PER_DAY_KEY))); } catch (e) { return 0; } };
const writeLocal = (n) => { try { localStorage.setItem(LESSONS_PER_DAY_KEY, String(n)); } catch (e) { /* storage blocked */ } };

export function createTodayApi({ provider = DATA_PROVIDER, auth = appAuth, profile = appProfile, review = appReview } = {}) {
  const on = provider === 'supabase';
  return {
    /** Lessons per day (1-3), or 0 when not set yet. */
    lessonsPerDay(user) {
      return on ? clamp(Number(user?.lessons_per_day)) : readLocal();
    },
    async setLessonsPerDay(n) {
      const v = clamp(n);
      if (!v) return 0;
      if (on) await auth.updateMe({ lessons_per_day: v });
      else writeLocal(v);
      return v;
    },
    /** Days the learner opened the app ('YYYY-MM-DD'). */
    async activeDays() {
      try { return await profile.activeDays(); } catch (e) { return []; }
    },
    /** How many review questions are due today (up to `limit`). */
    async dueCount({ knownIds = null, limit = 50 } = {}) {
      try { return (await review.due({ limit, knownIds })).length; } catch (e) { return 0; }
    },
  };
}

export const today = createTodayApi();
