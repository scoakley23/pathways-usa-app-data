import React from 'react';
import { Badge } from '@/components/ui/badge';
import { EXAMPLE_APPLICANTS } from '@/components/n400/exampleApplicants';

// Interview sections where the learner answers as a practice person instead
// of about themselves. Learners never practice these with their own history.
export const PERSONA_SECTIONS = ['personal_info', 'morals_ethics'];

export const isPersonaSection = (q) => !!q && PERSONA_SECTIONS.includes(q.section);

export const getPersona = (id) => EXAMPLE_APPLICANTS.find((p) => p.id === id) || EXAMPLE_APPLICANTS[0];

// Plain-text fact sheet for the AI evaluator. Every fact is fictional.
export function personaFacts(p) {
  return [
    `Name: ${p.name}`,
    `Age: ${p.age}`,
    `Born in: ${p.birthplace}`,
    `Years in the U.S.: ${p.yearsInUS}`,
    `Address: ${p.address}`,
    `Marital status: ${p.marital}`,
    `Children: ${p.children.join('; ')}`,
    `Work: ${p.jobs.join('; ')}`,
    `Trips outside the U.S.: ${p.trips.join('; ')}`,
    ...p.gmc.map((g) => `${g.q} ${g.a}`),
  ].join('\n');
}

// Picker shown before the interview starts.
export function PersonaPicker({ selectedId, onSelect }) {
  return (
    <div className="bg-white rounded-xl p-4 border border-slate-100 text-left space-y-3">
      <div>
        <p className="font-bold text-slate-800">Choose a practice person</p>
        <p className="text-base text-slate-600 leading-snug">
          In Personal Information and Morals &amp; Ethics, you answer as this person, not about yourself.
        </p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {EXAMPLE_APPLICANTS.map((p) => {
          const selected = p.id === selectedId;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              aria-pressed={selected}
              className={`min-h-[44px] flex items-center gap-2 rounded-xl border-2 p-2 text-left transition-colors ${
                selected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'
              }`}
            >
              <img src={p.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              <span className="text-sm font-semibold text-slate-800 leading-tight">{p.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Card kept on screen while the learner answers as the practice person.
export default function PracticePersonaPanel({ persona }) {
  const p = persona;
  const rows = [
    ['Born in', p.birthplace],
    ['Age', String(p.age)],
    ['In the U.S.', `${p.yearsInUS} years`],
    ['Address', p.address],
    ['Marriage', p.marital],
    ['Children', p.children.join(', ')],
    ['Work', p.jobs.join('. ')],
    ['Trips', p.trips.join('. ')],
  ];

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <img
          src={p.image}
          alt={`Illustration of ${p.name}, a fictional practice person`}
          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm shrink-0"
        />
        <div className="min-w-0">
          <p className="text-base font-bold text-slate-900">Answer as {p.name}</p>
          <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">
            Practice person. Not real.
          </Badge>
        </div>
      </div>

      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1 text-sm">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="font-semibold text-slate-600">{label}</dt>
            <dd className="text-slate-800">{value}</dd>
          </React.Fragment>
        ))}
      </dl>

      <div className="text-sm space-y-1">
        {p.gmc.map((g) => (
          <p key={g.q} className="text-slate-800">
            <span className="text-slate-600">{g.q}</span> <span className="font-semibold">{g.a}</span>
          </p>
        ))}
      </div>

      <p className="text-sm text-slate-600 leading-snug">
        Not on the card? For yes/no questions, {p.name.split(' ')[0]}'s answer is "No." For other questions, make up a simple answer.
      </p>
    </div>
  );
}
