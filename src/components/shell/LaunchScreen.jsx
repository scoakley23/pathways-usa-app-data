import React from 'react';
import { Amio } from '@/components/pathways/Amio';
import useOnboardingText from '@/components/onboarding/useOnboardingText';

// Launch (Amio v2, frame Launch): navy, Amio and the white "amio" wordmark,
// shown while the app checks the sign-in. The only place the wordmark
// appears; inside the app Amio stands alone. The mark above Amio follows the
// learner's language, like everywhere else.
export default function LaunchScreen() {
  const { t } = useOnboardingText();
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 bg-navy text-white flex flex-col items-center justify-center px-4">
      <span className="sr-only">{t('launch_loading')}</span>
      <Amio mood="hello" size={200} onNavy />
      <p className="mt-3 font-display text-[4rem] leading-none tracking-[-0.04em]" aria-hidden="true">amio</p>
      <p className="mt-2.5 text-base font-semibold text-on-navy" aria-hidden="true">{t('launch_sub')}</p>
    </div>
  );
}
