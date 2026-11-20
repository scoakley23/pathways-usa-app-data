import { useEffect, useMemo, useState } from 'react';
import { today as todayApi } from '@/api/today';
import { UNITS } from '@/lib/course';
import { useJourney } from '@/components/course/courseShared';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { TODAY_LINES } from '@/components/today/todayLines';
import { finishedToday, starsToday, todayLesson } from '@/lib/dailyPlan';
import { streak } from '@/lib/streak';
import { activeWeek } from '@/lib/todayView';

// Today's numbers (Prompt 7), shared by Today and Done for today: the
// journey (src/components/course/courseShared.jsx), lessons per day, lessons
// and stars finished today, review questions due, and the streak.

export function useTodayText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(TODAY_LINES, language, { cacheKey: 'today_v3' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || TODAY_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}

const QUESTION_IDS = new Set(UNITS.flatMap((u) => u.sections.flatMap((s) => (s.lessons || []).flatMap((l) => l.questionIds))));

export default function useToday({ withStreak = false } = {}) {
  const journey = useJourney();
  const [extra, setExtra] = useState({ due: 0, days: [], loaded: false });

  useEffect(() => {
    if (journey.loading || !journey.user) return undefined;
    let active = true;
    Promise.all([
      todayApi.dueCount({ knownIds: QUESTION_IDS }),
      withStreak ? todayApi.activeDays() : Promise.resolve([]),
    ]).then(([due, days]) => { if (active) setExtra({ due, days, loaded: true }); });
    return () => { active = false; };
  }, [journey.loading, journey.user, withStreak]);

  return useMemo(() => {
    const now = new Date();
    const goal = journey.user ? todayApi.lessonsPerDay(journey.user) : 0;
    const doneIds = finishedToday(journey.progress, now);
    return {
      ...journey,
      goal,
      doneToday: doneIds.length,
      starsToday: starsToday(journey.progress, now),
      lesson: todayLesson(journey.course, journey.stops),
      due: extra.due,
      streak: streak(extra.days, now),
      week: withStreak ? activeWeek(extra.days, now) : null,
      extraLoaded: extra.loaded,
    };
  }, [journey, extra]);
}
