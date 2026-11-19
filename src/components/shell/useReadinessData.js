import { useEffect, useState } from 'react';
import { interviewSessions as interviewSessionsApi } from '@/api/interview';
import { progress as progressApi } from '@/api/progress';
import { content } from '@/api/content';
import { auth } from '@/api/auth';

// What the app already saves about how ready a learner is, for the Interview
// tab's tiles, Today's four tiles and Lesson done's "You know n of 128":
// quick-check levels, mastered 2025 civics questions (user_progress) and
// practice interview scores. Reads only; saves nothing. null while loading.
export async function loadReadiness() {
  let user = null;
  try { user = await auth.me(); } catch { user = null; }
  if (!user) return { levels: null, sessions: [], civicsMastered: 0, civicsTotal: 128 };
  const [progress, sessions, civics2025] = await Promise.all([
    progressApi.list({ contentType: 'civics_question', sort: '-last_practiced', limit: 500 }).catch(() => []),
    interviewSessionsApi.list({ sort: '-created_date', limit: 50 }).catch(() => []),
    content.civicsQuestions({ version: '2025', limit: 300 }).catch(() => []),
  ]);
  const ids = new Set(civics2025.map((q) => q.id));
  return {
    levels: user.skill_levels || null,
    sessions,
    civicsMastered: progress.filter((p) => p.status === 'mastered' && ids.has(p.content_id)).length,
    civicsTotal: civics2025.length || 128,
  };
}

export default function useReadinessData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let active = true;
    loadReadiness().then((d) => { if (active) setData(d); }).catch(() => { if (active) setData({ levels: null, sessions: [], civicsMastered: 0, civicsTotal: 128 }); });
    return () => { active = false; };
  }, []);
  return data;
}
