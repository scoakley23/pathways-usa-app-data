import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Award, Zap, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import BadgesDisplay from '@/components/gamification/BadgesDisplay';
import Leaderboard from '@/components/gamification/Leaderboard';

export default function Progress() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, mastered: 0 });
  const [userData, setUserData] = useState(null);

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

      // In a real app, we'd filter by user_id in the query
      // For this demo, we'll fetch and filter client side or assume API handles it
      const progressData = await base44.entities.UserProgress.list();
      const userProgress = progressData.filter(p => p.user_email === user.email);
      
      // Get sentence details for context
      const sentences = await base44.entities.Sentence.list();
      const sentencesMap = sentences.reduce((acc, s) => ({...acc, [s.id]: s}), {});

      const enrichedHistory = userProgress.map(p => ({
        ...p,
        sentence: sentencesMap[p.sentence_id]
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

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading progress...</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">Your Progress</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-200 text-blue-700 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Practiced</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-green-200 text-green-700 rounded-full flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Sentences Mastered</p>
              <p className="text-3xl font-bold text-slate-900">{stats.mastered}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Total Points</p>
              <p className="text-3xl font-bold text-slate-900">{userData?.points || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 border-orange-100">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-200 text-orange-700 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Best Streak</p>
              <p className="text-3xl font-bold text-slate-900">{userData?.max_streak || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
             {/* Badges Section */}
            <Card>
                <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    Achievements
                </CardTitle>
                </CardHeader>
                <CardContent>
                <BadgesDisplay earnedBadges={userData?.badges || []} />
                </CardContent>
            </Card>

            {/* History Table */}
            <Card>
                <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                {history.length > 0 ? (
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Sentence</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {history.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="text-slate-500">
                            {item.last_practiced && format(new Date(item.last_practiced), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="font-medium text-slate-800">
                            {item.sentence?.text || 'Unknown Sentence'}
                            </TableCell>
                            <TableCell>
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                                {item.sentence?.category || 'General'}
                            </Badge>
                            </TableCell>
                            <TableCell>
                            {item.status === 'mastered' ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                                <CheckCircle className="w-3 h-3 mr-1" /> Mastered
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-slate-500">Practicing</Badge>
                            )}
                            </TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12 text-slate-500">
                    <p>No practice history yet.</p>
                    <Link to={createPageUrl('Practice')} className="text-blue-600 hover:underline mt-2 inline-block">
                        Start your first session
                    </Link>
                    </div>
                )}
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-1">
            <Leaderboard />
        </div>
      </div>
    </div>
  );
}
        <CardContent>
          {history.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Sentence</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-slate-500">
                      {item.last_practiced && format(new Date(item.last_practiced), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="font-medium text-slate-800">
                      {item.sentence?.text || 'Unknown Sentence'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600">
                        {item.sentence?.category || 'General'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.status === 'mastered' ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" /> Mastered
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">Practicing</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p>No practice history yet.</p>
              <Link to={createPageUrl('Practice')} className="text-blue-600 hover:underline mt-2 inline-block">
                Start your first session
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}