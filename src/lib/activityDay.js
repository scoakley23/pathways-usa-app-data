// "Days the learner was active": one ActivityDay row (email + local date,
// nothing else) the first time a learner opens the app on a day. A device
// note skips the lookup on later visits that day. Also gives the account its
// random pilot_id once, for exports, and keeps the app language code on the
// account (User.app_language) for the pilot dashboard's "Reach by language".
// The caller passes base44's `entities` and `auth` (kept out of here so it can
// be tested).
import { ymd } from '@/lib/planSettings';
import { newPilotId } from '@/lib/pilot';

export const ACTIVITY_KEY = 'pathways_activity_day';
// Layout can call this again while the first call of the day is running.
let inFlight = null;

const get = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } };

export async function recordActivityDay(user, { entities, auth, language, today = new Date() } = {}) {
  const email = user?.email?.toLowerCase().trim();
  if (!email) return false;
  const date = ymd(today);
  const mark = `${email}|${date}`;
  if (get(ACTIVITY_KEY) === mark || inFlight === mark) return false;

  inFlight = mark;
  try {
    const patch = {};
    if (!user.pilot_id) patch.pilot_id = newPilotId();
    if (language && user.app_language !== language) patch.app_language = language;
    if (Object.keys(patch).length) await auth.updateMe(patch);
    const existing = await entities.ActivityDay.filter({ user_email: email, date }, null, 1);
    if (existing.length === 0) await entities.ActivityDay.create({ user_email: email, date });
    set(ACTIVITY_KEY, mark);
    return existing.length === 0;
  } finally {
    inFlight = null;
  }
}
