import React from 'react';

// Simple navy line drawings with one red accent, one per topic. Calm and
// adult: no characters or mascots. Used on lesson and page headers.
const ART = {
  // System of Government
  capitol: (
    <>
      <path d="M20 82h160M34 82V58h132v24M50 58v24M70 58v24M90 58v24M110 58v24M130 58v24M150 58v24M30 58h140l-10-8H40z" />
      <path d="M70 50c0-18 13-28 30-28s30 10 30 28M100 22V12M95 12h10M84 50V36M100 50V32M116 50V36" />
    </>
  ),
  // Principles of American Democracy (the Constitution)
  scroll: (
    <>
      <path d="M58 18h86c6 0 10 4 10 10v46c0 6-4 10-10 10H64" />
      <path d="M58 18c-6 0-10 4-10 10s4 10 10 10h6V28c0-6-2-10-6-10zM64 84c-6 0-10-4-10-10s4-10 10-10h80" />
      <path d="M78 34h56M78 44h56M78 54h40" />
      <path d="M150 12l18-6-6 18-16 22-4-4z" />
    </>
  ),
  // Rights and Responsibilities (voting)
  ballot: (
    <>
      <path d="M56 46h88v36H56zM56 46l12-14h64l12 14" />
      <path d="M84 46h32" />
      <path d="M88 40V12h28v28" />
      <path d="M94 22h16M94 30h10" />
      <path d="M66 64h68" />
    </>
  ),
  // U.S. History (the Liberty Bell)
  bell: (
    <>
      <path d="M100 10v8M88 18h24" />
      <path d="M100 18c-18 0-26 14-26 32v14l-8 10h68l-8-10V50c0-18-8-32-26-32z" />
      <path d="M100 74v8" />
      <path d="M104 30l-6 12 6 8-6 12" />
      <path d="M20 84h160" />
    </>
  ),
  // Geography and Symbols: a folded map with a route (the brand avoids flags)
  map: (
    <>
      <path d="M44 22l38-10 36 10 38-10v62l-38 10-36-10-38 10z" />
      <path d="M82 12v62M118 22v62" />
      <path d="M58 62c12-12 22 2 34-8s24-4 36-18 14-8 18-10" strokeDasharray="4 6" />
    </>
  ),
  // The road ahead (Progress, Interview Day): two roads merging into one
  road: (
    <>
      <path d="M36 86c18-24 40-34 64-40" />
      <path d="M170 76c-22-8-46-18-70-30" />
      <path d="M100 46c22-8 32-20 28-36" />
    </>
  ),
  // Reading
  book: (
    <>
      <path d="M100 26c-12-8-30-10-46-6v58c16-4 34-2 46 6 12-8 30-10 46-6V20c-16-4-34-2-46 6z" />
      <path d="M100 26v58M64 34h24M64 44h24M64 54h20M112 34h24M112 44h24M112 54h20" />
    </>
  ),
  // Writing
  pencil: (
    <>
      <path d="M40 76h70M40 64h50" />
      <path d="M122 72l-10 4 4-10 46-46 6 6z" />
      <path d="M156 26l6 6" />
    </>
  ),
  // Speaking
  speech: (
    <>
      <path d="M48 20h70c6 0 10 4 10 10v24c0 6-4 10-10 10H76l-16 14V64H48c-6 0-10-4-10-10V30c0-6 4-10 10-10z" />
      <path d="M58 36h50M58 46h34" />
      <path d="M138 40h18c5 0 8 3 8 8v14c0 5-3 8-8 8h-4v10l-12-10h-2" />
    </>
  ),
  // Vocabulary (word cards)
  cards: (
    <>
      <path d="M82 68H60c-2 0-4-2-4-4V22c0-2 2-4 4-4h54c2 0 4 2 4 4v8" />
      <path d="M64 30h14M64 40h10" />
      <path d="M88 30h56c3 0 6 3 6 6v40c0 3-3 6-6 6H88c-3 0-6-3-6-6V36c0-3 3-6 6-6z" />
      <path d="M94 46h44M94 56h30M94 66h38" />
    </>
  ),
  // Quick check / pretest
  compass: (
    <>
      <circle cx="100" cy="48" r="34" />
      <path d="M100 14v8M100 74v8M66 48h8M126 48h8" />
      <path d="M100 48l14-22-6 26zM100 48l-14 22 6-26z" />
    </>
  ),
};

// Lesson topic (CivicsQuestion.category / Lesson.topic) -> drawing.
export const TOPIC_ART = {
  'Principles of American Democracy': 'scroll',
  'System of Government': 'capitol',
  'Rights and Responsibilities': 'ballot',
  'U.S. History': 'bell',
  'Geography and Symbols': 'map',
};

// The red accent (off by default: a screen keeps only the logo's and Vía's
// dots) sits top-right, except where it would cover the drawing.
const ACCENT_LEFT = new Set(['scroll', 'pencil']);

export default function TopicArt({ name, className = 'w-full h-24', accent = false }) {
  const art = ART[name] || ART.capitol;
  const cx = ACCENT_LEFT.has(name) ? 28 : 172;
  return (
    <svg viewBox="0 0 200 90" className={className} aria-hidden="true">
      <g fill="none" stroke="#14264A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {art}
      </g>
      {accent && <circle cx={cx} cy="20" r="9" fill="#D9483F" opacity="0.85" />}
    </svg>
  );
}
