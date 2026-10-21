import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { RaisedCard, Tag } from '@/components/pathways/ui';
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
    <RaisedCard className="text-pw-navy">
      <h3 className="flex items-center gap-2 text-xl font-extrabold mb-4">
        <History className="w-5 h-5" aria-hidden="true" /> Your Past Interviews
      </h3>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border border-pw-line rounded-2xl px-4 py-3">
            <div className="min-w-0">
              <p className="font-bold text-base">
                {s.created_date ? format(new Date(s.created_date), 'MMM d, yyyy • h:mm a') : 'Past session'}
              </p>
              <p className="text-sm text-pw-muted">
                {s.passed_count ?? 0} of {s.question_count ?? 0} questions passed
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-lg font-extrabold">{Math.round(s.overall_score || 0)}</span>
              <Tag tone={s.passed ? 'green' : 'red'} className="py-1">
                {s.passed ? 'Passed' : 'Keep Practicing'}
              </Tag>
            </div>
          </div>
        ))}
      </div>
    </RaisedCard>
  );
}
