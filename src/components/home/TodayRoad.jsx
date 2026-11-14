import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { COLORS } from '@/lib/theme';

// Today's road (The Road, Prompt 3): a winding road across the navy top with
// the five stops. Done stops are sky circles with a check, the current stop
// is a star-red circle with a white star and a soft halo, later stops are
// hollow. The road behind done stops is sky. Each stop is a link to its part
// of the app. The road is drawn left to right in every language; labels
// follow the learner's language.

// Stop centers in a 360 × 210 box; low stops have their label below, high
// stops above.
const W = 360;
const H = 210;
const POINTS = [
  { x: 40, y: 150 },
  { x: 112, y: 62 },
  { x: 184, y: 150 },
  { x: 256, y: 62 },
  { x: 322, y: 150 },
];
const LEAD = { x: -8, y: 104 };
const TRAIL = { x: W + 8, y: 112 };

// A smooth bend between two points (flat where it meets each stop).
const bend = (a, b) => {
  const dx = (b.x - a.x) / 2;
  return `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
};

const pct = (v, of) => `${(v / of) * 100}%`;

// stops: [{ id, name, href, state: 'done'|'current'|'later', label }] in order.
// `label` is the stop's accessible name (e.g. "Stop 2 of 5 · Learn, you're here").
export default function TodayRoad({ stops, ariaLabel }) {
  const points = POINTS.slice(0, stops.length);
  const segments = [LEAD, ...points, TRAIL].slice(0, -1).map((a, i, arr) => {
    const b = i + 1 < arr.length ? arr[i + 1] : TRAIL;
    // The bend into stop i is "traveled" when that stop is done.
    const traveled = stops[i]?.state === 'done';
    return { d: bend(a, b), traveled };
  });

  return (
    <nav aria-label={ariaLabel} dir="ltr" className="relative w-full mt-6 mb-10" style={{ aspectRatio: `${W} / ${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full overflow-visible" aria-hidden="true" focusable="false">
        {segments.map((s, i) => (
          <path key={`r${i}`} d={s.d} fill="none" stroke={COLORS.road} strokeWidth="16" strokeLinecap="round" />
        ))}
        {segments.map((s, i) => s.traveled && (
          <path key={`t${i}`} d={s.d} fill="none" stroke={COLORS.sky} strokeWidth="16" strokeLinecap="round" />
        ))}
        {segments.map((s, i) => (
          <path key={`c${i}`} d={s.d} fill="none" stroke={COLORS.onNavy2} strokeOpacity="0.35" strokeWidth="1.5" strokeDasharray="4 7" strokeLinecap="round" />
        ))}
      </svg>

      <ol className="contents">
        {stops.map((stop, i) => {
          const p = points[i];
          const below = p.y > H / 2;
          const current = stop.state === 'current';
          return (
            <li key={stop.id}>
              <Link
                to={stop.href}
                aria-label={stop.label}
                aria-current={current ? 'step' : undefined}
                className="absolute w-11 h-11 -translate-x-1/2 -translate-y-1/2 grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ left: pct(p.x, W), top: pct(p.y, H) }}
              >
                {stop.state === 'done' && (
                  <span className="w-7 h-7 rounded-full bg-denim grid place-items-center">
                    <Check className="w-4 h-4 text-white" strokeWidth={3} aria-hidden="true" />
                  </span>
                )}
                {current && (
                  <span className="w-9 h-9 rounded-full bg-red ring-[6px] ring-red/30 grid place-items-center">
                    <Star className="w-4 h-4 text-white fill-white" aria-hidden="true" />
                  </span>
                )}
                {stop.state === 'later' && (
                  <span className="w-6 h-6 rounded-full bg-navy border-2 border-on-navy" />
                )}
              </Link>
              <span
                aria-hidden="true"
                dir="auto"
                className={`absolute w-[76px] -translate-x-1/2 text-center text-[12px] leading-tight ${below ? '' : '-translate-y-full'} ${current ? 'font-semibold text-white' : 'text-on-navy'}`}
                style={{ left: pct(p.x, W), top: pct(below ? p.y + 24 : p.y - 24, H) }}
              >
                {stop.name}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
