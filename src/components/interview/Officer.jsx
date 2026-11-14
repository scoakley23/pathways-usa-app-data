import React from 'react';
import { COLORS } from '@/lib/theme';

// The AI practice officer (frames R30Interview, R30Call): a simple drawing,
// head and shoulders, never a photo. Always shown with the label
// "AI practice officer · not a real person" next to it (callers add it).
// The face is a neutral tint from the tokens, not a skin color.
export default function Officer({ size = 160, className = '' }) {
  return (
    <svg viewBox="0 0 160 160" width={size} height={size} className={`shrink-0 ${className}`} aria-hidden="true" focusable="false">
      <circle cx="80" cy="80" r="80" fill={COLORS.white} />
      <path d="M36 150c4-30 22-46 44-46s40 16 44 46z" fill={COLORS.denim} />
      <circle cx="80" cy="68" r="27" fill={COLORS.mid} />
      <path d="M53 66c0-17 12-28 27-28s27 11 27 28c-8-6-17-9-27-9s-19 3-27 9z" fill={COLORS.navy} />
    </svg>
  );
}
