import { base44 } from '@/api/base44Client';

// The only app code that reads or writes OutcomeCheckIn (besides "Delete all
// my data"). Owner-only records: a learner reads and adds their own.
const clean = (email) => (email || '').toLowerCase().trim();

export async function loadMyCheckIns(email) {
  const me = clean(email || (await base44.auth.me())?.email);
  if (!me) return [];
  return base44.entities.OutcomeCheckIn.filter({ user_email: me }, '-created_date', 50);
}

export async function saveCheckIn(email, checkIn) {
  return base44.entities.OutcomeCheckIn.create({ user_email: clean(email), ...checkIn });
}
