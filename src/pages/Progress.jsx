import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Award, Flag, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import PracticeCalendar from '@/components/progress/PracticeCalendar';
import ProgressChart from '@/components/progress/ProgressChart';
import TestDateTracker from '@/components/progress/TestDateTracker';
import QuickCheckCard from '@/components/persona/QuickCheckCard';
import useAppLanguage from '@/hooks/useAppLanguage';
import { Progress as ProgressBar } from "@/components/ui/progress";
import PageHeader from '@/components/PageHeader';
import { RaisedCard } from '@/components/pathways/ui';

export default function Progress() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, mastered: 0 });
  const [userData, setUserData] = useState(null);
  const [language] = useAppLanguage();

  useEffect(() => {
    fetchProgress();
  }, []);

  const fetchProgress = async () => {
    try {
      const user = await base44.auth.me().catch(() => null);
      if (!user) {
        setIsLoading(false);
        return;
      }
      setUserData(user);

      // Fetch Progress
      const progressData = await base44.entities.UserProgress.list();
      const userProgress = progressData.filter(p => p.user_email === user.email);
      
      // Fetch Content for mapping names
      const [sentences, vocab, questions] = await Promise.all([
        base44.entities.Sentence.list(),
        base44.entities.VocabularyWord.list(),
        base44.entities.CivicsQuestion.list()
      ]);

      const contentMap = {
        sentence: sentences.reduce((acc, s) => ({...acc, [s.id]: s}), {}),
        vocabulary: vocab.reduce((acc, s) => ({...acc, [s.id]: s}), {}),
        civics_question: questions.reduce((acc, s) => ({...acc, [s.id]: s}), {})
      };

      const enrichedHistory = userProgress.map(p => ({
        ...p,
        content: contentMap[p.content_type || 'sentence']?.[p.content_id] || { text: 'Unknown Content' }
      })).sort((a, b) => new Date(b.last_practiced) - new Date(a.last_practiced));

      setHistory(enrichedHistory);
      setStats({
        total: enrichedHistory.length,
        mastered: enrichedHistory.filter(p => p.status === 'mastered').length
      });
      
    } catch (error) {
      console.error("Error fetching progress", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-base text-pw-muted">Loading progress...</div>;

  // Calculate Preparedness Score (Simple metric: Mastered / 100 * 100, cap at 100)
  const preparedness = Math.min(Math.round((stats.mastered / 100) * 100), 100);

  const tileLink = 'block rounded-3xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2';

  return (
    <div className="space-y-6 text-pw-navy">
      <PageHeader title="Your Progress" subtitle="Track your journey to citizenship" art="flag">
        <TestDateTracker />
      </PageHeader>

      <QuickCheckCard variant="progress" language={language} />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <Link to={createPageUrl('StudyHistory')} className={tileLink}>
          <RaisedCard className="h-full hover:shadow-lift transition-shadow">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-pw-blue-soft text-pw-blue-ink grid place-items-center">
                <Clock className="w-6 h-6" aria-hidden="true" />
              </div>
              <ArrowRight className="w-5 h-5 text-pw-muted" aria-hidden="true" />
            </div>
            <p className="mt-4 text-4xl font-extrabold leading-none">{stats.total}</p>
            <p className="mt-2 text-sm font-bold text-pw-muted">Total Practiced</p>
          </RaisedCard>
        </Link>

        <Link to={createPageUrl('Dashboard')} className={tileLink}>
          <RaisedCard className="h-full hover:shadow-lift transition-shadow">
            <div className="flex items-start justify-between">
              <div className="w-12 h-12 rounded-2xl bg-pw-green-soft text-pw-green-ink grid place-items-center">
                <Award className="w-6 h-6" aria-hidden="true" />
              </div>
              <ArrowRight className="w-5 h-5 text-pw-muted" aria-hidden="true" />
            </div>
            <p className="mt-4 text-4xl font-extrabold leading-none">{stats.mastered}</p>
            <p className="mt-2 text-sm font-bold text-pw-muted">Items Mastered</p>
          </RaisedCard>
        </Link>

        <RaisedCard className="col-span-2">
          <div className="flex justify-between items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-pw-teal-soft text-pw-teal-ink grid place-items-center shrink-0">
                <Flag className="w-6 h-6" aria-hidden="true" />
              </div>
              <p className="text-lg font-extrabold">Test Preparedness</p>
            </div>
            <span className="text-3xl font-extrabold">{preparedness}%</span>
          </div>
          <ProgressBar value={preparedness} className="h-3 bg-pw-soft" aria-label="Test Preparedness" />
          <p className="text-sm text-pw-muted mt-3">Based on mastered content items (Goal: 100)</p>
        </RaisedCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Calendar */}
          <PracticeCalendar history={history} />

          {/* Progress Chart */}
          <ProgressChart userEmail={userData?.email} />

          {/* Badges Section */}
          <Card>
            <CardHeader className="p-5 sm:p-6">
              <CardTitle className="flex items-center gap-3 text-xl">
                <span className="w-10 h-10 rounded-2xl bg-pw-red-soft text-pw-red-ink grid place-items-center shrink-0">
                  <Award className="w-5 h-5" aria-hidden="true" />
                </span>
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 sm:p-6 sm:pt-0">
              <BadgesDisplay earnedBadges={userData?.badges || []} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Recent List Sidebar */}
          <Card className="lg:h-full max-h-[600px] flex flex-col">
            <CardHeader className="p-5 sm:p-6">
              <CardTitle className="text-xl">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-5 pt-0 sm:p-6 sm:pt-0">
              {history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-pw-line bg-white p-4">
                      <p className="text-sm text-pw-muted mb-1">
                        {format(new Date(item.last_practiced), 'MMM d, h:mm a')}
                      </p>
                      <p className="font-semibold text-pw-navy text-base line-clamp-2">
                        {item.content?.text || item.content?.word || item.content?.question || 'Unknown'}
                      </p>
                      <div className="flex justify-between items-center mt-3">
                        <Badge variant="secondary">
                          {item.content_type || 'Sentence'}
                        </Badge>
                        {item.status === 'mastered' ? (
                          <CheckCircle className="w-5 h-5 text-pw-green-ink" aria-label="Mastered" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-pw-line" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-base text-pw-muted rounded-2xl bg-pw-soft">
                  No history yet.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
