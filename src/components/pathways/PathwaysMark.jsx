import React from 'react';

// The Pathways mark: a navy path rising to one red dot (the goal ahead).
// Same idea as the Home path and the line drawings. public/favicon.svg is
// the same drawing.
export default function PathwaysMark({ size = 40, className = '' }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={`shrink-0 ${className}`}>
      <rect x="1" y="1" width="46" height="46" rx="14" fill="#FFFFFF" stroke="#DEE4EE" strokeWidth="2" />
      <path d="M10 38c8 0 6-11 14-11s6-13 13-13" fill="none" stroke="#14264A" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="37" cy="14" r="6" fill="#D9483F" stroke="#FFFFFF" strokeWidth="2.5" />
    </svg>
  );
}
