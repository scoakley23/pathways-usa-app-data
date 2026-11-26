import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle, Clock, Circle, BookOpen } from 'lucide-react';
import { lessonProgress as lessonProgressApi } from '@/api/lessons';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { LESSON_STATUS_LINES } from '@/components/shell/leftoverStrings';

// Lesson progress (/Dashboard, opened from Progress's "Mastered" card; Amio
// v2 in amio-v2/leftovers): a paper page with Back and the title, three
// counts (finished, started, not started) and one card per lesson under its
// official topic: finished = a navy border with a check and the best score,
// started = a clock, not started = an empty circle, always with words.
// Reads only. Wording in LESSON_STATUS_LINES (pack set "lesson-status").
const TOPIC_ORDER = [
  'Principles of American Democracy',
  'System of Government',
  'Rights and Responsibilities',
  'U.S. History',
  'Geography and Symbols',
];

export default function Dashboard({ cachedUser }) {
  const navigate = useNavigate();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LESSON_STATUS_LINES, language, { cacheKey: 'lesson_status_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || LESSON_STATUS_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  const rtl = RTL_LANGUAGES.includes(language);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = cachedUser || (await auth.me().catch(() => null));
        if (!currentUser) return;
        const [allLessons, progressList] = await Promise.all([content.lessons(), lessonProgressApi.list()]);
        setLessons(allLessons.sort((a, b) => (a.order || 0) - (b.order || 0)));
        setLessonProgress(progressList);
      } catch (err) {
        console.error('Lesson progress load error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [cachedUser]);

  const isDone = (p) => p?.completed && p?.quiz_attempts > 0;
  const completedLessons = lessonProgress.filter(isDone).length;
  const inProgressLessons = lessonProgress.filter((p) => !isDone(p)).length;
  const notStartedLessons = Math.max(0, lessons.length - completedLessons - inProgressLessons);
  const progressMap = Object.fromEntries(lessonProgress.map((p) => [p.lesson_id, p]));
  const lessonsByTopic = TOPIC_ORDER.map((topic) => ({ topic, lessons: lessons.filter((l) => l.topic === topic) }))
    .filter((g) => g.lessons.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-navy" aria-hidden="true" />
      </div>
    );
  }

  const counts = [
    { key: 'completed', n: completedLessons, Icon: CheckCircle, icon: 'text-correct' },
    { key: 'in_progress', n: inProgressLessons, Icon: Clock, icon: 'text-navy' },
    { key: 'not_started', n: notStartedLessons, Icon: Circle, icon: 'text-muted' },
  ];

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
          {counts.map(({ key, n, Icon, icon }) => (
            <li key={key}>
              <Card padding="p-3" className="h-full">
                <Icon className={`w-5 h-5 ${icon}`} aria-hidden="true" />
                <p className="mt-2 font-display text-[2rem] leading-none tabular-nums">{n}</p>
                <p className="mt-1 text-small font-semibold text-muted" dir="auto">{t(key)}</p>
              </Card>
            </li>
          ))}
        </ul>

        {lessonsByTopic.length > 0 ? lessonsByTopic.map(({ topic, lessons: topicLessons }) => (
          <section key={topic} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold" lang="en" dir="ltr">{topic}</h2>
            <ul className="flex flex-col gap-2 list-none m-0 p-0">
              {topicLessons.map((lesson) => {
                const p = progressMap[lesson.id];
                const status = isDone(p) ? 'completed' : p ? 'in_progress' : 'not_started';
                const { Icon, icon } = counts.find((c) => c.key === status);
                const best = Math.round(p?.best_score || 0);
                return (
                  <li key={lesson.id}>
                    <Link
                      to={createPageUrl('Lessons')}
                      className={`flex items-center gap-3 rounded-card bg-white border-[1.5px] px-4 py-3 min-h-[60px] hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${status === 'completed' ? 'border-navy' : 'border-line'}`}
                    >
                      <Icon className={`w-5 h-5 shrink-0 ${icon}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className="block text-base font-semibold leading-snug" dir="auto">{lesson.title}</span>
                        <span className="block text-small text-muted" dir="auto">
                          {t(status)}{status === 'completed' && best > 0 ? ` · ${t('best', { n: best })}` : ''}
                        </span>
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
