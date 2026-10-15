import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { History } from 'lucide-react';
import { format } from 'date-fns';

export default function InterviewHistory() {
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        const res = await base44.entities.InterviewSession.filter(
          { user_email: user.email.toLowerCase().trim() },
          { sort: '-created_date', limit: 10 }
        );
        setSessions(Array.isArray(res) ? res : res.items || []);
      } catch (e) {
        console.error('Failed to load interview history', e);
        setSessions([]);
      }
    })();
  }, []);

  if (!sessions || sessions.length === 0) return null;

  return (
    <Card className="bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="w-5 h-5 text-indigo-600" /> Your Past Interviews
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border border-slate-100 rounded-xl px-4 py-3">
            <div className="min-w-0">
              <p className="font-medium text-slate-800 text-sm">
                {s.created_date ? format(new Date(s.created_date), 'MMM d, yyyy • h:mm a') : 'Past session'}
              </p>
              <p className="text-xs text-slate-500">
                {s.passed_count ?? 0} of {s.question_count ?? 0} questions passed
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-bold text-slate-800">{Math.round(s.overall_score || 0)}</span>
              <Badge className={s.passed ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}>
                {s.passed ? 'Passed' : 'Keep Practicing'}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}