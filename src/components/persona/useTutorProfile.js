import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_TUTOR_PROFILE, normalizeTutorProfile } from '@/lib/tutorPersona';

// Loads and saves the learner's tutor profile (User.tutor_profile).
// `hasProfile` is false until the learner has saved one.
// The tutor shows up on many screens at once (header, tab bar, path, chat),
// so the profile is loaded once and shared; saving updates every screen.
const EVENT = 'pathways-tutor-profile';
let shared = null; // Promise<{ profile, hasProfile }>

function loadShared() {
  if (!shared) {
    shared = base44.auth.me()
      .then((user) => ({ profile: normalizeTutorProfile(user?.tutor_profile), hasProfile: !!user?.tutor_profile }))
      .catch(() => {
        shared = null; // signed out or offline: try again next time
        return { profile: DEFAULT_TUTOR_PROFILE, hasProfile: false };
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

  const saveProfile = useCallback(async (next) => {
    const clean = normalizeTutorProfile(next);
    await base44.auth.updateMe({ tutor_profile: clean });
    shared = Promise.resolve({ profile: clean, hasProfile: true });
    setProfile(clean);
    setHasProfile(true);
    window.dispatchEvent(new Event(EVENT));
    return clean;
  }, []);

  return { profile, hasProfile, loaded, saveProfile };
}
