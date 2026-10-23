import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import PageHeader from '@/components/PageHeader';
import TutorLesson from '@/components/persona/TutorLesson';
import TutorMessage from '@/components/persona/TutorMessage';
import useTutorProfile from '@/components/persona/useTutorProfile';
import useAppLanguage from '@/hooks/useAppLanguage';
import { languageNameFor } from '@/components/persona/languageName';
import { buildDemoLesson } from '@/lib/demoLesson';

// Admin-only page to click through the tutor lesson screens (Prompt 3).
// Saves no progress.
export default function TutorDemo() {
  const [user, setUser] = useState(undefined);
  const [questions, setQuestions] = useState(null);
  const [finished, setFinished] = useState(false);
  const [runId, setRunId] = useState(0);
  const { profile, loaded } = useTutorProfile();
  const [language] = useAppLanguage();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    base44.entities.CivicsQuestion.filter({ version: '2025' }, null, 200)
      .then(setQuestions)
      .catch(() => setQuestions([]));
  }, [user]);

  const lesson = useMemo(() => buildDemoLesson(questions || [], language), [questions, language]);

  if (user === undefined || !loaded) return <Loader2 className="w-6 h-6 animate-spin mx-auto mt-12" />;

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-center">
        <AlertCircle className="w-12 h-12 text-pw-red-ink" />
        <h2 className="text-2xl font-bold text-pw-navy">Access Denied</h2>
        <p className="text-pw-muted">This demo is for admins only.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Tutor demo" subtitle="Admin only. Click through a tutor lesson. No progress is saved." />
      {questions === null && <Loader2 className="w-6 h-6 animate-spin mx-auto" />}
      {questions && lesson.steps.length === 0 && (
        <p className="text-center text-pw-muted">No 2025 civics questions found. Add them on the Admin page.</p>
      )}
      {questions && lesson.steps.length > 0 && !finished && (
        <TutorLesson
          key={runId}
          lesson={lesson}
          profile={profile}
          language={language}
          languageName={languageNameFor(language)}
          onFinish={() => setFinished(true)}
          onExit={() => setFinished(true)}
        />
      )}
      {finished && (
        <div className="max-w-xl mx-auto space-y-4">
          <TutorMessage profile={profile} language="en" en="That's the end of the demo lesson." />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setFinished(false); setRunId(runId + 1); }}
              className="min-h-[44px] flex-1 rounded-xl font-semibold text-white bg-pw-navy"
            >
              Start again
            </button>
            <Link to={createPageUrl('Profile')} className="min-h-[44px] flex-1 rounded-xl font-semibold border-2 border-pw-navy text-pw-navy inline-flex items-center justify-center">
              Change tutor or text size
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
