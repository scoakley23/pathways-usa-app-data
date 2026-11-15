import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Map as MapIcon, Dumbbell } from 'lucide-react';
import StarsPill from '@/components/pathways/StarsPill';
import { Button } from '@/components/pathways/ui';
import { Amio } from '@/components/pathways/Amio';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { questionText } from '@/lib/course';
import { lessonCounts, usesYourState } from '@/lib/journey';
import JourneyPath from '@/components/course/JourneyPath';
import { STOP_LOOK, StopIcon, UnitIcon, stopLabel, useCourseText, useJourney } from '@/components/course/courseShared';

// The Course tab (/course, frames R32Path and R31Preview): the navy banner
// ("All units", stars, the unit card that opens the unit guide), the
// winding road of one unit, and a bottom sheet for the stop you tap: a
// lesson's preview with Start, or why a stop isn't open yet. Reads only.

function UnitCard({ unit, counts, t }) {
  const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
  return (
    <Link
      to={`/course/unit/${unit.id}`}
      className="flex items-center gap-4 rounded-card bg-denim px-4 py-4 text-white hover:bg-denim-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
    >
      <span className="grid place-items-center w-12 h-12 shrink-0 rounded-2xl bg-white text-denim">
        <UnitIcon name={unit.icon} className="w-6 h-6" />
      </span>
      <span className="flex-1 min-w-0">
        <span dir="auto" className="block text-lg font-bold leading-tight break-words">{t('unit_n', { n: unit.number })} · {unit.title}</span>
        <span className="mt-2 flex items-center gap-3">
          <span className="flex-1 h-2 rounded-full bg-white/25 overflow-hidden" aria-hidden="true">
            <span className="block h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </span>
          <span dir="auto" className="text-small text-on-navy tabular-nums whitespace-nowrap">{t('of', { n: counts.done, total: counts.total })}</span>
        </span>
      </span>
    </Link>
  );
}

function LessonPreview({ stop, unit, lessonNumber, t, onStart }) {
  const lesson = stop.lesson;
  const questions = lesson.questionIds.map(questionText).filter(Boolean);
  const current = stop.state === 'current';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <span className={`grid place-items-center w-16 h-16 shrink-0 rounded-full ${current ? 'bg-red text-navy' : STOP_LOOK.lesson}`}>
          <StopIcon type="lesson" unitIcon={unit.icon} className="w-7 h-7" />
        </span>
        <div className="min-w-0">
          <p className="text-small font-semibold uppercase tracking-wide text-muted">{t('unit_n', { n: unit.number })} · {t('lesson_n', { n: lessonNumber })}</p>
          <SheetTitle dir="auto" className="mt-1 text-title font-bold text-navy break-words">{lesson.title}</SheetTitle>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full bg-tint px-3 py-1.5 text-base font-semibold text-navy">{t('steps_5')}</span>
        <span className="rounded-full bg-tint px-3 py-1.5 text-base font-semibold text-navy">{questions.length === 1 ? t('question_1') : t('questions_n', { n: questions.length })}</span>
        {lesson.status === 'draft' && <span className="rounded-full border border-line px-3 py-1.5 text-base font-semibold text-muted">{t('draft')}</span>}
      </div>
      <div>
        <SheetDescription className="text-base font-bold text-navy">{t('answer_these')}</SheetDescription>
        {/* Official wording, in English, never translated. */}
        <ul className="mt-2 flex flex-col gap-2 list-disc ps-5 text-base text-navy" lang="en" dir="ltr">
          {questions.map((q) => <li key={q}>{q}</li>)}
        </ul>
      </div>
      {usesYourState(questions) && (
        <div className="flex items-center gap-3 rounded-card bg-tint px-4 py-3">
          <Amio mood="happy" size={40} />
          <p className="text-base text-navy">{t('your_state')}</p>
        </div>
      )}
      <Button variant="main" className="w-full" onClick={onStart}>
        {stop.state === 'done' ? t('start_again') : t('start')}
      </Button>
    </div>
  );
}

function StopNote({ stop, t, onClose }) {
  const locked = stop.state === 'locked';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className={`grid place-items-center w-14 h-14 shrink-0 rounded-full ${locked ? 'bg-tint text-muted' : STOP_LOOK[stop.type]}`}>
          {locked ? <Lock className="w-6 h-6" aria-hidden="true" /> : <StopIcon type={stop.type} className="w-6 h-6" />}
        </span>
        <SheetTitle className="text-title font-bold text-navy break-words">{stopLabel(stop, t)}</SheetTitle>
      </div>
      <SheetDescription className="text-base text-navy">
        {locked ? t('locked_body', { title: stop.waitFor ? stopLabel(stop.waitFor, t) : '' }) : t('soon_body')}
      </SheetDescription>
      <Button variant="second" className="w-full" onClick={onClose}>{t('ok')}</Button>
    </div>
  );
}

export default function CoursePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t, rtl } = useCourseText();
  const journey = useJourney();
  const [open, setOpen] = useState(null);

  const unit = useMemo(() => {
    const wanted = params.get('unit');
    return journey.course.find((u) => u.id === wanted) || journey.course.find((u) => u.id === journey.currentUnit) || journey.course[0];
  }, [journey, params]);

  const stops = useMemo(() => {
    const byId = Object.fromEntries(journey.stops.map((s) => [s.id, s]));
    return { ...unit, sections: unit.sections.map((s) => ({ ...s, stops: s.stops.map((st) => byId[st.id] || st) })) };
  }, [journey, unit]);

  const lessonNumber = (lessonId) => unit.sections.flatMap((s) => s.lessons).findIndex((l) => l.id === lessonId) + 1;
  const counts = lessonCounts(unit, journey.progress);
  const isLesson = open && open.type === 'lesson' && open.state !== 'locked';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-sky">
      <header className="bg-navy px-4 pt-5 pb-5 flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <Link to="/course/units" className="min-h-tap inline-flex items-center gap-2 rounded-full px-2 text-base font-semibold text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <MapIcon className="w-5 h-5" aria-hidden="true" />{t('all_units')}
            </Link>
            <Link to="/study?tab=practice" className="min-h-tap inline-flex items-center gap-2 rounded-full px-2 text-base font-semibold text-on-navy hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
              <Dumbbell className="w-5 h-5" aria-hidden="true" />{t('practice')}
            </Link>
          </div>
          <StarsPill count={journey.stars} label={t('stars_n', { n: journey.stars })} />
        </div>
        <h1 className="sr-only">{t('unit_n', { n: unit.number })} · {unit.title}</h1>
        <UnitCard unit={unit} counts={counts} t={t} />
      </header>

      {!journey.loading && <JourneyPath unit={stops} t={t} rtl={rtl} onStop={setOpen} />}

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-[28px] bg-white px-5 pt-6 pb-8 max-h-[85vh] overflow-y-auto" dir={rtl ? 'rtl' : 'ltr'}>
          {open && (isLesson
            ? <LessonPreview stop={open} unit={unit} lessonNumber={lessonNumber(open.lessonId)} t={t} onStart={() => navigate(`/course/lesson/${open.lessonId}`)} />
            : <StopNote stop={open} t={t} onClose={() => setOpen(null)} />)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
