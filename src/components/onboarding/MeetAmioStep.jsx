import React from 'react';
import { Languages, Lock, MicOff, ShieldCheck } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';

// Meet Amio (Prompt 9, frame R30MeetAmio): Amio's one line and the four
// promises, then "Sounds good".

const PROMISES = [
  ['promise_language', Languages],
  ['promise_voice', MicOff],
  ['promise_story', Lock],
  ['promise_free', ShieldCheck],
];

export default function MeetAmioStep({ t, onContinue }) {
  return (
    <div className="min-h-screen bg-page flex flex-col">
      <div className="flex-1 max-w-lg w-full mx-auto px-4 pt-8 pb-4 flex flex-col items-center gap-5">
        <p className="rounded-2xl border-2 border-red bg-white px-5 py-3 text-lg font-bold text-navy text-center">{t('meet_title')}</p>
        <Amio mood="happy" size={120} />
        <ul className="w-full rounded-card bg-white border border-line p-5 flex flex-col gap-5 list-none m-0">
          {PROMISES.map(([key, Icon]) => (
            <li key={key} className="flex items-start gap-4">
              <span className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-tint text-denim"><Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block text-lg font-bold text-navy">{t(key)}</span>
                <span className="block text-base text-muted">{t(`${key}_body`)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div className="sticky bottom-0 bg-page px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onContinue}>{t('sounds_good')}</Button>
      </div>
    </div>
  );
}
