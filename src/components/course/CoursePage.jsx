import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/pathways/ui';
import { Amio } from '@/components/pathways/Amio';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { questionText } from '@/lib/course';
import { usesYourState } from '@/lib/journey';
import TopicList, { StopRow } from '@/components/course/TopicList';
import useReadinessData from '@/components/shell/useReadinessData';
import { STOP_LOOK, StopIcon, stopHref, stopLabel, useCourseText, useJourney } from '@/components/course/courseShared';

// The Course tab (/course, Amio v2 frame Course; the preview sheet is frame
// R31Preview). Four part tabs, kept inside Course and remembered on this
// device (`pathways_course_tab`, cleared by Delete my data; an old saved
// "reading" or "writing" opens the joined tab):
// - Civics: the topics (one per unit) with their lessons, "n of m
//   questions" (civics answers mastered), the suggested next lesson with
//   Continue, and every stop when a topic is opened.
// - Reading and writing (one tab, denim): each unit's Read and write stops.
//   A Read and write stop always starts at reading, so the two parts share a tab.
// - Speaking: each unit's Speak it! checkpoints and practice interview.
// Each tab ends with its "Free practice" run(s), then "Practice" (the
// Practice home, /study?tab=practice). Inactive tabs are the pale colour.
// Nothing is locked: every stop opens. The old winding road (JourneyPath)
// was removed in amio-v2/finishing. No stars or badges. Reads only.

export const COURSE_TAB_KEY = 'pathways_course_tab';
const PARTS = ['readwrite', 'civics', 'speaking'];
const OLD_TABS = { reading: 'readwrite', writing: 'readwrite' };
// Free practice runs for each tab: [mode, label key].
const PRACTICE_RUNS = {
  readwrite: [['reading', 'free_reading'], ['dictation', 'free_writing']],
  civics: [['civics', 'free_practice']],
  speaking: [['interview', 'free_practice']],
};
const PART_STOPS = { readwrite: ['readwrite'], speaking: ['speakit', 'practiceInterview'] };
// [open, not open]: the open tab is the full colour with a navy border; the
// others are the pale colour (faded), with navy text.
const PART_LOOK = {
  readwrite: ['bg-denim text-white border-navy', 'bg-denim-soft text-navy border-denim-soft'],
  civics: ['bg-sky text-navy border-navy', 'bg-sky-soft text-navy border-sky-soft'],
  speaking: ['bg-white text-navy border-navy', 'bg-paper text-muted border-line'],
};

export function courseTab(saved) {
  const v = OLD_TABS[saved] || saved;
  return PARTS.includes(v) ? v : 'civics';
}
function loadTab() {
  try { return courseTab(localStorage.getItem(COURSE_TAB_KEY)); } catch { return 'civics'; }
}
function saveTab(v) {
  try { localStorage.setItem(COURSE_TAB_KEY, v); } catch { /* storage blocked: this visit only */ }
}

