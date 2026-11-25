import React, { useState, useEffect } from 'react';
import { lessonProgress as lessonProgressApi } from '@/api/lessons';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { ArrowRight, BookOpen, Check, ChevronDown, Video } from 'lucide-react';
import LessonDetail from '@/components/lessons/LessonDetail.jsx';
import StudyTop from '@/components/study/StudyTop';
import { Button as PwButton, Card } from '@/components/pathways/ui';
import usePracticeText from '@/components/practice/usePracticeText';
import { nextLesson } from '@/lib/lessonDeck';
import { topicStates } from '@/lib/studyView';
import { toast } from "sonner";

// The five official topics, in order.
const TOPICS = [
  'Principles of American Democracy',
  'System of Government',
  'Rights and Responsibilities',
  'U.S. History',
  'Geography and Symbols',
];

// Lessons (the Lessons tab of Study, Amio v2): on paper, the Study title and
// tabs, one line on what a lesson is, "Civics · n of m lessons done", the
// suggested lesson (nextLesson()) on a navy card with the gold Start, then
// the five official topics as cards: done (every lesson finished) = navy with
// a gold check, the suggested topic = sky, others white; each shows
// "n of m lessons" and a bar. Tapping a topic opens its lessons. Nothing is
// locked. An open lesson (LessonDetail) keeps the padded layout. Wording in
// practiceStrings.js (usePracticeText).
export default function Lessons() {
  const { t, rtl } = usePracticeText();
  const [open, setOpen] = useState(() => new Set());
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);
      let currentUser = null;
      try {
        currentUser = await auth.me();
        setUser(currentUser);
      } catch (e) {
        // Not logged in — lessons still load
      }
      
      const [lessonList, userProgress] = await Promise.all([
        content.lessons({ sort: 'order', limit: 100 }),
        currentUser?.email 
          ? lessonProgressApi.list({ limit: 1000 })
          : Promise.resolve([])
      ]);
      
      // content.lessons() returns a plain list (src/api/content.js).
      setLessons(Array.isArray(lessonList) ? lessonList : []);
      setProgress(userProgress);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProgress = async () => {
    if (!user?.email) return;
    const userProgress = await lessonProgressApi.list({ limit: 1000 });
    setProgress(userProgress);
  };

  const getLessonProgress = (lessonId) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  if (selectedLesson) {
    return (
      <div className="container mx-auto px-4 pt-6 max-w-5xl">
        <LessonDetail 
        lesson={selectedLesson} 
        lessons={lessons}
        onNavigateLesson={setSelectedLesson}
        onBack={() => {
          setSelectedLesson(null);
          refreshProgress();
        }}
        onComplete={() => {
          toast.success(t('lesson_saved'));
          refreshProgress();
        }}
      />
      </div>
    );
  }

  const shell = (body) => (
    <div dir={rtl ? 'rtl' : 'ltr'} className="min-h-full bg-paper text-navy">
      <div className="mx-auto max-w-lg px-4 pt-6 pb-8 flex flex-col gap-5">
        <StudyTop tab="lessons" />
        {body}
      </div>
    </div>
  );

  if (loading) {
    return shell(
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-base text-muted" dir="auto">{t('loading_lessons')}</p>
        </div>
      </div>
    );
  }

  const doneTotal = lessons.filter((l) => getLessonProgress(l.id)?.completed).length;
  const next = nextLesson(lessons, progress);
  const rows = topicStates(TOPICS, lessons, progress, next);
  const toggle = (name) => setOpen((prev) => {
    const copy = new Set(prev);
    if (copy.has(name)) copy.delete(name); else copy.add(name);
    return copy;
  });
  const LOOK = {
    done: { card: 'bg-navy text-white border-navy', sub: 'text-on-navy', bar: 'bg-navy-line', fill: 'bg-gold' },
    current: { card: 'bg-sky text-navy border-sky', sub: 'text-navy', bar: 'bg-white', fill: 'bg-navy' },
    later: { card: 'bg-white text-navy border-line', sub: 'text-muted', bar: 'bg-line-soft', fill: 'bg-denim' },
  };

  return shell(
    <>
      <p className="text-base text-muted" dir="auto">{t('lessons_intro')}</p>

      {next && (
        <section aria-labelledby="lesson-next" className="rounded-card bg-navy text-white p-5 flex flex-col gap-3">
          <p id="lesson-next" className="text-base font-semibold text-sky" dir="auto">{t('suggested_next')} · {t(`next_${next.reason}`)}</p>
          <p className="font-display text-[1.5rem] leading-tight" dir="auto">{next.lesson.title}</p>
          <PwButton variant="main" onNavy className="w-full" onClick={() => setSelectedLesson(next.lesson)}>
            {next.reason === 'start' ? t('start') : t('continue')} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
          </PwButton>
        </section>
      )}

      {lessons.length > 0 && (
        <h2 className="text-lg font-bold" dir="auto">{t('civics_done', { n: doneTotal, total: lessons.length })}</h2>
      )}

      <ul className="flex flex-col gap-2 list-none m-0 p-0">
        {rows.map((row, i) => {
          const look = LOOK[row.state] || LOOK.later;
          const isOpen = open.has(row.name);
          const listId = `topic-lessons-${i}`;
          const pct = row.lessons.length ? Math.round((row.doneCount / row.lessons.length) * 100) : 0;
          return (
            <li key={row.name}>
              <button
                type="button"
                onClick={() => toggle(row.name)}
                aria-expanded={isOpen}
                aria-controls={listId}
                className={`w-full rounded-card border-[2.5px] p-4 flex flex-col gap-3 text-start hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${look.card}`}
              >
                <span className="flex items-center gap-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[1.25rem] leading-tight" dir="auto">{row.name}</span>
                    <span className={`block text-base ${look.sub}`} dir="auto">
                      {t('topic_lessons', { n: row.doneCount, total: row.lessons.length })}
                      <span className="sr-only">{row.state === 'done' ? `, ${t('topic_done_sr')}` : row.state === 'current' ? `, ${t('topic_here_sr')}` : ''}</span>
                    </span>
                  </span>
                  {row.state === 'done' && (
                    <span className="w-8 h-8 shrink-0 rounded-full bg-gold grid place-items-center" aria-hidden="true">
                      <Check className="w-4 h-4 text-navy" strokeWidth={3} />
                    </span>
                  )}
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
                <span className={`block h-2 rounded-[4px] overflow-hidden ${look.bar}`} aria-hidden="true">
                  <span className={`block h-full ${look.fill}`} style={{ width: `${pct}%` }} />
                </span>
              </button>

              {isOpen && (
                <ul id={listId} className="mt-2 rounded-card bg-white border border-line divide-y divide-line list-none m-0 p-0">
                  {row.lessons.map((lesson) => {
                    const lessonProgress = getLessonProgress(lesson.id);
                    const isCompleted = !!lessonProgress?.completed;
                    const status = lessonProgress?.needs_review ? t('status_review') : isCompleted ? t('status_done') : lessonProgress ? t('status_progress') : t('status_new');
                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLesson(lesson)}
                          className="w-full flex items-center gap-3 px-4 py-3 min-h-[60px] text-start hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy"
                        >
                          <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center ${isCompleted ? 'bg-gold' : 'border-2 border-line'}`} aria-hidden="true">
                            {isCompleted && <Check className="w-3.5 h-3.5 text-navy" strokeWidth={3} />}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-base font-semibold leading-snug" dir="auto">{lesson.title}</span>
                            <span className="flex items-center gap-2 text-base text-muted" dir="auto">
                              {status}
                              {lesson.video_url && <Video className="w-4 h-4" aria-label={t('has_video')} />}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ul>

      {lessons.length === 0 && (
        <Card className="text-center py-12">
          <div className="space-y-4">
            <BookOpen className="w-16 h-16 text-line mx-auto" aria-hidden="true" />
            <div>
              <h2 className="font-display text-[1.375rem] mb-2" dir="auto">{t('no_lessons')}</h2>
              <p className="text-base text-muted" dir="auto">{t('no_lessons_body')}</p>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
