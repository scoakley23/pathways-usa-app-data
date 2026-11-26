import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Clock, Circle, BookOpen } from 'lucide-react';
import { Card } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { LESSON_STATUS_LINES } from '@/components/shell/leftoverStrings';
import { useJourney } from '@/components/course/courseShared';
import { coursePlay } from '@/api/coursePlay';
import { lessonStatusRows } from '@/lib/lessonStatus';

// Lesson progress (/Dashboard, opened from Progress's "Mastered" card): a
// paper page with Back and the title, three counts (finished, started, not
// started) and one card per Course lesson under its unit: finished = a navy
// border with a check, started = a clock, not started = an empty circle,
// always with words. Each card opens the lesson player. Reads the Course
// progress (courseProgress.load() via useJourney(); Supabase only, so on
// Base44 everything reads "Not started" with the practice-only note). No
// stars. Wording in LESSON_STATUS_LINES (pack set "lesson-status").
const ICONS = {
  completed: { Icon: CheckCircle, icon: 'text-correct' },
  in_progress: { Icon: Clock, icon: 'text-navy' },
  not_started: { Icon: Circle, icon: 'text-muted' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LESSON_STATUS_LINES, language, { cacheKey: 'lesson_status_v2' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || LESSON_STATUS_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const rtl = RTL_LANGUAGES.includes(language);
  const journey = useJourney();

  if (journey.loading) {
    return (
      <div className="flex items-center justify-center min-h-[25rem]">
        <Loader2 className="w-8 h-8 animate-spin text-navy" aria-hidden="true" />
      </div>
    );
  }

  const { units, counts } = lessonStatusRows(journey.course, journey.progress);

  return (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="mx-auto max-w-lg px-4 pt-4 pb-8 flex flex-col gap-5">
        <div className="flex items-start gap-2">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/Progress'))}
            aria-label={t('back')}
            className="w-11 h-11 shrink-0 -ms-2 grid place-items-center rounded-full text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
          <div className="min-w-0 pt-1">
            <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('title')}</h1>
            <p className="text-base text-muted" dir="auto">{t('subtitle')}</p>
          </div>
        </div>

        <ul className="grid grid-cols-3 gap-2 list-none m-0 p-0">
          {Object.entries(ICONS).map(([key, { Icon, icon }]) => (
            <li key={key}>
              <Card padding="p-3" className="h-full">
                <Icon className={`w-5 h-5 ${icon}`} aria-hidden="true" />
                <p className="mt-2 font-display text-[2rem] leading-none tabular-nums">{counts[key]}</p>
                <p className="mt-1 text-small font-semibold text-muted" dir="auto">{t(key)}</p>
              </Card>
            </li>
          ))}
        </ul>

        {!coursePlay.saves && <p className="text-small text-muted" dir="auto">{t('practice_note')}</p>}

        {units.length > 0 ? units.map((unit) => (
          <section key={unit.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold" dir="auto">{t('unit_title', { n: unit.number, title: unit.title })}</h2>
            <ul className="flex flex-col gap-2 list-none m-0 p-0">
              {unit.lessons.map((lesson) => {
                const { Icon, icon } = ICONS[lesson.status];
                return (
                  <li key={lesson.id}>
                    <Link
                      to={`/course/lesson/${lesson.id}`}
                      className={`flex items-center gap-3 rounded-card bg-white border-[1.5px] px-4 py-3 min-h-[3.75rem] hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${lesson.status === 'completed' ? 'border-navy' : 'border-line'}`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${icon}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold leading-snug" dir="auto">{lesson.title}</span>
                        <span className="block text-small text-muted" dir="auto">{t(lesson.status)}</span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )) : (
          <Card padding="p-6" className="flex flex-col items-center gap-2 text-center">
            <BookOpen className="w-7 h-7 text-muted" aria-hidden="true" />
            <p className="text-base text-muted" dir="auto">{t('none')}</p>
          </Card>
        )}
      </div>
    </div>
  );
}
