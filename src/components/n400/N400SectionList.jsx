import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { sectionStates } from '@/lib/n400View';

// The guide's sections (frame R30N400): numbered white rows. A read section
// has a denim check; the next one to read is marked "Next" in words. Each row
// shows the title, where it is on the form and how many cards it has. Only
// whole sections are saved as read (never which cards), so there is no
// "n of m cards" count.
export default function N400SectionList({ sections, completedIds = [], countFor, onSelect }) {
  const states = sectionStates(sections, completedIds);
  return (
    <ol className="space-y-2 text-navy">
      {sections.map((s, i) => {
        const state = states[i];
        const n = countFor(s);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className={`w-full min-h-[72px] flex items-center gap-3 rounded-card bg-white border px-4 py-3 text-start transition-colors hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${state === 'current' ? 'border-denim' : 'border-line'}`}
            >
              <span
                className={`w-10 h-10 shrink-0 rounded-full grid place-items-center text-base font-bold ${state === 'done' ? 'bg-denim text-white' : state === 'current' ? 'bg-navy text-white' : 'bg-tint text-navy'}`}
                aria-hidden="true"
              >
                {state === 'done' ? <Check className="w-5 h-5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[17px] font-semibold leading-snug">{s.title}</span>
                <span className="block text-small text-muted">
                  {n} {n === 1 ? 'card' : 'cards'}
                  {state === 'done' && ' · Read'}
                  {state === 'current' && ' · Next'}
                </span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
