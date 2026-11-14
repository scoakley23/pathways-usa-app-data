import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_TUTOR_PROFILE, normalizeTutorProfile, tutorProfileToSave } from '@/lib/tutorPersona';

// Loads and saves the learner's tutor profile (User.tutor_profile).
// `hasProfile` is false until the learner has saved one.
// The tutor shows up on many screens at once (header, tab bar, path, chat),
// so the profile is loaded once and shared; saving updates every screen.
const EVENT = 'pathways-tutor-profile';
let shared = null; // Promise<{ profile, hasProfile, saved }>

function loadShared() {
  if (!shared) {
    shared = base44.auth.me()
      .then((user) => ({ profile: normalizeTutorProfile(user?.tutor_profile), hasProfile: !!user?.tutor_profile, saved: user?.tutor_profile || null }))
      .catch(() => {
        shared = null; // signed out or offline: try again next time
        return { profile: DEFAULT_TUTOR_PROFILE, hasProfile: false, saved: null };
      });
  }
  return shared;
}

export default function useTutorProfile() {
  const [profile, setProfile] = useState(DEFAULT_TUTOR_PROFILE);
  const [hasProfile, setHasProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const apply = () => loadShared().then((v) => {
      if (!active) return;
      setProfile(v.profile);
      setHasProfile(v.hasProfile);
      setLoaded(true);
    });
    apply();
    window.addEventListener(EVENT, apply);
    return () => {
      active = false;
      window.removeEventListener(EVENT, apply);
    };
  }, []);

  // Saves only the tone and English mix. The tutor is always Amio: an old
  // saved name is kept as it was (unused) and no new name is ever saved.
  const saveProfile = useCallback(async (next) => {
    const { saved } = await loadShared();
    const toSave = tutorProfileToSave(next, saved);
    await base44.auth.updateMe({ tutor_profile: toSave });
    const clean = normalizeTutorProfile(toSave);
    shared = Promise.resolve({ profile: clean, hasProfile: true, saved: toSave });
    setProfile(clean);
    setHasProfile(true);
    window.dispatchEvent(new Event(EVENT));
    return clean;
  }, []);

  return { profile, hasProfile, loaded, saveProfile };
}
