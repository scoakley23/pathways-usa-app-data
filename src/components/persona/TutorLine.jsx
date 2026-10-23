import React from 'react';
import useTutorProfile from './useTutorProfile';

// One short line from the learner's tutor (default "Vía"): what this page is
// for, in the tutor's voice: Instrument Serif italic, signed in text. Vía's
// mark shows once per screen, in the tab bar (or the desktop Ask button).
export default function TutorLine({ children, className = '' }) {
  const { profile } = useTutorProfile();
  return (
    <p className={`font-display italic text-[21px] leading-snug text-pw-navy ${className}`}>
      {children}{' '}
      <span className="whitespace-nowrap text-pw-muted">— {profile.name}</span>
    </p>
  );
}
