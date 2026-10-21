import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Check, Notebook, BookOpen, Mic, CalendarCheck, Star } from 'lucide-react';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import { ROADMAP_STOPS } from './roadmapStops';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

const STOP_ICONS = { 1: Notebook, 2: BookOpen, 3: Mic, 4: CalendarCheck };

const stopUrl = (stop) =>
  createPageUrl(stop.path) + (stop.query ? `?${stop.query}` : '');

// Design geometry (viewBox units; panel is always 360 units wide in the design)
const LEFT_X = 48;
const RIGHT_X = 312;
const STOP_Y = [90, 222, 354, 486, 618];
const PANEL_HEIGHT = 724;

function pathThrough(points) {
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const dy = (y1 - y0) / 2;
    d += ` C ${x0} ${y0 + dy}, ${x1} ${y1 - dy}, ${x1} ${y1}`;
  }
  return d;
}

export default function RoadmapPath({ roadmap, t, language, onLanguageChange, translating }) {
  const { loading, currentStop, done, doneCount } = roadmap;

  const mirror = RTL_LANGUAGES.includes((language || 'en').slice(0, 2).toLowerCase());
  const stops = ROADMAP_STOPS.map((s) => ({
    ...s,
    name: t(`stop${s.id}_name`),
    short: t(`stop${s.id}_short`),
  }));
  const xs = ROADMAP_STOPS.map((_, i) => {
    const base = i % 2 === 0 ? LEFT_X : RIGHT_X;
    return mirror ? 360 - base : base;
  });
  const xsPct = xs.map((x) => (x / 360) * 100);

  const currentIdx = loading ? 0 : stops.findIndex((s) => s.id === currentStop.id);
  const allPoints = [
    [xs[0], 10],
    ...ROADMAP_STOPS.map((_, i) => [xs[i], STOP_Y[i]]),
    [xs[4], 700],
  ];
  const solidPath = pathThrough(allPoints.slice(0, currentIdx + 2));
  const dottedPath = pathThrough(allPoints.slice(currentIdx + 1));

  return (
    <section aria-label={t('path_title')} dir={mirror ? 'rtl' : 'ltr'}>
      <div className="max-w-[480px] mx-auto">
        <div className="flex justify-end mb-2">
          <LanguageSelector language={language} onLanguageChange={onLanguageChange} translating={translating} />
        </div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-2xl font-extrabold tracking-[-0.5px] text-pw-navy">{t('path_title')}</h2>
          <span className="text-base font-bold text-pw-muted min-h-[20px]">
            {loading ? '' : t('path_done_of').replace('{n}', doneCount)}
          </span>
        </div>

        <div
          className="relative rounded-3xl bg-white border border-pw-line shadow-raised overflow-hidden"
          style={{ height: PANEL_HEIGHT }}
        >
          {/* Winding road */}
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox={`0 0 360 ${PANEL_HEIGHT}`}
            preserveAspectRatio="none"
            aria-hidden="true"
            style={mirror ? { transform: 'scaleX(-1)' } : undefined}
          >
            <path
              d={dottedPath}
              fill="none"
              stroke="#9AA8C2"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray="0.5 12"
              vectorEffect="non-scaling-stroke"
            />
            <path
              d={solidPath}
              fill="none"
              stroke="#14264A"
              strokeWidth={6}
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          </svg>

          {/* Tiny stars */}
          <div aria-hidden="true" className="absolute top-[130px] left-[58%] w-1.5 h-1.5 rounded-full bg-pw-red/50" />
          <div aria-hidden="true" className="absolute top-[410px] left-[8%] w-1 h-1 rounded-full bg-pw-line" />
          <div aria-hidden="true" className="absolute top-[560px] left-[54%] w-1.5 h-1.5 rounded-full bg-pw-line" />

          {/* Hills */}
          <div aria-hidden="true" className="absolute -bottom-20 -left-24 w-72 h-44 rounded-full bg-pw-blue-soft" />
          <div aria-hidden="true" className="absolute -bottom-24 -right-10 w-64 h-48 rounded-full bg-pw-soft" />

          {/* Stops */}
          {stops.map((stop, i) => {
            const isDone = !!done[stop.id];
            const isCurrent = !loading && currentStop.id === stop.id;
            const isOath = stop.id === 5;
            const x = xsPct[i];
            const onLeft = x < 50;
            const ariaLabel = `${stop.name}: ${stop.short}.${isCurrent ? ' You are here.' : ''}`;
            const focusRing =
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 rounded-full';

            let marker;
            if (isOath) {
              marker = (
                <Link
                  to={stopUrl(stop)}
                  aria-label={ariaLabel}
                  className="flex flex-col items-center gap-1 rounded-3xl p-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-pw-red"
                >
                  <Star className="w-12 h-12 text-pw-red fill-pw-red" strokeWidth={1.5} />
                  <span className="text-sm font-extrabold uppercase tracking-wide text-pw-navy">
                    {t('oath_day')}
                  </span>
                </Link>
              );
            } else if (isCurrent) {
              const Icon = STOP_ICONS[stop.id];
              marker = (
                <Link
                  to={stopUrl(stop)}
                  aria-label={ariaLabel}
                  className={`flex items-center justify-center w-[68px] h-[68px] rounded-full bg-pw-red border-[5px] border-white shadow-lift ${focusRing}`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </Link>
              );
            } else if (isDone) {
              const Icon = STOP_ICONS[stop.id];
              marker = (
                <Link
                  to={stopUrl(stop)}
                  aria-label={ariaLabel}
                  className={`relative flex items-center justify-center w-12 h-12 rounded-full bg-pw-navy ${focusRing}`}
                >
                  <Icon className="w-5 h-5 text-white" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-pw-green-soft border-2 border-white flex items-center justify-center">
                    <Check className="w-3 h-3 text-pw-green-ink" strokeWidth={3.5} />
                  </span>
                </Link>
              );
            } else {
              const Icon = STOP_ICONS[stop.id];
              marker = (
                <Link
                  to={stopUrl(stop)}
                  aria-label={ariaLabel}
                  className={`flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-pw-line ${focusRing}`}
                >
                  <Icon className="w-5 h-5 text-pw-navy" />
                </Link>
              );
            }

            const text = (
              <div className={onLeft ? 'text-left' : 'text-right'}>
                {isCurrent && (
                  <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-pw-red-ink">
                    {t('you_are_here')}
                  </p>
                )}
                {!isOath && (
                  <p className="text-base font-extrabold text-pw-navy leading-tight">{stop.name}</p>
                )}
                <p className="text-sm text-pw-muted leading-snug mt-0.5">{stop.short}</p>
              </div>
            );

            return (
              <React.Fragment key={stop.id}>
                <div
                  className="absolute z-10"
                  style={{ top: STOP_Y[i], left: `${x}%`, transform: 'translate(-50%, -50%)' }}
                >
                  {marker}
                </div>
                <div
                  className="absolute z-10"
                  style={
                    onLeft
                      ? {
                          top: STOP_Y[i],
                          left: `calc(${x}% + 44px)`,
                          right: 12,
                          transform: 'translateY(-50%)',
                        }
                      : {
                          top: STOP_Y[i],
                          right: `calc(${100 - x}% + 44px)`,
                          left: 12,
                          transform: 'translateY(-50%)',
                        }
                  }
                >
                  {text}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </section>
  );
}