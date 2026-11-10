import React from 'react';
import { Check, ChevronRight, Star } from 'lucide-react';
import { sectionStates } from '@/lib/n400View';

// The guide's sections as a vertical road (The Road), like the Lessons tab:
// read = sky circle with a check, the next one to read = star-red circle with
// a star, later = hollow; a 4px line joins them (sky below read sections).
// Each row shows the title, where it is on the form and how many items it
// has; picking one opens that section.
export default function N400SectionList({ sections, completedIds = [], countFor, onSelect }) {
  const states = sectionStates(sections, completedIds);
  return (
    <ol className="text-ink">
      {sections.map((s, i) => {
        const state = states[i];
        const n = countFor(s);
        const last = i === sections.length - 1;
        return (
          <li key={s.id} className="relative flex gap-4">
            {!last && (
              <span
                aria-hidden="true"
                className={`absolute start-[20px] top-[38px] bottom-0 w-1 -translate-x-1/2 rtl:translate-x-1/2 rounded-full ${state === 'done' ? 'bg-sky' : 'bg-card-line'}`}
              />
            )}
            <span className="relative z-10 w-10 h-[76px] shrink-0 grid place-items-center">
              {state === 'done' && (
                <span className="w-8 h-8 rounded-full bg-sky grid place-items-center">
                  <Check className="w-4 h-4 text-navy" strokeWidth={3} aria-hidden="true" />
                </span>
              )}
              {state === 'current' && (
                <span className="w-10 h-10 rounded-full bg-star ring-[5px] ring-star/25 grid place-items-center">
                  <Star className="w-4 h-4 text-white fill-white" aria-hidden="true" />
                </span>
              )}
              {state === 'later' && <span className="w-6 h-6 rounded-full border-2 border-ink-2 bg-cream" />}
            </span>
            <div className="min-w-0 flex-1 pb-2">
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className={`w-full min-h-[76px] flex items-center gap-3 rounded-card px-4 py-3 text-start border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy
                  ${state === 'current' ? 'bg-white border-card-line' : 'border-transparent hover:bg-white hover:border-card-line'}`}
              >
                <span className="min-w-0 flex-1">
                  {state === 'current' && <span className="block text-label uppercase text-ink-label">You&apos;re here</span>}
                  <span className="block text-[17px] font-semibold leading-snug">{s.title}</span>
                  <span className="block text-sm text-ink-2">
                    {s.partLabel} · {n} {n === 1 ? 'item' : 'items'}
                    {state === 'done' && <span className="sr-only">, read</span>}
                  </span>
                </span>
                <ChevronRight className="w-5 h-5 shrink-0 text-ink-2 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
