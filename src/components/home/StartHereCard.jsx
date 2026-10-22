import React from 'react';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { IndexCard, PathwaysLockup } from '@/components/pathways/ui';

// The splash for signed-out visitors: the stacked logo, what Pathways is,
// Vía's hello (signed in text; her mark is in the tab bar), and one clear
// place to begin. "Start here" signs them in and goes to Getting started and
// the quick check (new students pick the student role first, which also
// leads there).
export default function StartHereCard({ t }) {
  const start = () => base44.auth.redirectToLogin(`${window.location.origin}/quick-check`);

  return (
    <section aria-labelledby="start-here-title" className="text-pw-navy space-y-6 pt-2">
      <div className="text-center space-y-3">
        <PathwaysLockup layout="stacked" size={80} />
        <h1 id="start-here-title" className="font-display text-[34px] sm:text-[44px] leading-[1.1]">{t('splash_tagline')}</h1>
        <p className="mx-auto max-w-xl text-lg text-pw-muted leading-relaxed">{t('splash_body')}</p>
      </div>

      <IndexCard className="max-w-xl mx-auto">
        <p className="font-display italic text-2xl leading-snug">{t('splash_hello')}</p>
        <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-pw-muted">{t('splash_via_label')}</p>
      </IndexCard>

      <div className="max-w-xl mx-auto space-y-3">
        <button
          type="button"
          onClick={start}
          className="w-full min-h-[64px] rounded-xl bg-pw-navy text-white font-bold text-xl flex items-center justify-center gap-2 px-4 shadow-lift hover:bg-pw-navy-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
        >
          {t('start_here_btn')} <ArrowRight className="w-6 h-6 shrink-0" aria-hidden="true" />
        </button>
        <p className="text-base text-pw-muted text-center">{t('start_here_time')}</p>
        <p className="text-base font-semibold text-center">{t('hero_promise')}</p>
        <p className="text-base text-pw-muted text-center">{t('independence')}</p>
      </div>
    </section>
  );
}
