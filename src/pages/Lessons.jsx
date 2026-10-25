import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { ArrowRight, BookOpen, Video } from 'lucide-react';
import LessonDetail from '@/components/lessons/LessonDetail.jsx';
import PageHeader from '@/components/PageHeader';
import { RaisedCard, SKILL_COLOR, SKILL_ON } from '@/components/pathways/ui';
import { nextLesson } from '@/lib/lessonDeck';
import { toast } from "sonner";

const NEXT_LABEL = {
  review: 'Worth going over again',
  continue: 'Pick up where you left off',
  start: 'Next lesson',
};

export default function Lessons() {
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
        currentUser = await base44.auth.me();
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

  // The five official topics, as colored dividers in the card box.
  const topics = [
    { name: 'Principles of American Democracy', color: 'bg-pw-civics', border: 'border-pw-civics' },
    { name: 'System of Government', color: 'bg-pw-navy', border: 'border-pw-navy' },
    { name: 'Rights and Responsibilities', color: 'bg-pw-reading', border: 'border-pw-reading' },
    { name: 'U.S. History', color: 'bg-pw-red-ink', border: 'border-pw-red-ink' },
    { name: 'Geography and Symbols', color: 'bg-pw-writing', border: 'border-pw-writing' },
  ];

  const getLessonProgress = (lessonId) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  if (selectedLesson) {
    return (
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
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pw-navy border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-base text-pw-muted">Loading lessons...</p>
        </div>
      </div>
    );
  }

  const doneTotal = lessons.filter((l) => getLessonProgress(l.id)?.completed).length;
  const next = nextLesson(lessons, progress);

  return (
    <div className="space-y-8 text-pw-navy">
      <PageHeader
        tag={`Civics · ${doneTotal} of ${lessons.length} lessons done`}
        title="Lessons"
        guide="Each lesson ends with the exact questions the officer may ask. We go over them together."
      />

      {/* The next lesson, as a poster in the civics color */}
      {next && (
        <button
          type="button"
          onClick={() => setSelectedLesson(next.lesson)}
          className={`w-full text-left rounded-[18px] p-5 sm:p-7 min-h-[200px] flex flex-col gap-3 shadow-[0_12px_26px_rgba(20,38,74,0.18)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${SKILL_COLOR.civics} ${SKILL_ON.civics}`}
        >
          <span className="text-[13px] font-semibold uppercase tracking-[0.16em]">{NEXT_LABEL[next.reason]} · {next.lesson.topic}</span>
          <span className="text-[32px] sm:text-[40px] font-bold leading-[1.05] tracking-[-0.01em]">{next.lesson.title}</span>
          {next.lesson.description && <span className="font-display italic text-[20px] leading-snug">{next.lesson.description}</span>}
          <span className="mt-auto pt-2 self-start min-h-[52px] rounded-full bg-white text-pw-navy px-7 text-lg font-semibold inline-flex items-center gap-2">
            {next.reason === 'start' ? 'Start' : 'Continue'} <ArrowRight className="w-5 h-5 rtl:rotate-180" aria-hidden="true" />
          </span>
        </button>
      )}

      {/* The card box on the desk: one tabbed card per topic, its lessons inside */}
      <div className="rounded-[22px] bg-pw-slate p-3 pt-5 sm:p-6 space-y-6">
        {topics.map((topic, ti) => {
          const topicLessons = lessons.filter(l => l.topic === topic.name);
          if (topicLessons.length === 0) return null;
          const doneCount = topicLessons.filter((l) => getLessonProgress(l.id)?.completed).length;
          const headingId = `topic-${topic.name.replace(/[^a-z]/gi, '-').toLowerCase()}`;

          return (
            <section key={topic.name} aria-labelledby={headingId}>
              <span className={`ml-4 inline-block rounded-t-lg px-3 py-1 text-sm font-semibold text-white ${topic.color}`}>Topic {ti + 1}</span>
              <div className="rounded-[16px] bg-white border border-pw-line shadow-raised p-3 sm:p-4 space-y-3">
                <div className="px-1 space-y-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 id={headingId} className="font-display text-[26px] sm:text-[30px] leading-tight">{topic.name}</h2>
                    <p className="text-[15px] font-semibold text-pw-muted">{doneCount} of {topicLessons.length} lessons</p>
                  </div>
                  <div className="flex gap-1.5" aria-hidden="true">
                    {topicLessons.map((l, k) => (
                      <span key={l.id} className={`h-1.5 flex-1 rounded-full ${k < doneCount ? topic.color : 'bg-pw-soft'}`} />
                    ))}
                  </div>
                </div>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {topicLessons.map((lesson) => {
                    const lessonProgress = getLessonProgress(lesson.id);
                    const isCompleted = !!lessonProgress?.completed;
                    const hasProgress = !!lessonProgress;
                    const needsReview = lessonProgress?.needs_review;

                    return (
                      <li key={lesson.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedLesson(lesson)}
                          className="relative w-full h-full text-left rounded-[12px] bg-pw-page border border-pw-line p-4 min-h-[84px] flex flex-col gap-1 hover:border-pw-navy hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                        >
                          <span className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.1em] text-pw-muted">
                            {needsReview ? 'Go over again' : isCompleted ? 'Done' : hasProgress ? 'In progress' : 'Not started'}
                            {lesson.video_url && <Video className="w-4 h-4" aria-label="Has a video" />}
                          </span>
                          <span className={`block text-[17px] font-semibold leading-snug ${isCompleted ? 'pe-16' : ''}`}>{lesson.title}</span>
                          {isCompleted && (
                            <span className="pointer-events-none absolute end-3 top-3 -rotate-[8deg] rounded-md border-2 border-pw-navy px-2 py-0.5 text-sm font-bold uppercase tracking-[0.12em]" aria-hidden="true">Done</span>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </section>
          );
        })}
      </div>

      {lessons.length === 0 && (
        <RaisedCard className="text-center py-12">
          <div className="space-y-4">
            <BookOpen className="w-16 h-16 text-pw-line mx-auto" aria-hidden="true" />
            <div>
              <h3 className="font-display text-[28px] mb-2">No lessons yet</h3>
              <p className="text-base text-pw-muted">Lessons are loading. Please check back shortly.</p>
            </div>
          </div>
        </RaisedCard>
      )}
    </div>
  );
}
