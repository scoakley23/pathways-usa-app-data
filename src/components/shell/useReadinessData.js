import { useEffect, useState } from 'react';
import { interviewSessions as interviewSessionsApi, n400Progress as n400ProgressApi } from '@/api/interview';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import { progress as progressApi } from '@/api/progress';
import { content } from '@/api/content';
import { auth } from '@/api/auth';

// What the app already saves about how ready a learner is, for the Interview
// tab's tiles, Today's four tiles and Lesson done's "You know n of 128":
// quick-check levels, mastered 2025 civics questions (user_progress) and
// practice interview scores, and N-400 guide sections read (the Interview
// tab's "n of 5 ready"). Reads only; saves nothing. null while loading.
export async function loadReadiness() {
  let user = null;
  try { user = await auth.me(); } catch { user = null; }
  if (!user) return { levels: null, sessions: [], civicsMastered: 0, civicsTotal: 128, masteredIds: new Set(), n400Read: 0, n400Total: N400_SECTIONS.length };
  const [progress, sessions, civics2025, n400] = await Promise.all([
    progressApi.list({ contentType: 'civics_question', sort: '-last_practiced', limit: 500 }).catch(() => []),
    interviewSessionsApi.list({ sort: '-created_date', limit: 50 }).catch(() => []),
    content.civicsQuestions({ version: '2025', limit: 300 }).catch(() => []),
    n400ProgressApi.list().catch(() => []),
  ]);
  const ids = new Set(civics2025.map((q) => q.id));
  const masteredIds = new Set(progress.filter((p) => p.status === 'mastered' && ids.has(p.content_id)).map((p) => p.content_id));
  return {
    levels: user.skill_levels || null,
    sessions,
    civicsMastered: masteredIds.size,
    masteredIds, // Course: questions done per topic
    n400Read: new Set(n400.filter((r) => r.completed && N400_SECTIONS.some((s) => s.id === r.section_id)).map((r) => r.section_id)).size,
    n400Total: N400_SECTIONS.length,
    civicsTotal: civics2025.length || 128,
  };
}

export default function useReadinessData() {
  const [data, setData] = useState(null);
  useEffect(() => {
    let active = true;
    loadReadiness().then((d) => { if (active) setData(d); }).catch(() => { if (active) setData({ levels: null, sessions: [], civicsMastered: 0, civicsTotal: 128, masteredIds: new Set(), n400Read: 0, n400Total: N400_SECTIONS.length }); });
    return () => { active = false; };
  }, []);
  return data;
}
