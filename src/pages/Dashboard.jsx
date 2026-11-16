import React, { useState, useEffect } from 'react';
import { lessonProgress as lessonProgressApi } from '@/api/lessons';
import { content } from '@/api/content';
import { auth } from '@/api/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle, Clock, Circle, BookOpen } from 'lucide-react';
import PageTop from '@/components/pathways/PageTop';
import { CreamSheet } from '@/components/pathways/ui';
import LessonStatusCard from '@/components/dashboard/LessonStatusCard';

const TOPIC_ORDER = [
  'Principles of American Democracy',
  'System of Government',
  'Rights and Responsibilities',
  'U.S. History',
  'Geography and Symbols',
];

export default function Dashboard({ cachedUser }) {
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = cachedUser || (await auth.me().catch(() => null));
        if (!currentUser) {
          setLoading(false);
          return;
        }
        const [allLessons, progressList] = await Promise.all([
          content.lessons(),
          lessonProgressApi.list(),
        ]);
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

  const totalLessons = lessons.length;
  const completedLessons = lessonProgress.filter(
    (p) => p.completed && p.quiz_attempts > 0
  ).length;
  const inProgressLessons = lessonProgress.filter(
    (p) => !(p.completed && p.quiz_attempts > 0)
  ).length;
  const notStartedLessons = totalLessons - completedLessons - inProgressLessons;

  const progressMap = {};
  lessonProgress.forEach((p) => {
    progressMap[p.lesson_id] = p;
  });

  const lessonsByTopic = TOPIC_ORDER.map((topic) => ({
    topic,
    lessons: lessons.filter((l) => l.topic === topic),
  })).filter((g) => g.lessons.length > 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-navy" aria-hidden="true" />
      </div>
    );
  }

  const tile = 'rounded-card bg-white border border-line shadow-raised p-4';
  const iconSquare = 'w-10 h-10 rounded-2xl grid place-items-center';

  return (
    <div>
      <PageTop
        back
        title="Lesson Progress"
        subtitle="Your completion status across all citizenship topics"
      />
      <CreamSheet>
      <div className="max-w-5xl mx-auto space-y-6 pb-8 text-navy">


      {/* Status summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className={tile}>
          <span className={`${iconSquare} bg-correct-bg text-correct`}>
            <CheckCircle className="w-5 h-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-3xl font-extrabold leading-none">{completedLessons}</p>
          <p className="mt-1 text-sm font-bold text-muted">Completed</p>
        </div>
        <div className={tile}>
          <span className={`${iconSquare} bg-tint text-navy`}>
            <Clock className="w-5 h-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-3xl font-extrabold leading-none">{inProgressLessons}</p>
          <p className="mt-1 text-sm font-bold text-muted">In Progress</p>
        </div>
        <div className={tile}>
          <span className={`${iconSquare} bg-tint text-muted`}>
            <Circle className="w-5 h-5" aria-hidden="true" />
          </span>
          <p className="mt-3 text-3xl font-extrabold leading-none">{notStartedLessons}</p>
          <p className="mt-1 text-sm font-bold text-muted">Not Started</p>
        </div>
      </div>

      {/* Lesson grid by topic */}
      {lessonsByTopic.length > 0 ? (
        <div className="space-y-8">
          {lessonsByTopic.map(({ topic, lessons: topicLessons }) => (
            <section key={topic}>
              <h3 className="text-xl font-extrabold mb-4">{topic}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {topicLessons.map((lesson) => (
                  <LessonStatusCard
                    key={lesson.id}
                    lesson={lesson}
                    progress={progressMap[lesson.id]}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-base text-muted">
            <span className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-tint text-muted grid place-items-center">
              <BookOpen className="w-7 h-7" aria-hidden="true" />
            </span>
            No lessons available yet.
          </CardContent>
        </Card>
      )}
      </div>
      </CreamSheet>
    </div>
  );
}
