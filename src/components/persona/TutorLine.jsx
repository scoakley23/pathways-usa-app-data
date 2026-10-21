import React from 'react';
import TutorAvatar from './TutorAvatar';
import useTutorProfile from './useTutorProfile';

// One short line from the learner's tutor (default "Vía"): what this page is
// for, in the tutor's voice. Used under page titles so the tutor is the
// teacher on every screen, not only in lessons.
export default function TutorLine({ children, className = '' }) {
  const { profile } = useTutorProfile();
  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <TutorAvatar avatar={profile.avatar} size={44} decorative />
      <p className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white border border-pw-line px-4 py-3 text-base leading-relaxed text-pw-navy">
        <span className="block text-sm font-extrabold text-pw-muted">{profile.name}</span>
        {children}
      </p>
    </div>
  );
}
