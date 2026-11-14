import React from 'react';
import { BookOpen, CheckCircle2, ListChecks, Mountain, Star, Target } from 'lucide-react';
import { BADGES } from '@/lib/badges';

// The badge shelf on Me (frame R30Me): the badges the app already has
// (src/lib/badges.js, saved in User.badges). Earned = a gold ring, not yet =
// a dashed outline, always with the badge's name in words. One badge per
// finished section or unit comes with the course (Prompt 11).
const ICONS = {
  first_step: Star,
  ten_right: CheckCircle2,
  fifty_right: ListChecks,
  scholar: BookOpen,
  full_marks: Target,
  points_1000: Mountain,
};

export default function BadgeShelf({ earned = [], className = '' }) {
  const have = new Set(earned);
  return (
    <ul className={`grid grid-cols-3 gap-x-2 gap-y-4 ${className}`}>
      {BADGES.map((b) => {
        const on = have.has(b.id);
        const Icon = ICONS[b.id] || Star;
        return (
          <li key={b.id} className="flex flex-col items-center text-center gap-1.5">
            <span
              className={`w-16 h-16 rounded-full grid place-items-center ${on ? 'border-4 border-gold bg-white text-navy' : 'border-2 border-dashed border-mid bg-tint text-muted'}`}
              aria-hidden="true"
            >
              <Icon className="w-7 h-7" strokeWidth={2} />
            </span>
            <span className={`text-small leading-tight ${on ? 'font-semibold text-navy' : 'text-muted'}`}>
              {b.name}
              <span className="sr-only">{on ? ', earned' : ', not earned yet'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
