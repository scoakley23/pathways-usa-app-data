import React, { useEffect, useMemo, useState } from 'react';
import { CalendarDays, Eye, FileText, Landmark, Map as MapIcon, Mic, Package, Sailboat, ScrollText, UserRound, Vote, Flag } from 'lucide-react';
import { auth } from '@/api/auth';
import { courseProgress } from '@/api/course';
import { UNITS } from '@/lib/course';
import { canSeeDrafts, currentUnitId, journeyStops, totalStars, visibleCourse } from '@/lib/journey';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { COURSE_LINES } from '@/components/course/courseStrings';

// Shared pieces of the Course tab (Prompt 5): the wording (translated like
// every screen), the icons, and one hook that loads the learner and their
// progress and works out the journey.

export { COURSE_LINES };

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
