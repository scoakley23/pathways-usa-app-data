import React from 'react';
import useTutorProfile from './useTutorProfile';

// One short line from the tutor, Amio: what this page is for, in the
// tutor's voice (Lexend 500), signed in text ("— Amio").
export default function TutorLine({ children, className = '' }) {
  const { profile } = useTutorProfile();
  return (
    <p className={`font-medium text-[21px] leading-snug text-pw-navy ${className}`}>
      {children}{' '}
      <span className="whitespace-nowrap text-pw-muted">— {profile.name}</span>
    </p>
  );
}
