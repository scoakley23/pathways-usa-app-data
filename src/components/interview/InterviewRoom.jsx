import React from 'react';
import { COLORS } from '@/lib/theme';
import { Amio } from '@/components/pathways/Amio';

// The interview room (frame R30Interview): the AI officer at a desk, and
// Amio waiting at the door. Decorative: the card text says what it is.
export default function InterviewRoom({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-tint ${className}`} aria-hidden="true">
      <svg viewBox="0 0 360 120" className="block w-full h-auto rtl:-scale-x-100" focusable="false">
        <rect x="0" y="95" width="360" height="25" fill={COLORS.mid} />
        {/* the door */}
        <rect x="24" y="20" width="52" height="78" rx="3" fill={COLORS.white} stroke={COLORS.mid} strokeWidth="3" />
        {/* the officer behind the desk */}
        <path d="M188 70c3-14 12-20 22-20s19 6 22 20z" fill={COLORS.denim} />
        <circle cx="210" cy="40" r="13" fill={COLORS.mid} />
        <path d="M197 39c0-8 6-13 13-13s13 5 13 13c-4-3-8-4-13-4s-9 1-13 4z" fill={COLORS.navy} />
        <rect x="140" y="68" width="140" height="8" rx="2" fill={COLORS.navy} />
        <rect x="150" y="76" width="7" height="22" fill={COLORS.navy} />
        <rect x="263" y="76" width="7" height="22" fill={COLORS.navy} />
      </svg>
      {/* Amio peeking in at the door (start side; mirrors in right-to-left) */}
      <div className="absolute" style={{ insetInlineStart: '9%', top: '38%', width: '13%' }}>
        <Amio mood="happy" size="100%" />
      </div>
    </div>
  );
}
