import { base44 } from '@/api/base44Client';

// Normalize emails for all PublicProfile lookups and writes
export const normalizeEmail = (email) => (email || '').toLowerCase().trim();

// The ONLY place PublicProfile records are created.
// If a profile already exists for this user_email, it is updated instead.
export async function ensurePublicProfile(email, data = {}) {
  const user_email = normalizeEmail(email);
  const existing = await base44.entities.PublicProfile.filter({ user_email }, null, 1);
  if (existing.length > 0) {
    const current = existing[0];
    await base44.entities.PublicProfile.update(current.id, data);
    return { profile: { ...current, ...data }, created: false };
  }
  const profile = await base44.entities.PublicProfile.create({ ...data, user_email });
  return { profile, created: true };
}