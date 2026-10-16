import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

// One fictional person in the example-applicants picker. Every persona is
// made up; the disclaimer badge is always shown.
export default function N400PersonaCard({ applicant, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-2xl border-2 p-4 space-y-3 bg-white transition-all hover:-translate-y-0.5 ${
        selected ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200 hover:border-indigo-300'
      }`}
    >
      <div className="flex items-start justify-between">
        <img
          src={applicant.image}
          alt={`Illustration of ${applicant.name}, a fictional practice person`}
          className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
        />
        {selected && <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />}
      </div>
      <div>
        <p className="font-bold text-slate-900">{applicant.name}</p>
        <p className="text-xs" style={{ color: '#4A5A78' }}>
          {applicant.job} · age {applicant.age} · {applicant.yearsInUS} years in the U.S.
        </p>
      </div>
      <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
        Practice person. Not real.
      </Badge>
    </button>
  );
}