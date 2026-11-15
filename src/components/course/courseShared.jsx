import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eye, FileText, Landmark, Map as MapIcon, Mic, Package, Sailboat, ScrollText, UserRound, Vote, Flag } from 'lucide-react';
import { auth } from '@/api/auth';
import { courseProgress } from '@/api/course';
import { UNITS } from '@/lib/course';
import { canSeeDrafts, currentUnitId, journeyStops, totalStars, visibleCourse } from '@/lib/journey';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

// Shared pieces of the Course tab (Prompt 5): the wording (translated like
// every screen), the icons, and one hook that loads the learner and their
// progress and works out the journey.

export const COURSE_LINES = {
  all_units: 'All units',
  unit_n: 'Unit {n}',
  of: '{n} of {total}',
  section_n: 'Section {n}: {title}',
  stops_n: '{n} stops',
  next: 'Next!',
  draft: 'Draft',
  coming_soon: 'Coming soon',
  being_reviewed: 'These lessons are being reviewed. They will appear here soon.',
  locked_title: 'Not open yet',
  locked_body: 'Finish “{title}” first. Stops open one at a time, in order.',
  soon_body: 'This stop opens in a later update. You can go on to the next stop.',
  ok: 'OK',
  guide: 'Guide',
  practice: 'Practice',
  lesson_n: 'Lesson {n}',
  steps_5: '5 steps',
  questions_n: '{n} test questions',
  question_1: '1 test question',
  answer_these: 'You’ll be able to answer:',
  your_state: 'I’ll use the state you picked in Who Represents Me.',
  start: 'Start lesson · +3 stars',
  start_again: 'Practice this lesson again',
  sections_n: '{n} sections',
  lessons_n: '{n} lessons',
  badge_earned: 'badge earned',
  speak_checkpoint: 'Speak it! checkpoint',
  practice_interview: 'Unit practice interview',
  interview_locked: 'Unlocks when you finish the unit',
  journey_title: 'Your journey to Oath Day',
  journey_sub: '{units} units · {lessons} lessons · {interviews} practice interviews',
  oath_day: 'Oath Day',
  oath_sub: 'The ceremony · you made it',
  back: 'Back',
  lesson_soon_title: 'Lessons open in the next update',
  lesson_soon_body: 'The 5-step lesson player is on its way. Your place on the road is saved.',
  back_to_road: 'Back to the road',
  stars_n: '{n} stars',
  done: 'Done',
  you_are_here: 'You are here',
};

export function useCourseText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(COURSE_LINES, language, { cacheKey: 'course_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || COURSE_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}

// Unit icons (units.json `icon`), lucide outlines at a 2px stroke.
const UNIT_ICONS = { constitution: ScrollText, capitol: Landmark, ballot: Vote, colonies: ScrollText, union: Sailboat, modern: MapIcon, holidays: CalendarDays };
export function UnitIcon({ name, className = 'w-6 h-6' }) {
  const Icon = UNIT_ICONS[name] || Landmark;
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}

// Stop icons: lessons use their unit's icon.
const STOP_ICONS = { readwrite: Eye, speakit: Mic, n400: FileText, review: Package, practiceInterview: UserRound };
export function StopIcon({ type, unitIcon, className = 'w-6 h-6' }) {
  if (type === 'lesson') return <UnitIcon name={unitIcon} className={className} />;
  const Icon = STOP_ICONS[type] || Eye;
  return <Icon className={className} strokeWidth={2} aria-hidden="true" />;
}
export { Flag as OathIcon };

// Fill and icon color of a stop by type (style guide "stop types on the road").
export const STOP_LOOK = {
  lesson: 'bg-stop-lesson text-white',
  readwrite: 'bg-stop-read-write text-white',
  speakit: 'bg-stop-speak text-navy',
  n400: 'bg-stop-n400 text-white',
  review: 'bg-stop-chest text-navy border-2 border-stop-chest-border',
  practiceInterview: 'bg-stop-interview text-gold',
};

export function stopLabel(stop, t) {
  if (stop.type === 'speakit') return t('speak_checkpoint');
  if (stop.type === 'practiceInterview') return t('practice_interview');
  return stop.title;
}

// Loads the learner and their course progress once, and works out the journey.
export function useJourney() {
  const [state, setState] = useState({ loading: true, user: null, progress: {}, checkpoints: new Set() });

  useEffect(() => {
    let active = true;
    (async () => {
      let user = null;
      try { user = await auth.me(); } catch (e) { user = null; }
      const ids = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).map((l) => l.id)));
      let saved = { lessons: {}, checkpoints: new Set() };
      if (user) {
        try { saved = await courseProgress.load(ids); } catch (e) { saved = { lessons: {}, checkpoints: new Set() }; }
      }
      if (active) setState({ loading: false, user, progress: saved.lessons, checkpoints: saved.checkpoints });
    })();
    return () => { active = false; };
  }, []);

  return useMemo(() => {
    const showDrafts = canSeeDrafts(state.user);
    const course = visibleCourse(UNITS, { showDrafts });
    const stops = journeyStops(course, { progress: state.progress, checkpoints: state.checkpoints });
    return {
      ...state,
      showDrafts,
      course,
      stops,
      stars: totalStars(state.progress),
      currentUnit: currentUnitId(course, stops),
    };
  }, [state]);
}
