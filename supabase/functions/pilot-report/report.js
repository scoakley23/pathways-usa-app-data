// The pilot dashboard report, made on the server (Supabase Edge Function
// `pilot-report`, Standalone Step 3 PR 7). Plain JS with no Deno or Supabase
// imports, so src/lib/pilotReportFunction.test.js can run it.
//
// In: the pilot learners' rows (already read with the service role, only the
// columns listed in index.ts). Out: one summary per learner keyed by the
// random pilot_id, from the same learnerSummary() Base44 used
// (_shared/pilotReport.js is a copy of base44/shared/pilotReport.js; the test
// checks they match). No email, name or login id is ever returned.
import { learnerSummary } from '../_shared/pilotReport.js';

const byUser = (rows = []) => {
  const map = new Map();
  for (const r of rows) {
    if (!map.has(r.user_id)) map.set(r.user_id, []);
    map.get(r.user_id).push(r);
  }
  return map;
};

const withCreatedDate = (r) => ({ ...r, created_date: r.created_at });

export function buildPilotReport({
  users = [], profiles = [], checkIns = [], activity = [], sessions = [], mastered = [], civicsIds = [],
  memberships = [], lessonProgress = [], checkpointResults = [], now = new Date(),
}) {
  const profileOf = new Map(profiles.map((p) => [p.user_id, p]));
  const civics = new Set(civicsIds);
  const checkInsOf = byUser(checkIns);
  const activityOf = byUser(activity);
  const sessionsOf = byUser(sessions);
  const masteredOf = byUser(mastered);
  const lessonsOf = byUser(lessonProgress);
  const checkpointsOf = byUser(checkpointResults);
  // A learner's program = the partner program they picked, unless the
  // program said "not ours".
  const programOf = new Map(memberships.filter((m) => m.status !== 'removed').map((m) => [m.user_id, String(m.partner_code || '').toUpperCase()]));

  const summaries = [];
  for (const u of users) {
    // Everyone who signed in is a learner, except admins.
    if (u.app_metadata?.role === 'admin') continue;
    const p = profileOf.get(u.id);
    if (!p?.pilot_id) continue;
    summaries.push(learnerSummary({
      user: { pilot_id: p.pilot_id, state: p.state, app_language: p.app_language, created_date: u.created_at },
      checkIns: (checkInsOf.get(u.id) || []).map(withCreatedDate),
      activityDates: (activityOf.get(u.id) || []).map((r) => r.date),
      sessions: (sessionsOf.get(u.id) || []).map(withCreatedDate),
      civicsMastered: (masteredOf.get(u.id) || []).filter((r) => civics.has(r.content_id)).length,
      lessonProgress: lessonsOf.get(u.id) || [],
      checkpointResults: checkpointsOf.get(u.id) || [],
      programCode: programOf.get(u.id) || '',
      now,
    }));
  }
  return summaries;
}
