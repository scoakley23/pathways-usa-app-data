import React from 'react';
import { ArrowRight } from 'lucide-react';
import { auth } from '@/api/auth';
import { Button, NavyTop, PathwaysLockup } from '@/components/pathways/ui';

// The splash for signed-out visitors, on navy (The Road): the stacked logo,
// what Pathways is, Vía's hello (signed in text; her mark is in the tab bar),
// and one clear place to begin (the star-red Start here). "Start here" signs them in and goes to Getting started and
// the quick check (new students pick the student role first, which also
// leads there).
export default function StartHereCard({ t }) {
  const start = () => auth.goToSignIn('/quick-check');

  return (
    <NavyTop as="section" aria-labelledby="start-here-title" className="pt-8 pb-14">
      <div className="mx-auto max-w-xl space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center"><PathwaysLockup layout="stacked" size={80} tone="navy" /></div>
          <h1 id="start-here-title" className="font-display text-[30px] sm:text-[34px] leading-[1.1]">{t('splash_tagline')}</h1>
          <p className="text-lg text-on-navy leading-relaxed">{t('splash_body')}</p>
        </div>

        <div className="rounded-card bg-navy-2 border border-navy-line p-5">
          <p className="font-medium text-xl leading-snug">{t('splash_hello')}</p>
          <p className="mt-3 text-label uppercase text-on-navy">{t('splash_via_label')}</p>
        </div>

        <div className="space-y-3">
          <Button variant="main" onNavy className="w-full min-h-[60px]" onClick={start}>
            {t('start_here_btn')} <ArrowRight className="w-6 h-6 shrink-0 rtl:rotate-180" aria-hidden="true" />
          </Button>
          <p className="text-base text-on-navy text-center">{t('start_here_time')}</p>
          <p className="text-base font-semibold text-center">{t('hero_promise')}</p>
          <p className="text-base text-on-navy text-center">{t('independence')}</p>
        </div>
      </div>
    </NavyTop>
  );
}
