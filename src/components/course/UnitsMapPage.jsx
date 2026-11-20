import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Amio } from '@/components/pathways/Amio';
import { lessonCounts, unitState } from '@/lib/journey';
import { OathIcon, UnitIcon, useCourseText, useJourney } from '@/components/course/courseShared';

// All units (/course/units, frame R31Map): the 7 unit cards on a trail up to
// Oath Day, Unit 1 at the bottom. The suggested unit has a gold border and
// Amio (red is Amio only); nothing is locked. The page opens scrolled to it.
// Tapping a unit opens it on the Course tab.

export default function UnitsMapPage() {
  const { t, rtl } = useCourseText();
  const journey = useJourney();
  const currentRef = useRef(null);
  const units = [...journey.course].reverse();
  const lessons = journey.course.reduce((n, u) => n + u.sections.reduce((m, s) => m + s.lessons.length, 0), 0);
  const interviews = journey.course.length;

  useEffect(() => {
    if (!journey.loading) currentRef.current?.scrollIntoView?.({ block: 'center' });
  }, [journey.loading]);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-scene-sky">
      <NavyBanner
        title={t('journey_title')}
        subtitle={<span dir="auto">{t('journey_sub', { units: journey.course.length, lessons, interviews })}</span>}
        left={(
          <Link to="/course" aria-label={t('back')} className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </Link>
        )}
      />
      <div className="relative max-w-lg mx-auto px-4 py-6">
        {/* The trail behind the cards. */}
        <span className="absolute top-8 bottom-8 start-1/2 w-3 -ms-1.5 rounded-full bg-white border-2 border-mid border-dashed" aria-hidden="true" />
        <ol className="relative list-none m-0 p-0 flex flex-col gap-5">
          <li className="flex justify-center">
            <div className="flex items-center gap-4 rounded-card bg-navy px-5 py-4 text-white w-[85%] max-w-sm">
              <span className="grid place-items-center w-14 h-14 shrink-0 rounded-full bg-gold text-navy"><OathIcon className="w-7 h-7" strokeWidth={2} aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block text-lg font-bold">{t('oath_day')}</span>
                <span className="block text-base text-on-navy">{t('oath_sub')}</span>
              </span>
            </div>
          </li>
          {units.map((u, i) => {
            const state = unitState(u, journey.stops, journey.currentUnit);
            const counts = lessonCounts(u, journey.progress);
            const current = state === 'current';
            const look = current ? 'bg-white border-2 border-gold' : state === 'done' ? 'bg-white border-2 border-denim' : 'bg-white border-2 border-line';
            return (
              <li key={u.id} className={`flex ${i % 2 ? 'justify-end' : 'justify-start'}`} ref={current ? currentRef : undefined}>
                <Link
                  to={`/course?unit=${u.id}`}
                  aria-current={current ? 'step' : undefined}
                  className={`relative flex items-center gap-4 rounded-card px-4 py-4 w-[85%] max-w-sm ${look} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim`}
                >
                  <span className={`grid place-items-center w-12 h-12 shrink-0 rounded-2xl ${current ? 'bg-gold text-navy' : state === 'done' ? 'bg-denim text-white' : 'bg-tint text-navy'}`}>
                    <UnitIcon name={u.icon} className="w-6 h-6" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span dir="auto" className="block text-lg font-bold text-navy break-words">{u.number} · {u.title}</span>
                    <span dir="auto" className="block text-small text-muted break-words">{u.description}</span>
                  </span>
                  <span className="shrink-0 text-base font-semibold text-muted tabular-nums">{counts.done}/{counts.total}</span>
                  {current && <span className="absolute -top-6 -end-3" aria-hidden="true"><Amio mood="wave" size={48} /></span>}
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
