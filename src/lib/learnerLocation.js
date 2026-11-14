// The learner's place for "your state's ..." civics questions and Amio:
// only a state (or D.C./territory) and a congressional district, saved on
// PublicProfile as `representative_state` / `representative_district` by
// "Who Represents Me?". No names, no address, no ZIP code. Names always come
// from src/data/officeholders.json (getOfficialsFor()).

import { validateLocation } from './officeholders.js';

/** { state, district } from a PublicProfile, or null if there is none or it isn't in the table. */
export function locationFromProfile(profile) {
  if (!profile?.representative_state) return null;
  const v = validateLocation({ state: profile.representative_state, district: profile.representative_district });
  return v.ok ? { state: v.state, district: v.district } : null;
}

// Old saved districts looked like "2", "TX-2", "2nd" or "At-Large".
function oldDistrict(value) {
  const s = String(value ?? '').trim();
  if (!s) return null;
  if (/at[\s-]?large/i.test(s)) return 'At-large';
  const n = s.match(/\d+/);
  return n ? n[0] : null;
}

/**
 * One-time clean-up of a profile saved before the officeholders table:
 * the old `representative_data` held AI-found names. Keep its state and
 * district when they are in the table (and the district wasn't a guess), and
 * drop the names. Returns the update to save, or null if nothing to change.
 */
export function profileLocationPatch(profile) {
  if (!profile || profile.representative_data == null) return null;
  const patch = { representative_data: null };
  const old = profile.representative_data;
  if (!profile.representative_state && old && typeof old === 'object') {
    const v = validateLocation({
      state: old.state || old.state_abbreviation,
      district: old.district_ambiguous ? null : oldDistrict(old.representative?.district),
    });
    if (v.ok) {
      patch.representative_state = v.state;
      patch.representative_district = v.district;
    }
  }
  return patch;
}

/** The two fields "Who Represents Me?" saves (and nothing else). */
export function locationFields(location) {
  return {
    representative_state: location?.state || null,
    representative_district: location?.district || null,
    representative_data: null,
  };
}
