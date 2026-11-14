import { pilotApi } from '@/api/pilot';

// The only app code that reads or writes check-in answers (besides "Delete
// all my data"). Owner-only records: a learner reads and adds their own.
// The data calls live in src/api/pilot.js (Base44 or Supabase). `email` is
// kept for the callers; the signed-in learner is always the one used.

export async function loadMyCheckIns() {
  return pilotApi.myCheckIns();
}

export async function saveCheckIn(_email, checkIn) {
  return pilotApi.saveCheckIn(checkIn);
}
