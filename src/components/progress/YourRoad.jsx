import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star } from 'lucide-react';
import { ROADMAP_STOPS } from '@/components/home/roadmapStops';
import { roadStates, stopStatus } from '@/lib/todayView';

// "Your road" on Progress (The Road): the five stops as a vertical road on
// navy, with the same circles as Today (done = sky + check, current = star
// red + star, later = hollow) and one line of status each, from the
// roadmap's existing counts. Each stop opens its part of the app.
export default function YourRoad({ roadmap, stopName = (s) => s.name }) {
  const states = roadStates(ROADMAP_STOPS.map((s) => s.id), roadmap?.done || {}, roadmap?.currentStop?.id, false);
  return (
    <ol className="text-white">
      {ROADMAP_STOPS.map((stop, i) => {
        const state = states[i];
        const last = i === ROADMAP_STOPS.length - 1;
        return (
          <li key={stop.id} className="relative flex gap-4">
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute start-[20px] top-[30px] bottom-0 w-1 -translate-x-1/2 rtl:translate-x-1/2 rounded-full ${state === 'done' ? 'bg-denim' : 'bg-road'}`}
              />
            )}
            <span className="relative z-10 w-10 h-[60px] shrink-0 grid place-items-center">
              {state === 'done' && (
                <span className="w-8 h-8 rounded-full bg-denim grid place-items-center">
                  <Check className="w-4 h-4 text-white" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
              {state === 'current' && (
                <span className="w-10 h-10 rounded-full bg-red ring-[5px] ring-red/30 grid place-items-center">
                  <Star className="w-4 h-4 text-white fill-white" aria-hidden="true" />
                </span>
              )}
              {state === 'later' && <span className="w-6 h-6 rounded-full border-2 border-on-navy bg-navy" />}
            </span>
            <Link
              to={stop.href}
              aria-current={state === 'current' ? 'step' : undefined}
              className="min-w-0 flex-1 min-h-[60px] py-2 pb-4 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <span className={`block text-[17px] leading-snug ${state === 'current' ? 'font-semibold text-white' : 'font-medium text-white'}`}>
                {stopName(stop)}
                <span className="sr-only">{state === 'done' ? ', done' : state === 'current' ? ", you're here" : ''}</span>
              </span>
              <span className="block text-sm text-on-navy">{stopStatus(stop.id, roadmap?.counts, !!roadmap?.done?.[stop.id])}</span>
            </Link>
          </li>
        );
      })}
    </ol>
  );
}
