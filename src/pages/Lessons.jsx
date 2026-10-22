import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { BookOpen, Video, ChevronRight } from 'lucide-react';
import LessonDetail from '@/components/lessons/LessonDetail.jsx';
import RecommendationsPanel from '@/components/lessons/RecommendationsPanel';
import PageHeader from '@/components/PageHeader';
import { RaisedCard, SKILL_TONE } from '@/components/pathways/ui';
import { toast } from "sonner";

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

  return (
    <div className="space-y-8 text-pw-navy">
      <PageHeader
        title="Lessons"
        subtitle="The ideas behind the civics test, one topic at a time."
        tag="Civics"
        tagTone={SKILL_TONE.civics}
        art="scroll"
        guide="Each lesson ends with the exact questions the officer may ask. We go over them together."
      />

      {/* Recommendations */}
      {user && (
        <RecommendationsPanel 
          userEmail={user.email} 
          onSelectLesson={setSelectedLesson}
        />
      )}

      {/* The card box: one colored divider per topic, its lessons behind it */}
      <div className="rounded-[20px] bg-pw-slate p-3 sm:p-5 space-y-6">
        {topics.map((topic) => {
          const topicLessons = lessons.filter(l => l.topic === topic.name);
          if (topicLessons.length === 0) return null;
          const doneCount = topicLessons.filter((l) => getLessonProgress(l.id)?.completed).length;
          const headingId = `topic-${topic.name.replace(/[^a-z]/gi, '-').toLowerCase()}`;

          return (
            <section key={topic.name} aria-labelledby={headingId}>
              {/* Divider */}
              <div className={`rounded-t-[14px] ${topic.color} text-white px-4 py-3 sm:px-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1`}>
                <h2 id={headingId} className="font-display text-[26px] leading-tight">{topic.name}</h2>
                <p className="text-base font-semibold">{doneCount} of {topicLessons.length} lessons</p>
              </div>
              {/* Lesson cards */}
              <ul className={`rounded-b-[14px] border-x-4 border-b-4 ${topic.border} bg-white/60 p-2 sm:p-3 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3`}>
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
                        className="w-full h-full text-left rounded-[14px] bg-white border border-pw-line shadow-raised p-4 min-h-[88px] flex items-start gap-3 hover:border-pw-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
                      >
                        <span className="flex-1 min-w-0">
                          <span className="flex items-center gap-2 text-sm text-pw-muted">
                            {isCompleted ? (
                              <span className="-rotate-6 rounded border-2 border-pw-writing px-1.5 text-xs font-bold uppercase tracking-[0.14em] text-pw-writing">Done</span>
                            ) : hasProgress ? 'In progress' : 'Not started'}
                            {lesson.video_url && <Video className="w-4 h-4" aria-label="Has a video" />}
                          </span>
                          <span className="mt-1 block text-lg font-semibold leading-snug">{lesson.title}</span>
                          {lesson.description && <span className="mt-1 block text-base text-pw-muted">{lesson.description}</span>}
                          {needsReview && <span className="mt-1 block text-sm font-semibold text-pw-muted">Worth going over again</span>}
                        </span>
                        <ChevronRight className="w-5 h-5 text-pw-muted shrink-0 mt-1" aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>

      {lessons.length === 0 && (
        <RaisedCard className="text-center py-12">
          <div className="space-y-4">
            <BookOpen className="w-16 h-16 text-pw-line mx-auto" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-extrabold mb-2">No Lessons Available</h3>
              <p className="text-base text-pw-muted">Lessons are loading. Please check back shortly.</p>
            </div>
          </div>
        </RaisedCard>
      )}
    </div>
  );
}