/** Reading/Writing and Speaking: the part's stops, grouped by unit. */
function PartStops({ part, journey, t, onOpen }) {
  const groups = journey.course
    .map((u) => ({ unit: u, stops: journey.stops.filter((s) => s.unitId === u.id && PART_STOPS[part].includes(s.type)) }))
    .filter((g) => g.stops.length);
  if (!groups.length) return <p className="text-base text-muted">{t('nothing_yet')}</p>;
  return (
    <div className="flex flex-col gap-2">
      {groups.map(({ unit, stops }) => (
        <section key={unit.id} className="rounded-card bg-white border-[1.5px] border-line px-2 py-3" aria-labelledby={`part-${unit.id}`}>
          <h2 id={`part-${unit.id}`} dir="auto" className="px-2 text-lg font-bold text-navy break-words">{unit.title}</h2>
          <ul className="mt-1 list-none m-0 p-0 flex flex-col">
            {stops.map((stop) => <StopRow key={stop.id} stop={stop} unitIcon={unit.icon} t={t} onOpen={onOpen} section={unit.sections.find((x) => x.id === stop.sectionId)?.title} />)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function LessonPreview({ stop, unit, lessonNumber, t, onStart }) {
  const lesson = stop.lesson;
  const questions = lesson.questionIds.map(questionText).filter(Boolean);
  const current = stop.state === 'current';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-4">
        <span className={`grid place-items-center w-16 h-16 shrink-0 rounded-full ${current ? 'bg-gold text-navy' : STOP_LOOK.lesson}`}>
          <StopIcon type="lesson" unitIcon={unit.icon} className="w-7 h-7" />
        </span>
        <div className="min-w-0">
          <p className="text-small font-semibold text-muted">{t('unit_n', { n: unit.number })} · {t('lesson_n', { n: lessonNumber })}</p>
          <SheetTitle dir="auto" className="mt-1 text-title font-bold text-navy break-words">{lesson.title}</SheetTitle>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <span className="rounded-button bg-tint px-3 py-1.5 text-base font-semibold text-navy">{t('steps_5')}</span>
        <span className="rounded-button bg-tint px-3 py-1.5 text-base font-semibold text-navy">{questions.length === 1 ? t('question_1') : t('questions_n', { n: questions.length })}</span>
        {lesson.status === 'draft' && <span className="rounded-button border border-line px-3 py-1.5 text-base font-semibold text-muted">{t('draft')}</span>}
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

function StopNote({ stop, t, onClose, onGo }) {
  const href = stopHref(stop);
  const playable = stop.state !== 'soon' && href;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className={`grid place-items-center w-14 h-14 shrink-0 rounded-full ${stop.state === 'current' ? 'bg-gold text-navy' : STOP_LOOK[stop.type]}`}>
          <StopIcon type={stop.type} className="w-6 h-6" />
        </span>
        <SheetTitle className="text-title font-bold text-navy break-words">{stopLabel(stop, t)}</SheetTitle>
      </div>
      <SheetDescription className="text-base text-navy">
        {playable ? t(`${stop.type === 'practiceInterview' ? 'interview' : stop.type}_body`) : t('soon_body')}
      </SheetDescription>
      {playable
        ? <Button variant="main" className="w-full" onClick={() => onGo(href)}>{stop.state === 'done' ? t('stop_again') : t('stop_go')}</Button>
        : <Button variant="second" className="w-full" onClick={onClose}>{t('ok')}</Button>}
    </div>
  );
}

export default function CoursePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { t, rtl } = useCourseText();
  const journey = useJourney();
  const readiness = useReadinessData();
  const wantedUnit = params.get('unit');
  // ?unit= (from Unit complete, the unit guide or All units) opens that topic on Civics.
  const [tab, setTabState] = useState(() => (wantedUnit ? 'civics' : loadTab()));
  const [expanded, setExpanded] = useState(wantedUnit);
  const [open, setOpen] = useState(null);
  const setTab = (v) => { setTabState(v); saveTab(v); };

  const openUnit = useMemo(() => (open ? journey.course.find((u) => u.id === open.unitId) : null), [open, journey.course]);
  const lessonNumber = (unit, lessonId) => unit.sections.flatMap((s) => s.lessons).findIndex((l) => l.id === lessonId) + 1;
  const isLesson = open && openUnit && open.type === 'lesson';

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-6 pb-8 flex flex-col gap-5">
        <div role="tablist" aria-label={t('parts_label')} className="grid grid-cols-3 gap-1.5">
          {PARTS.map((p) => {
            const on = p === tab;
            return (
              <button
                key={p}
                type="button"
                role="tab"
                id={`tab-${p}`}
                aria-selected={on}
                aria-controls={`panel-${p}`}
                onClick={() => setTab(p)}
                className={`min-h-[3rem] rounded-button px-1 text-[0.875rem] font-bold leading-tight border-[2.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${PART_LOOK[p][on ? 0 : 1]}`}
              >
                {t(`part_${p}`)}
              </button>
            );
          })}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <h1 className="font-display text-[2.5rem] leading-none tracking-tight">{t(`part_${tab}`)}</h1>
            {tab === 'civics' && readiness && (
              <p className="text-base text-muted tabular-nums">{t('questions_of', { n: readiness.civicsMastered, total: readiness.civicsTotal })}</p>
            )}
          </div>
          {tab !== 'civics' && <p className="text-base text-muted">{tab === 'speaking' ? t('speaking_sub') : t('rw_sub')}</p>}

          {!journey.loading && (tab === 'civics'
            ? (
              <TopicList
                journey={journey}
                masteredIds={readiness?.masteredIds || null}
                t={t}
                expandedId={expanded}
                onToggle={(id) => setExpanded((cur) => (cur === id ? null : id))}
                onOpen={setOpen}
              />
            )
            : <PartStops part={tab} journey={journey} t={t} onOpen={setOpen} />)}

          <div className="flex flex-col items-start gap-1">
            {PRACTICE_RUNS[tab].map(([mode, label]) => (
              <Link
                key={mode}
                to={`/study?tab=practice&mode=${mode}`}
                className="min-h-tap inline-flex items-center gap-2 rounded-button px-1 text-base font-semibold text-denim underline underline-offset-4 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
              >
                <Dumbbell className="w-5 h-5" aria-hidden="true" />{t(label)}
              </Link>
            ))}
            {/* The Practice home: every practice run, the vocabulary games and
                the test settings (on Base44 the older lessons there still save). */}
            <Link
              to="/study?tab=practice"
              className="min-h-tap inline-flex items-center gap-2 rounded-button px-1 text-base font-semibold text-denim underline underline-offset-4 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
            >
              <ChevronRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />{t('practice_home')}
            </Link>
          </div>
        </div>
      </div>

      <Sheet open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <SheetContent side="bottom" className="rounded-t-sheet bg-white px-5 pt-6 pb-8 max-h-[85vh] overflow-y-auto" dir={rtl ? 'rtl' : 'ltr'}>
          {open && (isLesson
            ? <LessonPreview stop={open} unit={openUnit} lessonNumber={lessonNumber(openUnit, open.lessonId)} t={t} onStart={() => navigate(`/course/lesson/${open.lessonId}`)} />
            : <StopNote stop={open} t={t} onClose={() => setOpen(null)} onGo={(href) => navigate(href)} />)}
        </SheetContent>
      </Sheet>
    </div>
  );
}
