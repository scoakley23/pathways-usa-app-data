import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { DEFAULT_TUTOR_PROFILE, normalizeTutorProfile } from '@/lib/tutorPersona';

// Loads and saves the learner's tutor profile (User.tutor_profile).
// `hasProfile` is false until the learner has saved one.
export default function useTutorProfile() {
  const [profile, setProfile] = useState(DEFAULT_TUTOR_PROFILE);
  const [hasProfile, setHasProfile] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    base44.auth.me()
      .then((user) => {
        if (!active) return;
        setProfile(normalizeTutorProfile(user?.tutor_profile));
        setHasProfile(!!user?.tutor_profile);
      })
      .catch(() => {})
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);

  const saveProfile = useCallback(async (next) => {
    const clean = normalizeTutorProfile(next);
    await base44.auth.updateMe({ tutor_profile: clean });
    setProfile(clean);
    setHasProfile(true);
    return clean;
  }, []);

  return { profile, hasProfile, loaded, saveProfile };
}
