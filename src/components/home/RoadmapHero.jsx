import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import TopicArt from '@/components/art/TopicArt';
import { Tag } from '@/components/pathways/ui';

export default function RoadmapHero({ roadmap, t }) {
  const { loading, currentStop, isNew } = roadmap;

  const label = loading
    ? ''
    : isNew
    ? t('hero_start_here')
    : t('hero_step_of').replace('{n}', currentStop.id);
  const action = `${isNew ? t('hero_start') : t('hero_continue')}: ${t(`stop${currentStop.id}_name`)}`;

  return (
    <section className="rounded-[14px] bg-pw-blue-soft px-5 pt-5 pb-6 text-pw-navy">
      <div className="max-w-2xl mx-auto space-y-4">
        <TopicArt name="capitol" className="w-full h-24" />
        <div className="min-h-[36px]">{label && <Tag tone="red">{label}</Tag>}</div>
        <h1 className="font-display text-[40px] sm:text-[48px] leading-[1.05]">
          {t('hero_title')}
        </h1>
        <p className="text-lg text-pw-muted min-h-[28px]">
          {loading ? '' : `${t('hero_today')}: ${t(`stop${currentStop.id}_desc`)}.`}
        </p>
        <Link
          to={createPageUrl(currentStop.path) + (currentStop.query ? `?${currentStop.query}` : '')}
          className="w-full min-h-[56px] rounded-2xl bg-pw-navy text-white font-bold text-lg flex items-center justify-center gap-2 px-4 text-center shadow-lift hover:bg-pw-navy-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2"
        >
          {action} <ArrowRight className="w-5 h-5 shrink-0" />
        </Link>
        <p className="text-base text-pw-muted">
          {t('hero_flex')}
        </p>
        <p className="text-base font-bold">{t('hero_promise')}</p>
      </div>
    </section>
  );
}
