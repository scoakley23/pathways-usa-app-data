import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import { ROADMAP_STOPS } from './roadmapStops';

export default function RoadmapHero({ roadmap, t }) {
  const { loading, currentStop, isNew } = roadmap;

  const label = loading
    ? ''
    : isNew
    ? t('hero_start_here')
    : t('hero_step_of').replace('{n}', currentStop.id);
  const action = `${isNew ? t('hero_start') : t('hero_continue')}: ${t(`stop${currentStop.id}_name`)}`;

  return (
    <section className="bg-slate-900 -mx-4 -mt-16 pt-16 pb-10">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-2 text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hero-label min-h-[16px]">
          {label}
        </p>
        <h1 className="text-[38px] leading-[1.1] font-extrabold tracking-[-1px] text-white">
          {t('hero_title')}
        </h1>
        <p className="text-base text-hero-muted min-h-[24px]">
          {loading ? '' : `${t('hero_today')}: ${t(`stop${currentStop.id}_desc`)}.`}
        </p>
        <Link
          to={createPageUrl(currentStop.path) + (currentStop.query ? `?${currentStop.query}` : '')}
          className="block"
        >
          <button className="w-full h-14 rounded-2xl bg-white text-slate-900 font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
            {action} <ArrowRight className="w-5 h-5" />
          </button>
        </Link>
        <p className="text-sm text-hero-muted">
          {t('hero_flex')}
        </p>
      </div>
    </section>
  );
}