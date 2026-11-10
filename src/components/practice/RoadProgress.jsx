import React from 'react';
import { Star } from 'lucide-react';
import { COLORS } from '@/lib/theme';
import { roadFraction } from '@/lib/practiceResults';

// The road progress bar on a practice run's navy top (The Road): a small wavy
// road, sky where it has been traveled and road-blue ahead, with a star-red
// circle (white star) at the current position. It moves one step when a
// question is answered. Screen readers hear "Question 4 of 10".
const W = 200;
const H = 24;
const MID = 12;
const AMP = 5;
const WAVE = 50; // one bend every 50 units
const yAt = (x) => MID + AMP * Math.sin((2 * Math.PI * x) / WAVE);
const PATH = Array.from({ length: W + 1 }, (_, x) => `${x === 0 ? 'M' : 'L'} ${x} ${yAt(x).toFixed(2)}`).join(' ');

export default function RoadProgress({ index = 0, total = 0, answered = false, className = '' }) {
  if (!total) return null;
  const f = roadFraction(index, total, answered);
  const x = f * W;
  const current = Math.min(index + 1, total);
  return (
    <div
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Question ${current} of ${total}`}
      dir="ltr"
      className={`relative h-8 ${className}`}
    >
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-x-0 top-1 w-full h-6 overflow-visible" aria-hidden="true" focusable="false">
        <path d={PATH} fill="none" stroke={COLORS.road} strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {f > 0 && (
          <path d={PATH} fill="none" stroke={COLORS.sky} strokeWidth="8" strokeLinecap="round" vectorEffect="non-scaling-stroke" pathLength="1" strokeDasharray={`${f} 1`} />
        )}
      </svg>
      <span
        aria-hidden="true"
        className="absolute w-[22px] h-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-star grid place-items-center transition-[left,top] duration-300"
        style={{ left: `${(x / W) * 100}%`, top: `calc(0.25rem + ${(yAt(x) / H) * 1.5}rem)` }}
      >
        <Star className="w-3 h-3 text-white fill-white" />
      </span>
    </div>
  );
}
