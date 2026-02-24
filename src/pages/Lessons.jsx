import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Video, CheckCircle, ArrowRight, Award, Star } from 'lucide-react';
import LessonDetail from '@/components/lessons/LessonDetail';
import RecommendationsPanel from '@/components/lessons/RecommendationsPanel';
import GenerateLessonsButton from '@/components/admin/GenerateLessonsButton';
import { toast } from "sonner";

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [progress, setProgress] = useState([]);

  useEffect(() => {
    loadUser();
    loadLessons();
  }, []);

  const loadUser = async () => {
    try {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      
      if (currentUser?.email) {
        const userProgress = await base44.entities.LessonProgress.list({
          query: { user_email: currentUser.email },
          limit: 1000
        });
        setProgress(userProgress);
      }
    } catch (error) {
      console.error('Not authenticated');
    }
  };

  const loadLessons = async () => {
    try {
      setLoading(true);
      const allLessons = await base44.entities.Lesson.list('order', 100);
      setLessons(allLessons);
    } catch (error) {
      console.error('Failed to load lessons:', error);
      toast.error('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const topics = [
    { 
      name: 'Principles of American Democracy', 
      icon: '📜',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      name: 'System of Government', 
      icon: '⚖️',
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      name: 'Rights and Responsibilities', 
      icon: '✊',
      color: 'from-purple-500 to-purple-600'
    },
    { 
      name: 'U.S. History', 
      icon: '🏛️',
      color: 'from-red-500 to-red-600'
    },
    { 
      name: 'Geography and Symbols', 
      icon: '🗺️',
      color: 'from-green-500 to-green-600'
    }
  ];

  const getLessonProgress = (lessonId) => {
    return progress.find(p => p.lesson_id === lessonId);
  };

  if (selectedLesson) {
    return (
      <LessonDetail 
        lesson={selectedLesson} 
        onBack={() => {
          setSelectedLesson(null);
          loadUser(); // Refresh progress
        }}
        onComplete={() => {
          toast.success('Lesson completed!');
          setSelectedLesson(null);
          loadUser();
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-block p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
          <BookOpen className="w-12 h-12 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-slate-900">Civics Lessons</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Learn the key concepts you need to know for your U.S. citizenship test with video lessons, detailed content, and practice quizzes.
        </p>
      </div>

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
          <div key={topic.name} className="space-y-4">
            {/* Topic Header */}
            <div className={`bg-gradient-to-r ${topic.color} text-white p-6 rounded-xl shadow-md`}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{topic.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold">{topic.name}</h2>
                  <p className="text-white/90 text-sm">{topicLessons.length} lessons available</p>
                </div>
              </div>
            </div>

            {/* Lesson Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topicLessons.map((lesson) => {
                const lessonProgress = getLessonProgress(lesson.id);
                const hasProgress = lessonProgress && lessonProgress.best_score > 0;
                const needsReview = lessonProgress?.needs_review;

                return (
                  <Card 
                    key={lesson.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-400 relative"
                    onClick={() => setSelectedLesson(lesson)}
                  >
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between gap-2">
                        <span className="text-lg">{lesson.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          {lesson.video_url && (
                            <Video className="w-5 h-5 text-red-500" />
                          )}
                          {hasProgress && lessonProgress.best_score >= 80 && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                          {needsReview && (
                            <Star className="w-5 h-5 text-orange-500 fill-orange-500" />
                          )}
                        </div>
                      </CardTitle>
                      <CardDescription>{lesson.description}</CardDescription>
                      {hasProgress && (
                        <div className="text-xs text-slate-600 mt-1">
                          Best Score: {lessonProgress.best_score}%
                          {needsReview && (
                            <span className="ml-2 text-orange-600 font-medium">• Review Recommended</span>
                          )}
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700">
                        {hasProgress ? 'Continue' : 'Start Lesson'} <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        );
      })}

      {lessons.length === 0 && (
        <Card className="text-center p-12">
          <div className="space-y-4">
            <BookOpen className="w-16 h-16 text-slate-300 mx-auto" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">No Lessons Yet</h3>
              <p className="text-slate-600 mb-6">Generate AI-powered civics lessons based on citizenship test questions.</p>
              {user?.role === 'admin' && <GenerateLessonsButton />}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}