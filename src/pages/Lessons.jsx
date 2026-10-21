import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from "@/components/ui/button";
import { BookOpen, Video, ArrowRight, Star, ScrollText, Scale, Handshake, Landmark, Map } from 'lucide-react';
import LessonDetail from '@/components/lessons/LessonDetail.jsx';
import RecommendationsPanel from '@/components/lessons/RecommendationsPanel';
import PageHeader from '@/components/PageHeader';
import TopicArt, { TOPIC_ART } from '@/components/art/TopicArt';
import { RaisedCard, Tag } from '@/components/pathways/ui';
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

  const topics = [
    { 
      name: 'Principles of American Democracy', 
      Icon: ScrollText
    },
    { 
      name: 'System of Government', 
      Icon: Scale
    },
    { 
      name: 'Rights and Responsibilities', 
      Icon: Handshake
    },
    { 
      name: 'U.S. History', 
      Icon: Landmark
    },
    { 
      name: 'Geography and Symbols', 
      Icon: Map
    }
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
          toast.success('Lesson marked complete! Great job!');
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
        title="Civics Lessons"
        subtitle="Learn the key concepts you need to know for your U.S. citizenship test with video lessons, detailed content, and practice quizzes."
        tag="Civics"
        tagTone="red"
        art="scroll"
      />

      {/* Recommendations */}
      {user && (
        <RecommendationsPanel 
          userEmail={user.email} 
          onSelectLesson={setSelectedLesson}
        />
      )}

      {/* Topics */}
      {topics.map((topic) => {
        const topicLessons = lessons.filter(l => l.topic === topic.name);
        
        if (topicLessons.length === 0) return null;

        return (
          <section key={topic.name} className="space-y-4" aria-label={topic.name}>
            {/* Topic Header */}
            <RaisedCard padding="p-0" className="overflow-hidden">
              <div className="bg-pw-blue-soft px-5 pt-4 pb-3">
                <TopicArt name={TOPIC_ART[topic.name]} className="w-full h-20" />
              </div>
              <div className="px-5 py-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-extrabold leading-tight">{topic.name}</h2>
                  <p className="text-base text-pw-muted">{topicLessons.length} lessons available</p>
                </div>
              </div>
            </RaisedCard>

            {/* Lesson Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topicLessons.map((lesson) => {
                const lessonProgress = getLessonProgress(lesson.id);
                const hasProgress = !!lessonProgress;
                const isCompleted = lessonProgress?.completed && lessonProgress?.quiz_attempts > 0;
                const needsReview = lessonProgress?.needs_review;

                return (
                  <RaisedCard
                    key={lesson.id}
                    className="cursor-pointer transition-all hover:shadow-lift hover:border-pw-navy flex flex-col gap-3"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      {isCompleted ? (
                        <Tag tone="green">Completed</Tag>
                      ) : hasProgress ? (
                        <Tag tone="teal">In Progress</Tag>
                      ) : (
                        <Tag tone="blue">Start</Tag>
                      )}
                      <div className="flex items-center gap-1 shrink-0">
                        {lesson.video_url && (
                          <Video className="w-5 h-5 text-pw-navy" aria-label="Video lesson" />
                        )}
                        {needsReview && (
                          <Star className="w-5 h-5 text-pw-red fill-pw-red" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold leading-snug">{lesson.title}</h3>
                      {lesson.description && <p className="text-base text-pw-muted mt-1">{lesson.description}</p>}
                    </div>
                    {hasProgress && lessonProgress.best_score > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm text-pw-muted font-bold">
                          <span>{isCompleted ? 'Completed' : 'In Progress'}</span>
                          <span>{Math.round(lessonProgress.best_score)}%</span>
                        </div>
                        <div className="w-full bg-pw-line rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all ${
                              isCompleted ? 'bg-pw-green-ink' : needsReview ? 'bg-pw-red' : 'bg-pw-navy'
                            }`}
                            style={{ width: `${Math.round(lessonProgress.best_score)}%` }}
                          />
                        </div>
                        {needsReview && (
                          <span className="text-sm text-pw-red-ink font-bold">Review Recommended</span>
                        )}
                      </div>
                    )}
                    <Button className="w-full mt-auto">
                      {isCompleted ? 'Review' : hasProgress ? 'Continue' : 'Start Lesson'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </RaisedCard>
                );
              })}
            </div>
          </section>
        );
      })}

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