import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Tag } from '@/components/pathways/ui';

// One fictional person in the example-applicants picker. Every persona is
// made up; the disclaimer badge is always shown.
export default function N400PersonaCard({ applicant, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`w-full text-left rounded-2xl border-2 p-4 flex items-start gap-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${
        selected ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/40'
      }`}
    >
      <img
        src={applicant.image}
        alt={`Illustration of ${applicant.name}, a fictional practice person`}
        className="w-14 h-14 rounded-full object-cover border-2 border-pw-line bg-pw-blue-soft shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-base text-pw-navy leading-snug">{applicant.name}</p>
          {selected && <CheckCircle2 className="w-5 h-5 text-pw-navy shrink-0" aria-hidden="true" />}
        </div>
        <p className="text-sm text-pw-muted leading-snug">
          {applicant.job} · age {applicant.age} · {applicant.yearsInUS} years in the U.S.
        </p>
        <Tag tone="red">Practice person. Not real.</Tag>
      </div>
    </button>
  );
}
