import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PrimaryButton, RaisedCard } from '@/components/pathways/ui';
import { PersonaPicker } from '@/components/practice/PracticePersonaPanel';

const VERSIONS = [
  { id: '2025', label: '2025 test' },
  { id: '2008', label: '2008 test' },
];

// Start screen: practice notice, practice person, civics version.
export default function RehearsalStart({ personaId, onSelectPersona, version, onSelectVersion, onStart, starting }) {
  return (
    <section aria-labelledby="rehearsal-title" className="space-y-4 text-pw-navy">
      <h2 id="rehearsal-title" className="text-[22px] leading-snug font-extrabold">Full rehearsal</h2>

      <div className="rounded-3xl bg-pw-blue-soft p-5 flex items-start gap-3">
        <ShieldCheck className="w-6 h-6 text-pw-blue-ink shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-base font-bold leading-relaxed">
          This is practice. Pathways is not part of USCIS. Your answers are not saved.
        </p>
      </div>

      <PersonaPicker
        selectedId={personaId}
        onSelect={onSelectPersona}
        description="In the N-400 part, you answer as this person, not about yourself."
      />

      <RaisedCard className="space-y-3">
        <p id="civics-version-label" className="text-lg font-extrabold">Civics test</p>
        <div className="grid grid-cols-2 gap-1 p-1 bg-pw-soft rounded-full" role="group" aria-labelledby="civics-version-label">
          {VERSIONS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={version === v.id}
              onClick={() => onSelectVersion(v.id)}
              className={`min-h-[44px] rounded-full text-base font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red ${
                version === v.id ? 'bg-white text-pw-navy shadow-raised' : 'text-pw-muted hover:text-pw-navy'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
      </RaisedCard>

      <p className="text-base text-pw-muted">About 30 minutes. You can stop any time.</p>
      <PrimaryButton large className="w-full" onClick={onStart} disabled={starting}>
        Start full rehearsal
      </PrimaryButton>
    </section>
  );
}
