import { progress as progressApi } from '@/api/progress';
import { auth } from '@/api/auth';
import { mergeBadges, newBadges } from './badges';

// Check the signed-in learner's saved progress and points, save any badges
// just earned to User.badges. Badges are hidden from learners (Amio v2), so
// nothing is shown: no toast (amio-v2/one-tap-me). The data and counts stay.
// `run` = a finished practice run's outcomes (Full Marks); leave it out
// elsewhere. Never throws: a failed check just waits for the next one.
export async function awardBadges({ run = null } = {}) {
  try {
    const user = await auth.me();
    if (!user?.email) return [];
    const email = user.email.toLowerCase().trim();
    const progressRows = await progressApi.list({ limit: 1000 });
    const owned = user.badges || [];
    const added = newBadges({ owned, progressRows, points: user.points || 0, run });
    if (!added.length) return [];
    await auth.updateMe({ badges: mergeBadges(owned, added) });
    return added;
  } catch (e) {
    console.error('Badge check failed', e);
    return [];
  }
}
