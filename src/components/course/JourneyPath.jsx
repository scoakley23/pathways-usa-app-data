import React from 'react';
import { Check, Lock } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { StarIcon } from '@/components/pathways/StarsPill';
import { stopX } from '@/lib/journey';
import { STOP_LOOK, StopIcon, stopLabel } from '@/components/course/courseShared';

// The winding road of one unit (frame R32Path): a sky-and-grass scene, a
// divider per section ("Section 2: Congress · 7 stops"), and the stops along
// the road. Done stops show a check (lessons also show stars), the current
// stop is red with a ring and Amio beside it ("Next!"), locked stops are
// gray. Left and right mirror for right-to-left languages. Everything is
// inline SVG or CSS; no image files.

const DIVIDER_H = 100;
const STOP_H = 136;
const CIRCLE = 64;

function layout(unit, rtl) {
  const rows = [];
  let y = 8;
  let i = 0;
  unit.sections.forEach((s, si) => {
    rows.push({ kind: 'divider', section: s, number: si + 1, y });
    y += DIVIDER_H;
    if (!s.stops.length) {
      rows.push({ kind: 'empty', section: s, y });
      y += 96;
      return;
    }
    for (const stop of s.stops) {
      rows.push({ kind: 'stop', stop, x: stopX(i, rtl), y: y + CIRCLE / 2 });
      y += STOP_H;
      i += 1;
    }
  });
  return { rows, height: y + 40 };
}

function Stars({ n }) {
  return (
    <span className="flex justify-center gap-0.5" aria-hidden="true">
      {[0, 1, 2].map((k) => <StarIcon key={k} className={`w-4 h-4 ${k < n ? 'text-gold' : 'text-mid'}`} />)}
    </span>
  );
}

function Tree({ style }) {
  return (
    <svg viewBox="0 0 24 36" className="absolute w-6 h-9" style={style} aria-hidden="true" focusable="false">
      <rect x="10.5" y="20" width="3" height="14" rx="1.5" className="fill-[theme(colors.not-yet)]" opacity="0.55" />
      <circle cx="12" cy="13" r="11" className="fill-tree" />
      <circle cx="8" cy="9" r="3" className="fill-white" opacity="0.25" />
    </svg>
  );
}

function Cloud({ style }) {
  return (
    <svg viewBox="0 0 60 24" className="absolute w-16 h-6" style={style} aria-hidden="true" focusable="false">
      <path d="M10 22h40a8 8 0 0 0 0-16 12 12 0 0 0-22-2 9 9 0 0 0-18 4 7 7 0 0 0 0 14z" className="fill-white" />
    </svg>
  );
}

function stateWords(stop, t) {
  if (stop.state === 'done') return t('done');
  if (stop.state === 'current') return t('you_are_here');
  if (stop.state === 'soon') return t('coming_soon');
  if (stop.state === 'open') return t('ready_stop');
  return t('locked_title');
}

