import React from 'react';
import { AmioSays } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';
import { FIRST_OPEN_STEPS } from '@/lib/onboarding';

// First open's frame (Amio v2: OnboardLanguage, OnboardHowItWorks,
// OnboardPlan): plain paper, a 3-part progress bar, Amio's one line, the
// screen's content, and one main button at the bottom.
export function FirstOpenProgress({ step, t }) {
  const n = FIRST_OPEN_STEPS.indexOf(step) + 1;
  const total = FIRST_OPEN_STEPS.length;
  return (
    <div className="flex gap-1.5">
      <p className="sr-only">{t('step_of', { n, total })}</p>
      {FIRST_OPEN_STEPS.map((s, i) => (
        <span key={s} aria-hidden="true" className={`flex-1 h-1.5 rounded-full ${i < n ? 'bg-navy' : 'bg-line'}`} />
      ))}
    </div>
  );
}

export default function OnboardingShell({ step, t, rtl, amio, amioMood = 'hello', button, onButton, buttonDisabled = false, children }) {
  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-screen bg-paper text-navy flex flex-col">
      <div className="flex-1 max-w-lg w-full mx-auto px-4 pt-8 pb-4 flex flex-col gap-5">
        <FirstOpenProgress step={step} t={t} />
        <AmioSays mood={amioMood} size={56}>{amio}</AmioSays>
        {children}
      </div>
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">
        <Button variant="main" className="w-full" onClick={onButton} disabled={buttonDisabled}>{button}</Button>
      </div>
    </div>
  );
}
