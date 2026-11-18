import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '@/api/auth';
import { courseProgress } from '@/api/course';
import { canSeeDrafts } from '@/lib/journey';
import { N400_LESSONS, N400_LESSON_IDS, n400LessonForSection, n400LessonVisible } from '@/lib/n400Lessons';

// The old N-400 coach (/n400-coach, ?section=…) is now the N-400 lessons:
// this opens the section's lesson when one is asked for, else the learner's
// next unfinished lesson, else the N-400 guide (no lesson open yet).
export default function N400CoachRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    let active = true;
    (async () => {
      let user = null;
      try { user = await auth.me(); } catch (e) { user = null; }
      const drafts = canSeeDrafts(user);
      const open = N400_LESSONS.filter((l) => n400LessonVisible(l, drafts));
      const asked = n400LessonForSection(new URLSearchParams(window.location.search).get('section'));
      let target = asked && open.includes(asked) ? asked : null;
      if (!target && open.length) {
        let done = {};
        if (user) { try { done = (await courseProgress.load(N400_LESSON_IDS)).lessons; } catch (e) { done = {}; } }
        target = open.find((l) => !(done[l.id]?.completed || done[l.id]?.completed_at)) || open[0];
      }
      if (active) navigate(target ? `/course/n400/${target.id}` : '/n400-guide', { replace: true });
    })();
    return () => { active = false; };
  }, [navigate]);
  return <div className="min-h-screen bg-page" />;
}
