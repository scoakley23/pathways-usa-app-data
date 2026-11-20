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

// Amio as an outline (body, hair and eyes), for places that need a small
// Amio icon. Same shapes as Amio.jsx; the stroke stays 2px at any size.
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

// The four tab icons, drawn as in docs/design-v2/frames/Today.html. `active`
// fills Today's house (the frame's open tab); the others stay outlines.
const TAB_SVG = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true', focusable: 'false' };

export function TodayIcon({ className = 'w-6 h-6', strokeWidth = 2, active = false }) {
  return (
    <svg {...TAB_SVG} strokeWidth={strokeWidth} fill={active ? 'currentColor' : 'none'} className={className}>
      <path d="M4 11l8-7 8 7v9H4z" />
    </svg>
  );
}

// Course: books on a shelf.
export function CourseIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <svg {...TAB_SVG} strokeWidth={strokeWidth} className={className}>
      <path d="M5 4v16M10 4v16M15 6l5 14" />
    </svg>
  );
}

// Interview: a microphone.
export function InterviewIcon({ className = 'w-6 h-6', strokeWidth = 2 }) {
  return (
    <svg {...TAB_SVG} strokeWidth={strokeWidth} className={className}>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" />
    </svg>
  );
}

// Me: a person.
export function MeIcon({ className = 'w-6 h-6', strokeWidth = 2, active = false }) {
  return (
    <svg {...TAB_SVG} strokeWidth={strokeWidth} fill={active ? 'currentColor' : 'none'} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </svg>
  );
}
