import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight } from 'lucide-react';
import { ROADMAP_STOPS } from './roadmapStops';

export default function RoadmapHero({ roadmap }) {
  const { loading, currentStop, isNew } = roadmap;

  const label = loading ? '' : isNew ? 'Start here' : `Step ${currentStop.id} of 5`;
  const action = isNew ? `Start: ${currentStop.name}` : `Continue: ${currentStop.name}`;

  return (
    <section className="bg-slate-900 -mx-4 -mt-16 pt-16 pb-10">
      <div className="max-w-2xl mx-auto px-6 pt-10 pb-2 text-center space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-hero-label min-h-[16px]">
          {label}
        </p>
        <h1 className="text-[38px] leading-[1.1] font-extrabold tracking-[-1px] text-white">
          Walk into your interview ready.
        </h1>
        <p className="text-base text-hero-muted min-h-[24px]">
          {loading ? '' : `Today: ${currentStop.desc}.`}
        </p>
        <Link to={createPageUrl(currentStop.path)} className="block">
          <button className="w-full h-14 rounded-2xl bg-white text-slate-900 font-bold text-base flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
            {action} <ArrowRight className="w-5 h-5" />
          </button>
        </Link>
        <p className="text-sm text-hero-muted">
          Every step stays open — explore in any order you like.
        </p>
      </div>
    </section>
  );
}