import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, UserRound } from 'lucide-react';
import { lessonCounts, questionCount, sectionState } from '@/lib/journey';
import { STOP_LOOK, StopIcon, stopLabel, useCourseText, useJourney } from '@/components/course/courseShared';

// The unit guide (/course/unit/:unitId, frame R33UnitGuide): one row per
// section (done / current / open; nothing is locked) that opens to list its
// stops, then the unit practice interview at the end, always open. The
// current section and stop are marked gold (red is Amio only). No badges or
// stars. Reads only. Amio v2 (amio-v2/leftovers): a paper top, no navy banner;
// a finished section is navy with a gold check.

function SectionRow({ section, number, unit, stops, state, progress, t, startOpen }) {
  const [open, setOpen] = useState(startOpen);
  const counts = lessonCounts(section, progress);
  const mine = stops.filter((s) => s.sectionId === section.id && s.type !== 'practiceInterview');
  const badge = state === 'done'
    ? <span className="grid place-items-center w-11 h-11 rounded-card bg-navy text-gold"><Check className="w-6 h-6" strokeWidth={3} aria-hidden="true" /></span>
    : <span className={`grid place-items-center w-11 h-11 rounded-card text-lg font-bold ${state === 'current' ? 'bg-gold text-navy' : 'bg-line-soft text-navy'}`}>{number}</span>;
  const sub = state === 'empty'
    ? t('being_reviewed')
    : t('of', { n: counts.done, total: counts.total });
  const panel = `sec-${section.id}`;
  return (
    <div className={`rounded-card bg-white border-[2.5px] ${state === 'current' ? 'border-gold' : 'border-line'}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panel}
        className="w-full min-h-[64px] flex items-center gap-4 px-4 py-3 text-start rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
      >
        {badge}
        <span className="flex-1 min-w-0">
          <span dir="auto" className="block text-lg font-bold text-navy break-words">{section.title}</span>
          <span dir="auto" className="block text-base text-muted">{sub}</span>
        </span>
        <ChevronDown className={`w-5 h-5 text-muted transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && mine.length > 0 && (
        <ol id={panel} className="list-none m-0 mx-4 mb-4 pt-3 border-t border-line flex flex-col gap-2">
          {mine.map((s) => {
            const look = s.state === 'done' ? 'bg-navy text-gold' : s.state === 'current' ? 'bg-gold text-navy' : s.state === 'soon' ? `${STOP_LOOK[s.type]} opacity-70` : STOP_LOOK[s.type];
            return (
              <li key={s.id} className="flex items-center gap-3 min-h-[44px]">
                <span className={`grid place-items-center w-9 h-9 shrink-0 rounded-full ${look}`}>
                  {s.state === 'done' ? <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /> : <StopIcon type={s.type} unitIcon={unit.icon} className="w-4 h-4" />}
                </span>
                <span dir="auto" className={`text-base break-words ${s.state === 'current' ? 'font-bold text-navy' : 'text-navy'}`}>
                  {stopLabel(s, t)}
                  {s.state === 'soon' && <span className="text-small text-muted"> · {t('coming_soon')}</span>}
                  {s.lesson?.status === 'draft' && <span className="text-small text-muted"> · {t('draft')}</span>}
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

export default function UnitGuidePage() {
  const { unitId } = useParams();
  const { t, rtl } = useCourseText();
  const journey = useJourney();
  const unit = journey.course.find((u) => u.id === unitId) || journey.course[0];
  const lessons = unit.sections.flatMap((s) => s.lessons).length;
  const interview = journey.stops.find((s) => s.unitId === unit.id && s.type === 'practiceInterview');
  const subtitle = [t('sections_n', { n: unit.sections.length }), t('lessons_n', { n: lessons }), t('questions_n', { n: questionCount(unit) })].join(' · ');

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-4 flex items-start gap-2">
        <Link to={`/course?unit=${unit.id}`} aria-label={t('back')} className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
          <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
        </Link>
        <div className="min-w-0 pt-1">
          <h1 className="font-display text-[1.75rem] leading-tight" dir="auto"><>{t('unit_n', { n: unit.number })} · {unit.title}</></h1>
          <p className="text-base text-muted" dir="auto">{subtitle}</p>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-3">
        {!journey.loading && unit.sections.map((s, i) => {
          const state = sectionState(s, journey.stops);
          return (
            <SectionRow key={s.id} section={s} number={i + 1} unit={unit} stops={journey.stops} state={state} progress={journey.progress} t={t} startOpen={state === 'current'} />
          );
        })}
        {(() => {
          const ready = interview && (interview.state === 'open' || interview.state === 'done');
          const inner = (
            <>
              <span className="grid place-items-center w-11 h-11 shrink-0 rounded-card bg-navy-2 text-gold"><UserRound className="w-6 h-6" aria-hidden="true" /></span>
              <span className="min-w-0">
                <span className="block text-lg font-bold">{t('practice_interview')}</span>
                <span className="block text-base text-on-navy">{ready ? t('interview_open') : t('interview_locked')}</span>
              </span>
            </>
          );
          return ready
            ? <Link to={`/course/unit/${unit.id}/interview`} className="flex items-center gap-4 rounded-card bg-navy px-4 py-4 text-white hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">{inner}</Link>
            : <div className="flex items-center gap-4 rounded-card bg-navy px-4 py-4 text-white">{inner}</div>;
        })()}
      </div>
    </div>
  );
}
