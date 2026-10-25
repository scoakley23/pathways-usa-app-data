import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { badgeName, mergeBadges, newBadges } from './badges';

// Check the signed-in learner's saved progress and points, save any badges
// just earned to User.badges, and say so with one quiet toast each.
// `run` = a finished practice run's outcomes (Full Marks); leave it out
// elsewhere. Never throws: a failed check just waits for the next one.
export async function awardBadges({ run = null } = {}) {
  try {
    const user = await base44.auth.me();
    if (!user?.email) return [];
    const email = user.email.toLowerCase().trim();
    const progressRows = await base44.entities.UserProgress.filter({ user_email: email }, null, 1000);
    const owned = user.badges || [];
    const added = newBadges({ owned, progressRows, points: user.points || 0, run });
    if (!added.length) return [];
    await base44.auth.updateMe({ badges: mergeBadges(owned, added) });
    for (const id of added) toast.success(`New badge: ${badgeName(id)}`);
    return added;
  } catch (e) {
    console.error('Badge check failed', e);
    return [];
  }
}
