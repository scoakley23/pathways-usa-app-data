import React from 'react';
import { Check, ChevronDown, ChevronRight } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { MAIN_PRESS } from '@/components/pathways/ui';
import { lessonCounts, unitQuestionsDone, unitState } from '@/lib/journey';
import { STOP_LOOK, StopIcon, stopLabel } from '@/components/course/courseShared';

// The Course tab's pieces (Amio v2, frame Course). Nothing is locked: every
// stop opens (the sheet with Start). The suggested next stop is gold; red is
// Amio only. No stars or badges.

/** One stop as a row: icon, name (and its section, when given), and "Done" / "Suggested next" / "Coming soon". */
export function StopRow({ stop, unitIcon, t, onOpen, section = null }) {
  const done = stop.state === 'done';
  const current = stop.state === 'current';
  const soon = stop.state === 'soon';
  const look = done ? 'bg-denim text-white' : current ? 'bg-gold text-navy' : `${STOP_LOOK[stop.type]}${soon ? ' opacity-70' : ''}`;
  const note = done ? t('done') : current ? t('suggested') : soon ? t('coming_soon') : null;
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(stop)}
        aria-current={current ? 'step' : undefined}
        className={`w-full min-h-[3.5rem] flex items-center gap-3 rounded-button px-3 py-2 text-start text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${current ? 'border-2 border-gold' : 'border-2 border-transparent'}`}
      >
        <span className={`grid place-items-center w-10 h-10 shrink-0 rounded-full ${look}`}>
          {done ? <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /> : <StopIcon type={stop.type} unitIcon={unitIcon} className="w-5 h-5" />}
        </span>
        <span className="flex-1 min-w-0">
          <span dir="auto" className={`block text-base break-words ${current ? 'font-bold' : 'font-semibold'}`}>{stopLabel(stop, t)}</span>
          {section && stop.type !== 'practiceInterview' && <span dir="auto" className="block text-small text-navy break-words">{section}</span>}
          {(note || stop.lesson?.status === 'draft') && (
            <span className="block text-small text-muted">{[note, stop.lesson?.status === 'draft' ? t('draft') : null].filter(Boolean).join(' · ')}</span>
          )}
        </span>
        <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
      </button>
    </li>
  );
}

/** The unit's lesson bar: one segment per lesson. */
function LessonBar({ lessons, progress, currentLessonId, tone }) {
  return (
    <span className="flex gap-1" aria-hidden="true">
      {lessons.map((l) => {
        const done = progress[l.id]?.completed || progress[l.id]?.completed_at;
        const current = l.id === currentLessonId;
        const look = tone === 'navy'
          ? (done ? 'bg-gold' : 'bg-navy-line')
          : tone === 'sky'
            ? (done ? 'bg-navy' : current ? 'bg-white border-2 border-navy' : 'bg-white/60')
            : (done ? 'bg-gold' : 'bg-line-soft');
        return <span key={l.id} className={`flex-1 h-2.5 rounded-sm ${look}`} />;
      })}
    </span>
  );
}

/** One topic (= one unit): its lessons, questions done, and every stop when opened. */
function TopicCard({ unit, journey, masteredIds, t, expanded, onToggle, onOpen }) {
  const state = unitState(unit, journey.stops, journey.currentUnit);
  const mine = journey.stops.filter((s) => s.unitId === unit.id);
  const lessons = unit.sections.flatMap((s) => s.lessons);
  const counts = lessonCounts(unit, journey.progress);
  const questions = masteredIds ? unitQuestionsDone(unit, masteredIds) : null;
  const current = state === 'current' ? mine.find((s) => s.state === 'current') : null;
  const tone = state === 'done' ? 'navy' : current ? 'sky' : 'white';
  const look = {
    navy: 'bg-navy text-white border-[2.5px] border-navy',
    sky: 'bg-sky text-navy border-[2.5px] border-navy',
    white: 'bg-white text-navy border-[1.5px] border-line',
  }[tone];
  const subText = tone === 'navy' ? 'text-on-navy' : 'text-muted';
  const panel = `topic-${unit.id}`;
  const currentLine = current && (current.type === 'lesson'
    ? t('lesson_of_title', { n: lessons.findIndex((l) => l.id === current.lessonId) + 1, total: lessons.length, title: current.title })
    : stopLabel(current, t));

  return (
    <section className={`rounded-card px-4 py-4 flex flex-col gap-3 ${look}`} aria-labelledby={`${panel}-title`}>
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 id={`${panel}-title`} dir="auto" className="text-[1.375rem] font-bold leading-tight break-words">{unit.title}</h2>
          {currentLine && <p dir="auto" className="mt-1 text-base break-words">{currentLine}</p>}
          {questions && questions.total > 0 && <p className={`mt-1 text-small ${tone === 'sky' ? 'text-navy' : subText}`}>{t('questions_of', { n: questions.done, total: questions.total })}</p>}
          {state === 'empty' && <p className={`mt-1 text-small ${subText}`}>{t('being_reviewed')}</p>}
        </div>
        {tone === 'navy'
          ? <Check className="w-7 h-7 shrink-0 text-gold" strokeWidth={3} aria-label={t('done')} />
          : current
            ? <Amio mood="hello" size={44} />
            : <span className={`shrink-0 text-base ${subText}`}>{t('lessons_n', { n: counts.total })}</span>}
      </div>
      {lessons.length > 0 && <LessonBar lessons={lessons} progress={journey.progress} currentLessonId={current?.lessonId} tone={tone} />}
      {current && (
        <button
          type="button"
          onClick={() => onOpen(current)}
          className={`w-full min-h-main mb-[5px] rounded-button bg-navy px-6 text-lg font-extrabold text-white ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 focus-visible:ring-offset-sky`}
        >
          {t('continue')}
        </button>
      )}
      {mine.length > 0 && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={panel}
          className={`self-start min-h-tap inline-flex items-center gap-1.5 rounded-button px-1 text-base font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 ${tone === 'navy' ? 'text-white focus-visible:ring-white' : 'text-navy focus-visible:ring-denim'}`}
        >
          {expanded ? t('hide_all') : t('see_all')}
          <ChevronDown className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
      )}
      {expanded && (
        <div id={panel} className="rounded-button bg-white text-navy p-2 flex flex-col gap-2">
          {unit.sections.map((s) => {
            const rows = mine.filter((x) => x.sectionId === s.id);
            if (!rows.length) return null;
            return (
              <div key={s.id}>
                <p dir="auto" className="px-2 pt-1 text-small font-semibold text-muted">{s.title}</p>
                <ul className="list-none m-0 p-0 flex flex-col">
                  {rows.map((stop) => <StopRow key={stop.id} stop={stop} unitIcon={unit.icon} t={t} onOpen={onOpen} />)}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default function TopicList({ journey, masteredIds, t, expandedId, onToggle, onOpen }) {
  return (
    <div className="flex flex-col gap-2">
      {journey.course.map((u) => (
        <TopicCard
          key={u.id}
          unit={u}
          journey={journey}
          masteredIds={masteredIds}
          t={t}
          expanded={expandedId === u.id}
          onToggle={() => onToggle(u.id)}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
