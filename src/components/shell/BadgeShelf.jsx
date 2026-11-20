import React from 'react';
import { UnitIcon } from '@/components/course/courseShared';

// The badge shelf on Me (Prompt 11, frame R30Me): one badge per section passed
// out loud (Speak it!) and one per finished unit, worked out from saved
// progress (badgeShelf() in src/lib/checkpoints.js), never stored. Earned =
// gold ring; the next ones to earn = a dashed outline. Always with the
// badge's name in words. The older practice badges stay on Progress.
export default function BadgeShelf({ badges = [], t, className = '' }) {
  return (
    <ul className={`grid grid-cols-3 gap-x-2 gap-y-4 list-none m-0 p-0 ${className}`}>
      {badges.map((b) => (
        <li key={b.id} className="flex flex-col items-center text-center gap-1.5 min-w-0">
          <span
            className={`w-16 h-16 rounded-full grid place-items-center ${
              b.earned
                ? b.kind === 'unit' ? 'border-4 border-gold bg-denim text-white' : 'border-4 border-gold bg-white text-navy'
                : 'border-2 border-dashed border-muted bg-tint text-muted'
            }`}
            aria-hidden="true"
          >
            <UnitIcon name={b.icon} className="w-7 h-7" />
          </span>
          <span className={`text-small leading-tight break-words ${b.earned ? 'font-semibold text-navy' : 'text-muted'}`} dir="auto">
            {b.kind === 'unit' ? `${t('unit_badge').replace('{n}', b.number)} · ${b.title}` : b.title}
            <span className="sr-only">, {b.earned ? t('earned') : t('not_earned')}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
