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

// The four bottom tabs (Pathways + Amio, frame R33Today). Decorative: the
// tab's text label names the place.
function TabSvg({ className, strokeWidth, children }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

// Today: a house.
export function TodayIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return <TabSvg className={className} strokeWidth={strokeWidth}><path d="M4 10.5L12 4l8 6.5V20H4z" /></TabSvg>;
}

// Course: the course building.
export function CourseIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <TabSvg className={className} strokeWidth={strokeWidth}>
      <path d="M4 20V9l4-3 4 3 4-3 4 3v11" />
      <path d="M9 20v-5h6v5" />
    </TabSvg>
  );
}

// Interview: a screen on a stand.
export function InterviewIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <TabSvg className={className} strokeWidth={strokeWidth}>
      <rect x="4" y="5" width="16" height="12" rx="3" />
      <path d="M9 21h6M12 17v4" />
    </TabSvg>
  );
}

// Me: a person.
export function MeIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <TabSvg className={className} strokeWidth={strokeWidth}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 20c1-4 4-6 7-6s6 2 7 6" />
    </TabSvg>
  );
}
