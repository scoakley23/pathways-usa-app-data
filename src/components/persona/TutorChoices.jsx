import React from 'react';
import { Check } from 'lucide-react';
import { SUGGESTED_TUTOR_NAMES } from '@/lib/tutorPersona';

// One-tap name ideas; the learner can still type any name.
export function NameSuggestions({ value, onPick, label = 'Name ideas' }) {
  const current = (value || '').trim().toLowerCase();
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
      {SUGGESTED_TUTOR_NAMES.map((n) => {
        const selected = current === n.toLowerCase();
        return (
          <button
            key={n}
            type="button"
            aria-pressed={selected}
            onClick={() => onPick(n)}
            className={`min-h-[44px] rounded-full border-2 px-4 text-base font-bold inline-flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 ${
              selected ? 'border-pw-navy bg-pw-navy text-white' : 'border-pw-line bg-white text-pw-navy hover:border-pw-navy/50'
            }`}
          >
            {selected && <Check className="w-4 h-4" aria-hidden="true" />} {n}
          </button>
        );
      })}
    </div>
  );
}
