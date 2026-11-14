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

// Amio as an outline (body, hair and eyes), for the tab bar and the desktop
// pill. Same shapes as Amio.jsx; the stroke stays 2px at any size.
export function AmioIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <svg viewBox="4 4 72 72" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true" focusable="false">
      <path vectorEffect="non-scaling-stroke" d="M29 9c4-5 7 2 11-1.5s7 2.5 11-1" />
      <path vectorEffect="non-scaling-stroke" d="M40 16c17 0 28 10 28 24s-11 24-28 24c-3.5 0-6.8-.5-9.8-1.4L18 70l3.2-11.5C15.5 54 12 47.5 12 40c0-14 11-24 28-24z" />
      <circle cx="31" cy="38" r="4.5" fill="currentColor" stroke="none" />
      <circle cx="49" cy="38" r="4.5" fill="currentColor" stroke="none" />
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
