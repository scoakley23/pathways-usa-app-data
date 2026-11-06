import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { locationFields, locationFromProfile, profileLocationPatch } from '@/lib/learnerLocation';

// The learner's saved "Who Represents Me?" place ({ state, district } or
// null), shared by civics practice, lessons, Interview Day and Vía. Loaded once
// from the learner's own PublicProfile; an old profile that still holds
// AI-found names is cleaned up here (see profileLocationPatch()).
const EVENT = 'pathways-learner-location';
let shared = null; // Promise<{ profileId, location }>

function loadShared() {
  if (!shared) {
    shared = base44.auth.me()
      .then(async (user) => {
        if (!user?.email) return { profileId: null, location: null };
        const email = user.email.toLowerCase().trim();
        const profiles = await base44.entities.PublicProfile.filter({ user_email: email }, '-created_date', 1);
        let profile = profiles[0];
        if (!profile) return { profileId: null, location: null };
        const patch = profileLocationPatch(profile);
        if (patch) {
          try {
            await base44.entities.PublicProfile.update(profile.id, patch);
            profile = { ...profile, ...patch };
          } catch (e) {
            // try again next time; old names are never used either way
          }
        }
        return { profileId: profile.id, location: locationFromProfile(profile) };
      })
      .catch(() => {
        shared = null; // signed out or offline: try again next time
        return { profileId: null, location: null };
      });
  }
  return shared;
}

/** Reads the saved place without React (e.g. right before a Vía request). */
export async function getLearnerLocation() {
  return (await loadShared()).location;
}

/** Saves only the state and district on the learner's profile. */
export async function saveLearnerLocation(location) {
  const { profileId } = await loadShared();
  if (!profileId) throw new Error('No profile to save to');
  await base44.entities.PublicProfile.update(profileId, locationFields(location));
  shared = Promise.resolve({ profileId, location });
  window.dispatchEvent(new Event(EVENT));
}

/** Forget the cached copy (after Delete my data). */
export function resetLearnerLocation() {
  shared = null;
  window.dispatchEvent(new Event(EVENT));
}

export default function useLearnerLocation() {
  const [location, setLocation] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const apply = () => loadShared().then((v) => {
      if (!active) return;
      setLocation(v.location);
      setLoaded(true);
    });
    apply();
    window.addEventListener(EVENT, apply);
    return () => {
      active = false;
      window.removeEventListener(EVENT, apply);
    };
  }, []);

  const save = useCallback((next) => saveLearnerLocation(next), []);
  return { location, loaded, save };
}
