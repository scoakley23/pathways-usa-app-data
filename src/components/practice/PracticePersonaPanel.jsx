import React from 'react';
import { Tag } from '@/components/pathways/ui';
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

// Scoring instructions for answers given AS a practice person (shared by the
// mock interview and N-400 coaching).
export function personaScoringBlock(p) {
  return `
The candidate is NOT answering about themselves. They are role-playing a fictional practice person, ${p.name}. Judge CONTENT against this person's facts, not the example response. If a yes/no question is not covered by the facts, this person's correct answer is "No". For other questions not covered by the facts, any simple, reasonable invented answer is acceptable. Write the corrected version as ${p.name} would answer.

PRACTICE PERSON FACTS (fictional):
${personaFacts(p)}
`;
}

// Picker shown before the interview starts. `description` replaces the
// default line (Interview Day uses its own).
export function PersonaPicker({ selectedId, onSelect, description }) {
  return (
    <div className="bg-white rounded-3xl p-5 border border-pw-line shadow-raised text-left space-y-4 text-pw-navy">
      <div>
        <p className="text-lg font-extrabold">Choose a practice person</p>
        <p className="text-base text-pw-muted leading-snug mt-1">
          {description || <>In Personal Information and Morals &amp; Ethics, you answer as this person, not about yourself.</>}
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
              className={`min-h-[56px] flex items-center gap-2 rounded-2xl border-2 p-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${
                selected ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy'
              }`}
            >
              <img src={p.image} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 bg-pw-blue-soft" />
              <span className="text-sm font-bold leading-tight">{p.name}</span>
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
    <div className="rounded-3xl bg-pw-teal-soft p-5 space-y-4 text-pw-navy">
      <div className="flex items-center gap-3">
        <img
          src={p.image}
          alt={`Illustration of ${p.name}, a fictional practice person`}
          className="w-14 h-14 rounded-full object-cover border-2 border-white bg-white shadow-raised shrink-0"
        />
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-tight mb-1">Answer as {p.name}</p>
          <Tag tone="teal" className="bg-white">Practice person. Not real.</Tag>
        </div>
      </div>

      <dl className="grid grid-cols-[auto,1fr] gap-x-3 gap-y-1.5 text-base bg-white rounded-2xl p-4">
        {rows.map(([label, value]) => (
          <React.Fragment key={label}>
            <dt className="font-bold text-pw-muted">{label}</dt>
            <dd className="min-w-0 break-words">{value}</dd>
          </React.Fragment>
        ))}
      </dl>

      <div className="text-base space-y-1.5">
        {p.gmc.map((g) => (
          <p key={g.q}>
            <span className="text-pw-muted">{g.q}</span> <span className="font-bold">{g.a}</span>
          </p>
        ))}
      </div>

      <p className="text-sm text-pw-teal-ink font-semibold leading-snug">
        Not on the card? For yes/no questions, {p.name.split(' ')[0]}'s answer is "No." For other questions, make up a simple answer.
      </p>
    </div>
  );
}
