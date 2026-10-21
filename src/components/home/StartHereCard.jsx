import React from 'react';
import { ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import TutorAvatar from '@/components/persona/TutorAvatar';
import { Tag } from '@/components/pathways/ui';

// The landing card for signed-out visitors: one clear place to begin.
// "Start here" signs them in and goes to Getting started and the quick check
// (new students pick the student role first, which also leads there).
export default function StartHereCard({ t }) {
  const start = () => base44.auth.redirectToLogin(`${window.location.origin}/quick-check`);

  return (
    <section aria-labelledby="start-here-title" className="rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden text-pw-navy">
      <div className="relative bg-pw-blue-soft px-5 pt-6 pb-5 flex items-end gap-4">
        <svg viewBox="0 0 200 60" className="absolute inset-x-0 bottom-0 w-full h-16" preserveAspectRatio="none" aria-hidden="true">
          <path d="M10 50c40 0 50-24 90-24s60-14 90-16" fill="none" stroke="#9AA8C2" strokeWidth="3" strokeLinecap="round" strokeDasharray="0.5 9" />
          <circle cx="190" cy="10" r="5" fill="#D9483F" />
        </svg>
        <span className="relative rounded-full bg-white p-1.5 shadow-lift">
          <TutorAvatar avatar="a1" size={104} decorative expression="greeting" />
        </span>
        <div className="relative pb-2">
          <Tag tone="red">{t('hero_start_here')}</Tag>
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-4">
        <div>
          <h1 id="start-here-title" className="text-[32px] sm:text-[40px] leading-[1.1] font-extrabold tracking-[-1px]">{t('hero_title')}</h1>
          <p className="mt-2 text-lg text-pw-muted leading-relaxed">{t('start_here_body')}</p>
        </div>
        <button
          type="button"
          onClick={start}
          className="w-full min-h-[64px] rounded-2xl bg-pw-navy text-white font-extrabold text-xl flex items-center justify-center gap-2 px-4 shadow-lift hover:bg-pw-navy-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
        >
          {t('start_here_btn')} <ArrowRight className="w-6 h-6 shrink-0" aria-hidden="true" />
        </button>
        <p className="text-base text-pw-muted">{t('start_here_time')}</p>
        <p className="text-base font-bold">{t('hero_promise')}</p>
      </div>
    </section>
  );
}
