import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { auth } from '@/api/auth';
import { ArrowRight, BookOpen, Check, ChevronDown, Star, Video } from 'lucide-react';
import LessonDetail from '@/components/lessons/LessonDetail.jsx';
import StudyTop from '@/components/study/StudyTop';
import { Card, CreamSheet, Eyebrow, NavyTop } from '@/components/pathways/ui';
import { nextLesson } from '@/lib/lessonDeck';
import { topicStates } from '@/lib/studyView';
import { toast } from "sonner";

const NEXT_LABEL = {
  review: 'Worth going over again',
  continue: 'Pick up where you left off',
  start: 'Next lesson',
};

// The five official topics, in order.
const TOPICS = [
  'Principles of American Democracy',
  'System of Government',
  'Rights and Responsibilities',
  'U.S. History',
  'Geography and Symbols',
];

// Lessons (the Lessons tab of Study): on navy, the Study top; on the cream
// sheet, "Civics · n of m lessons done" and the topics as a vertical road.
// Done topics (every lesson finished) are sky circles with a check; the
// current topic (the one with nextLesson()) is a star-red circle with a star
// and a "You're here" card for that lesson; later topics are hollow. Tapping a
// topic opens its lessons. An open lesson (LessonDetail) keeps the padded
// layout.
export default function Lessons() {
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
      
      const [lessonPage, userProgress] = await Promise.all([
        base44.entities.Lesson.filter({}, { sort: 'order', limit: 100 }),
        currentUser?.email 
          ? base44.entities.LessonProgress.filter({ user_email: currentUser.email }, null, 1000)
          : Promise.resolve([])
      ]);
      
      setLessons(lessonPage.items);
      setProgress(userProgress);
    } catch (error) {
      console.error('Failed to load:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshProgress = async () => {
    if (!user?.email) return;
    const userProgress = await base44.entities.LessonProgress.filter(
      { user_email: user.email }, null, 1000
    );
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
          toast.success('Saved. Lesson complete.');
          refreshProgress();
        }}
      />
      </div>
    );
  }

  const top = (
    <NavyTop className="pb-12">
      <StudyTop tab="lessons" />
    </NavyTop>
  );

  if (loading) {
    return (
      <div>
        {top}
        <CreamSheet>
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-navy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-base text-ink-2">Loading lessons...</p>
            </div>
          </div>
        </CreamSheet>
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

  return (
    <div>
      {top}
      <CreamSheet>
        <div className="mx-auto max-w-3xl space-y-5 pb-8 text-ink">
          <p className="text-base text-ink-2">Each lesson ends with the exact questions the officer may ask. We go over them together.</p>
          {lessons.length > 0 && <Eyebrow>Civics · {doneTotal} of {lessons.length} lessons done</Eyebrow>}

          {/* The topics as a vertical road */}
          <ol className="space-y-0">
            {rows.map((row, i) => {
              const last = i === rows.length - 1;
              const isOpen = open.has(row.name);
              const listId = `topic-lessons-${i}`;
              return (
                <li key={row.name} className="relative flex gap-4">
                  {/* The road: a 4px line from this circle to the next (sky once this topic is done) */}
                  {!last && (
                    <span
                      aria-hidden="true"
                      className={`absolute start-[20px] top-[22px] bottom-0 w-1 -translate-x-1/2 rtl:translate-x-1/2 rounded-full ${row.state === 'done' ? 'bg-denim' : 'bg-card-line'}`}
                    />
                  )}
                  <span className="relative z-10 w-10 h-11 shrink-0 grid place-items-center">
                    {row.state === 'done' && (
                      <span className="w-8 h-8 rounded-full bg-denim grid place-items-center">
                        <Check className="w-4 h-4 text-white" strokeWidth={3} aria-hidden="true" />
                      </span>
                    )}
                    {row.state === 'current' && (
                      <span className="w-10 h-10 rounded-full bg-red ring-[5px] ring-red/25 grid place-items-center">
                        <Star className="w-4 h-4 text-white fill-white" aria-hidden="true" />
                      </span>
                    )}
                    {row.state === 'later' && <span className="w-6 h-6 rounded-full border-2 border-ink-2 bg-cream" />}
                  </span>

                  <div className="min-w-0 flex-1 pb-6">
                    <button
                      type="button"
                      onClick={() => toggle(row.name)}
                      aria-expanded={isOpen}
                      aria-controls={listId}
                      className="w-full min-h-11 flex items-center gap-3 text-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[20px] leading-tight">{row.name}</span>
                        <span className="block text-sm text-ink-2">
                          {row.doneCount} of {row.lessons.length} lessons
                          <span className="sr-only">{row.state === 'done' ? ', done' : row.state === 'current' ? ", you're here" : ''}</span>
                        </span>
                      </span>
                      <ChevronDown className={`w-5 h-5 shrink-0 text-ink-2 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                    </button>

                    {/* You're here: the lesson nextLesson() picks */}
                    {row.state === 'current' && next && (
                      <Card padding="p-4" className="mt-3 flex items-center gap-4">
                        <div className="min-w-0 flex-1">
                          <Eyebrow>You&apos;re here</Eyebrow>
                          <p className="mt-1 font-display text-[22px] leading-tight">{next.lesson.title}</p>
                          <p className="mt-1 text-sm text-ink-2">{NEXT_LABEL[next.reason]}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedLesson(next.lesson)}
                          aria-label={`${next.reason === 'start' ? 'Start' : 'Continue'}: ${next.lesson.title}`}
                          className="w-14 h-14 shrink-0 rounded-full bg-navy text-white grid place-items-center hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
                        >
                          <ArrowRight className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
                        </button>
                      </Card>
                    )}

                    {/* The topic's lessons */}
                    {isOpen && (
                      <ul id={listId} className="mt-3 rounded-card bg-white border border-card-line divide-y divide-card-line">
                        {row.lessons.map((lesson) => {
                          const lessonProgress = getLessonProgress(lesson.id);
                          const isCompleted = !!lessonProgress?.completed;
                          const status = lessonProgress?.needs_review ? 'Go over again' : isCompleted ? 'Done' : lessonProgress ? 'In progress' : 'Not started';
                          return (
                            <li key={lesson.id}>
                              <button
                                type="button"
                                onClick={() => setSelectedLesson(lesson)}
                                className="w-full flex items-center gap-3 px-4 py-3 min-h-[60px] text-start hover:bg-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-navy"
                              >
                                <span className={`w-6 h-6 shrink-0 rounded-full grid place-items-center ${isCompleted ? 'bg-denim' : 'border-2 border-card-line'}`} aria-hidden="true">
                                  {isCompleted && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block text-base font-semibold leading-snug">{lesson.title}</span>
                                  <span className="flex items-center gap-2 text-sm text-ink-2">
                                    {status}
                                    {lesson.video_url && <Video className="w-4 h-4" aria-label="Has a video" />}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>

          {lessons.length === 0 && (
            <Card className="text-center py-12">
              <div className="space-y-4">
                <BookOpen className="w-16 h-16 text-card-line mx-auto" aria-hidden="true" />
                <div>
                  <h3 className="font-display text-[22px] mb-2">No lessons yet</h3>
                  <p className="text-base text-ink-2">Lessons are loading. Please check back shortly.</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </CreamSheet>
    </div>
  );
}