export default function JourneyPath({ unit, t, rtl, onStop }) {
  const { rows, height } = layout(unit, rtl);
  const stops = rows.filter((r) => r.kind === 'stop');
  const points = stops.map((r) => `${r.x},${r.y}`).join(' ');

  return (
    <div className="relative overflow-hidden bg-scene-sky" style={{ height }} dir="ltr">
      {/* The grass hill at the bottom and a few trees and clouds. */}
      <svg className="absolute inset-x-0 bottom-0 w-full h-72" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" focusable="false">
        <path d="M0 30 C30 10 60 5 100 18 L100 100 L0 100 Z" className="fill-grass" />
      </svg>
      <Cloud style={{ top: 18, insetInlineEnd: 12, right: 12 }} />
      <Cloud style={{ top: Math.max(220, height * 0.42), left: 8 }} />
      <Tree style={{ top: Math.max(260, height * 0.35), left: 14 }} />
      <Tree style={{ top: height - 220, right: 18 }} />
      <Tree style={{ top: height - 110, left: 22 }} />

      {/* The road behind the stops. */}
      {stops.length > 1 && (
        <svg className="absolute inset-0 w-full" style={{ height }} viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
          <polyline points={points} fill="none" className="stroke-mid" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      )}

      <ol className="absolute inset-0 list-none m-0 p-0" dir={rtl ? 'rtl' : 'ltr'}>
        {rows.map((r) => {
          if (r.kind === 'divider') {
            return (
              <li key={`d-${r.section.id}`} className="absolute inset-x-0 flex items-center gap-3 px-4" style={{ top: r.y + 12 }}>
                <span className="flex-1 h-0.5 bg-mid rounded-full" aria-hidden="true" />
                <h2 dir="auto" className="shrink min-w-0 max-w-[80%] rounded-button bg-white border border-line px-4 py-2 text-base font-semibold text-navy text-center">
                  {t('section_n', { n: r.number, title: r.section.title })}
                  {r.section.stops.length > 0 && <span className="font-normal text-muted"> · {t('stops_n', { n: r.section.stops.length })}</span>}
                </h2>
                <span className="flex-1 h-0.5 bg-mid rounded-full" aria-hidden="true" />
              </li>
            );
          }
          if (r.kind === 'empty') {
            return (
              <li key={`e-${r.section.id}`} className="absolute inset-x-4" style={{ top: r.y }}>
                <p className="rounded-card bg-white/90 border border-line px-4 py-3 text-base text-muted text-center">{t('being_reviewed')}</p>
              </li>
            );
          }
          const { stop, x, y } = r;
          const current = stop.state === 'current';
          const locked = stop.state === 'locked';
          const soon = stop.state === 'soon';
          const look = locked
            ? 'bg-white text-muted shadow-[0_5px_0_theme(colors.mid)]'
            : current
              ? 'bg-red text-navy ring-4 ring-red ring-offset-4 ring-offset-scene-sky shadow-[0_5px_0_theme(colors.red-text)]'
              : `${STOP_LOOK[stop.type]} shadow-lip ${soon ? 'opacity-70' : ''}`;
          const label = stopLabel(stop, t);
          const draft = stop.lesson?.status === 'draft';
          return (
            <li key={stop.id} className="absolute" style={{ top: y - CIRCLE / 2, left: `${x}%`, transform: 'translateX(-50%)' }}>
              <div className="flex flex-col items-center w-40">
                <button
                  type="button"
                  onClick={() => onStop(stop)}
                  aria-label={`${label}. ${stateWords(stop, t)}${draft ? `. ${t('draft')}` : ''}`}
                  className={`relative grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-denim ${look}`}
                  style={{ width: CIRCLE, height: CIRCLE }}
                >
                  {stop.state === 'done'
                    ? <Check className="w-7 h-7" strokeWidth={3} aria-hidden="true" />
                    : locked
                      ? <span className="relative"><StopIcon type={stop.type} unitIcon={unit.icon} className="w-6 h-6" /><Lock className="absolute -bottom-2 -end-3 w-3.5 h-3.5" aria-hidden="true" /></span>
                      : <StopIcon type={stop.type} unitIcon={unit.icon} className="w-7 h-7" />}
                </button>
                {(stop.type === 'lesson' || (stop.type === 'n400' && stop.lessonId)) && stop.state === 'done' && <span className="mt-1.5"><Stars n={stop.stars} /></span>}
                <span dir="auto" className={`mt-2 text-center text-base leading-tight ${current ? 'font-bold text-navy' : locked ? 'text-muted' : 'text-navy'}`}>{label}</span>
                {(soon || draft) && (
                  <span className="mt-0.5 text-small text-muted">{[soon ? t('coming_soon') : null, draft ? t('draft') : null].filter(Boolean).join(' · ')}</span>
                )}
              </div>
              {current && (
                <div
                  className="absolute pointer-events-none"
                  style={{ top: -6, [x >= 50 ? 'right' : 'left']: 'calc(50% + 46px)' }}
                  aria-hidden="true"
                >
                  {/* Amio beside the stop, never over a label: the bubble sits above Amio. */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="rounded-2xl border-2 border-red bg-white px-3 py-1 text-[0.9375rem] font-semibold leading-snug text-navy whitespace-nowrap">{t('next')}</p>
                    <Amio mood="cheer" size={44} />
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
