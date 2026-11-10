import React from 'react';

// Outline icons drawn for Pathways (2px stroke, 24px box, like lucide). Both
// are decorative: the tab's text label names the place.

// Today: a small winding road (two edges and a dashed center line).
export function RoadIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="M4 21c4-4 4-7 2-10s0-6 3-8" />
      <path d="M20 21c-4-4-6-7-5-10s3-6 0-8" />
      <path d="M12.5 19.5l-.5-1.5M11 14.5l-.2-1.5M11.4 9.5l.4-1.2M12.4 5.5l.4-.8" />
    </svg>
  );
}

// Vía: the V mark as an outline (two paths meeting at a dot).
export function ViaIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path d="M5 4c2.5 4 4.5 8.5 7 14" />
      <path d="M19 4c-2.5 4-4.5 8.5-7 14" />
      <circle cx="12" cy="20.5" r="1.25" fill="currentColor" />
    </svg>
  );
}
