import React from 'react';
import useTutorProfile from './useTutorProfile';

// One short line from the learner's tutor (default "Vía"): what this page is
// for, in the tutor's voice. Used under page titles so the tutor is the
// teacher on every screen, not only in lessons. Signed in text: Vía's mark
// shows once per screen, in the tab bar.
export default function TutorLine({ children, className = '' }) {
  const { profile } = useTutorProfile();
  return (
    <p className={`rounded-[14px] bg-white border border-pw-line px-4 py-3 text-base leading-relaxed text-pw-navy ${className}`}>
      {children}{' '}
      <span className="whitespace-nowrap font-display italic text-lg text-pw-muted">— {profile.name}</span>
    </p>
  );
}
