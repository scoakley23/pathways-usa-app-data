import React, { useState, useEffect } from 'react';
import { interviewSessions as interviewSessionsApi } from '@/api/interview';
import { auth } from '@/api/auth';
import { RaisedCard, Tag } from '@/components/pathways/ui';
import { History } from 'lucide-react';
import useProgressText from '@/components/progress/useProgressText';

export default function InterviewHistory() {
  const { t, date, time } = useProgressText();
  const [sessions, setSessions] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        await auth.me();
        const res = await interviewSessionsApi.list({ sort: '-created_date', limit: 10 });
        setSessions(Array.isArray(res) ? res : res.items || []);
      } catch (e) {
        console.error('Failed to load interview history', e);
        setSessions([]);
      }
    })();
  }, []);

  if (!sessions || sessions.length === 0) return null;

  return (
    <RaisedCard padding="p-4" className="text-navy">
      <h2 className="flex items-center gap-2 text-lg font-bold mb-3">
        <History className="w-5 h-5" aria-hidden="true" /> <span dir="auto">{t('interviews')}</span>
      </h2>
      <div className="space-y-2">
        {sessions.map((s) => (
          <div key={s.id} className="flex items-center justify-between gap-3 border border-line rounded-card px-4 py-3">
            <div className="min-w-0">
              <p className="font-bold text-base" dir="auto">
                {s.created_date ? `${date(s.created_date, { year: 'numeric', month: 'short', day: 'numeric' })} · ${time(s.created_date)}` : t('past_session')}
              </p>
              <p className="text-small text-muted" dir="auto">
                {t('interview_passed_of', { n: s.passed_count ?? 0, total: s.question_count ?? 0 })}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1 shrink-0">
              <span className="text-lg font-extrabold">{Math.round(s.overall_score || 0)}</span>
              <Tag tone={s.passed ? 'correct' : 'navy'} className="py-1">
                {s.passed ? t('passed') : t('keep_practicing')}
              </Tag>
            </div>
          </div>
        ))}
      </div>
    </RaisedCard>
  );
}
