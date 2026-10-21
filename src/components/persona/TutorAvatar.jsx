import React from 'react';

// Six tutor portraits in the app's line-drawing style: navy lines on a soft
// circle, a light skin-tone fill, one red dot. Adults of varied ages, hair,
// and skin tones; no cartoon features, uniforms, or government imagery.
// Final art can replace these by keeping the same ids (a1–a6).
const AVATARS = {
  a1: { bg: '#E6EEF9', skin: '#F2D3BC', hair: 'long', label: 'Tutor portrait: woman with long hair' },
  a2: { bg: '#E3F2F1', skin: '#A8724F', hair: 'short', label: 'Tutor portrait: man with short hair' },
  a3: { bg: '#EEF2F8', skin: '#F4DCC8', hair: 'receding', beard: true, label: 'Tutor portrait: older man with a beard' },
  a4: { bg: '#FDECEA', skin: '#7A4E33', hair: 'curly', label: 'Tutor portrait: woman with curly hair' },
  a5: { bg: '#E6EEF9', skin: '#C99872', hair: 'bun', label: 'Tutor portrait: woman with her hair in a bun' },
  a6: { bg: '#E3F4EA', skin: '#E6C2A4', hair: 'bob', glasses: true, label: 'Tutor portrait: older woman with glasses' },
};

const HAIR = {
  long: 'M31 46c-1-14 7-23 17-23s18 9 17 23c0 12 2 20 5 26M31 46c0 12-2 20-5 26M33 40c6-2 12-7 15-12 3 5 9 10 15 12',
  short: 'M32 42c0-11 7-17 16-17s16 6 16 17M32 42c4-4 10-6 16-6s12 2 16 6',
  receding: 'M32 44c0-10 5-17 12-18M64 44c0-10-5-17-12-18M40 27c5-2 11-2 16 0',
  curly: 'M30 44c-4-4-3-11 2-13-1-6 5-10 10-8 3-5 11-5 14 0 5-2 11 2 10 8 5 2 6 9 2 13',
  bun: 'M32 42c0-11 7-17 16-17s16 6 16 17M32 40c5-6 11-8 16-8s11 2 16 8M42 22a6 6 0 1 1 12 0 6 6 0 0 1-12 0',
  bob: 'M31 50c-1-16 7-25 17-25s18 9 17 25M31 50h5M65 50h-5M34 38c5-4 9-6 14-6s9 2 14 6',
};

// `decorative` hides the portrait from screen readers when the tutor's name
// is already in the text next to it.
export default function TutorAvatar({ avatar = 'a1', size = 56, className = '', decorative = false }) {
  const a = AVATARS[avatar] || AVATARS.a1;
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : a.label}
      aria-hidden={decorative ? 'true' : undefined}
      className={`rounded-full shrink-0 ${className}`}
    >
      <circle cx="48" cy="48" r="48" fill={a.bg} />
      {/* face and neck fill */}
      <path d="M48 67c-10 0-17-9-17-21s7-20 17-20 17 8 17 20-7 21-17 21z" fill={a.skin} opacity="0.55" />
      <g fill="none" stroke="#14264A" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 92c3-15 13-23 28-23s25 8 28 23" />
        <path d="M42 67v4l6 5 6-5v-4" />
        <path d="M48 67c-10 0-17-9-17-21s7-20 17-20 17 8 17 20-7 21-17 21z" />
        <path d={HAIR[a.hair]} />
        <path d="M41 46h.01M55 46h.01" strokeWidth="3.6" />
        <path d="M44 57c2.5 1.6 5.5 1.6 8 0" />
        {a.beard && <path d="M34 54c2 8 8 13 14 13s12-5 14-13M42 60c4 2 8 2 12 0" />}
        {a.glasses && <path d="M36 46a5 5 0 1 0 10 0 5 5 0 1 0-10 0zM50 46a5 5 0 1 0 10 0 5 5 0 1 0-10 0zM46 46h4" strokeWidth="2" />}
      </g>
      <circle cx="78" cy="20" r="6" fill="#D9483F" />
    </svg>
  );
}
