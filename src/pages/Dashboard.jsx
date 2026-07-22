import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  BookOpen,
  CheckCircle,
  Award,
  TrendingUp,
  Clock,
  Circle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import ProgressRing from '@/components/dashboard/ProgressRing';
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
  const [user, setUser] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonProgress, setLessonProgress] = useState([]);
  const [userProgress, setUserProgress] = useState([]);
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const currentUser = cachedUser || (await base44.auth.me().catch(() => null));
        if (!currentUser) {
          setLoading(false);
          return;
        }
        setUser(currentUser);
        await loadData(currentUser);
      } catch (err) {
        console.error('Dashboard init error:', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [cachedUser]);

  const loadData = async (currentUser) => {
    const [allLessons, progressList, practiceProgress, profiles] = await Promise.all([
      base44.entities.Lesson.list(),
      base44.entities.LessonProgress.filter({ user_email: currentUser.email }),
      base44.entities.UserProgress.filter({ user_email: currentUser.email }),
      base44.entities.PublicProfile.filter({
        user_email: currentUser.email.toLowerCase().trim(),
      }),
    ]);

    setLessons(allLessons.sort((a, b) => (a.order || 0) - (b.order || 0)));
    setLessonProgress(progressList);
    setUserProgress(practiceProgress);
    if (profiles.length > 0) {
      setDisplayName(profiles[0].display_name || '');
    }
  };

  // --- Stats ---
  const totalLessons = lessons.length;
  const completedLessons = lessonProgress.filter(
    (p) => p.completed && p.quiz_attempts > 0
  ).length;
  const inProgressLessons = lessonProgress.filter(
    (p) => !(p.completed && p.quiz_attempts > 0)
  ).length;
  const notStartedLessons = totalLessons - completedLessons - inProgressLessons;
  const masteredItems = userProgress.filter((p) => p.status === 'mastered').length;
  const avgQuizScore =
    lessonProgress.length > 0
      ? Math.round(
          lessonProgress.reduce((s, p) => s + (p.best_score || 0), 0) /
            lessonProgress.length
        )
      : 0;

  const lessonRate = totalLessons > 0 ? completedLessons / totalLessons : 0;
  const masteryRate = Math.min(masteredItems / 100, 1);
  const overallReadiness = Math.round(
    (lessonRate * 0.5 + masteryRate * 0.3 + (avgQuizScore / 100) * 0.2) * 100
  );

  const progressMap = {};
  lessonProgress.forEach((p) => {
    progressMap[p.lesson_id] = p;
  });

  const lessonsByTopic = TOPIC_ORDER.map((topic) => ({
    topic,
    lessons: lessons.filter((l) => l.topic === topic),
  })).filter((g) => g.lessons.length > 0);

  // --- Recent activity ---
  const recentActivity = [
    ...lessonProgress
      .filter((p) => p.last_attempt_date)
      .map((p) => {
        const lesson = lessons.find((l) => l.id === p.lesson_id);
        return {
          date: p.last_attempt_date,
          title: lesson?.title || 'Lesson Quiz',
          detail: p.completed
            ? `Quiz passed — ${Math.round(p.best_score)}%`
            : `Quiz attempted — ${Math.round(p.last_score)}%`,
          icon: p.completed ? CheckCircle : Clock,
          color: p.completed
            ? 'text-green-600 bg-green-50'
            : 'text-amber-600 bg-amber-50',
        };
      }),
    ...userProgress
      .filter((p) => p.last_practiced)
      .sort((a, b) => new Date(b.last_practiced) - new Date(a.last_practiced))
      .slice(0, 10)
      .map((p) => ({
        date: p.last_practiced,
        title:
          p.content_type === 'civics_question'
            ? 'Civics Practice'
            : p.content_type === 'vocabulary'
            ? 'Vocabulary Practice'
            : 'Reading Practice',
        detail: p.status === 'mastered' ? 'Mastered' : 'Practicing',
        icon: p.status === 'mastered' ? Award : TrendingUp,
        color:
          p.status === 'mastered'
            ? 'text-green-600 bg-green-50'
            : 'text-blue-600 bg-blue-50',
      })),
  ]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 8);

  // --- Render ---
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Sparkles className="w-12 h-12 text-slate-300" />
        <p className="text-slate-500">Sign in to view your dashboard.</p>
        <Button onClick={() => base44.auth.redirectToLogin()}>Sign In</Button>
      </div>
    );
  }

  const greetingName = displayName || user.full_name?.split(' ')[0] || 'there';

  const stats = [
    {
      label: 'Completed',
      value: completedLessons,
      total: totalLessons,
      icon: CheckCircle,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'In Progress',
      value: inProgressLessons,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      label: 'Items Mastered',
      value: masteredItems,
      icon: Award,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Quiz Average',
      value: `${avgQuizScore}%`,
      icon: TrendingUp,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">
          Welcome back, {greetingName}!
        </h1>
        <p className="text-slate-600 mt-1">
          Here's your citizenship journey at a glance.
        </p>
      </div>

      {/* Overview: Ring + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          className="lg:col-span-1 border-0 shadow-md"
          style={{ background: 'linear-gradient(135deg, #1A3A6D 0%, #2C5BA0 100%)' }}
        >
          <CardContent className="p-8 flex flex-col items-center justify-center text-white">
            <ProgressRing
              progress={overallReadiness}
              size={140}
              stroke={12}
              trackColor="rgba(255,255,255,0.15)"
              progressColor="#5C8BD3"
              labelColor="text-white"
            />
            <p className="text-blue-100 text-sm mt-4 font-medium">Overall Readiness</p>
            <p className="text-blue-200 text-xs mt-1 text-center">
              Based on lessons, practice &amp; quiz scores
            </p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div
                  className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-full flex items-center justify-center shrink-0`}
                >
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {stat.value}
                    {stat.total != null && (
                      <span className="text-base text-slate-400">/{stat.total}</span>
                    )}
                  </p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Lesson Progress */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">Lesson Progress</h2>
          <Link to={createPageUrl('Lessons')}>
            <Button variant="ghost" size="sm" className="text-blue-600">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Status legend */}
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1.5 text-slate-600">
            <CheckCircle className="w-3.5 h-3.5 text-green-600" /> Completed ({completedLessons})
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Clock className="w-3.5 h-3.5 text-amber-600" /> In Progress ({inProgressLessons})
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <Circle className="w-3.5 h-3.5 text-slate-400" /> Not Started ({notStartedLessons})
          </span>
        </div>

        {lessonsByTopic.length > 0 ? (
          <div className="space-y-6">
            {lessonsByTopic.map(({ topic, lessons: topicLessons }) => (
              <div key={topic}>
                <h3 className="text-sm font-semibold text-slate-700 mb-3">{topic}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topicLessons.map((lesson) => (
                    <LessonStatusCard
                      key={lesson.id}
                      lesson={lesson}
                      progress={progressMap[lesson.id]}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center text-slate-500">
              <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              No lessons available yet.
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
        <Card className="border-0 shadow-sm">
          <CardContent className="p-0">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {recentActivity.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-4">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${item.color}`}
                    >
                      <item.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">{item.detail}</p>
                    </div>
                    <span className="text-xs text-slate-400 shrink-0">
                      {format(new Date(item.date), 'MMM d, h:mm a')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p>No activity yet. Start practicing to see your progress here!</p>
                <Link to={createPageUrl('Practice')} className="inline-block mt-3">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Start Practicing
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}