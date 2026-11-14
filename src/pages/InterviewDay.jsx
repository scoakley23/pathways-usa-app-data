import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { auth } from '@/api/auth';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button, Card } from '@/components/pathways/ui';
import InterviewDayGuide from '@/components/interview-day/InterviewDayGuide';
import RehearsalStart from '@/components/interview-day/RehearsalStart';
import RehearsalRunner from '@/components/interview-day/RehearsalRunner';
import { CIVICS_TEST_RULES } from '@/lib/interviewDay';

// Default civics version: the learner's current Civics Quiz choice (read only;
// this page never writes browser storage), else 2025.
function defaultVersion() {
  try {
    const v = localStorage.getItem('civicsVersion');
    return CIVICS_TEST_RULES[v] ? v : '2025';
  } catch {
    return '2025';
  }
}

// Interview Day (/interview-day, frame R30DayGuide): what happens on the
// day, then "Practice the whole day" (the full rehearsal). The rehearsal saves nothing: no Base44 records and no browser
// storage. Its answers, scores, and choices live only in page memory.
export default function InterviewDay() {
  const [user, setUser] = useState(undefined);
  const [version, setVersion] = useState(defaultVersion);
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const start = () => { setRunning(true); window.scrollTo({ top: 0 }); };
  const stop = () => { setRunning(false); window.scrollTo({ top: 0 }); };

  if (running && user) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
        <RehearsalRunner
          version={version}
          userEmail={user.email.toLowerCase().trim()}
          onStop={stop}
        />
      </div>
    );
  }

  return (
    <div>
      <NavyBanner
        title="What happens on the day"
        subtitle="So nothing surprises you"
        left={(
          <button type="button" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/interview'))} aria-label="Back" className="w-11 h-11 grid place-items-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
          </button>
        )}
      />
      <div className="max-w-lg mx-auto px-4 py-5 space-y-6 pb-8">

      <InterviewDayGuide version={version} />

      {user === undefined ? (
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-pw-navy" aria-label="Loading" />
      ) : user ? (
        <RehearsalStart
          version={version}
          onSelectVersion={setVersion}
          onStart={start}
        />
      ) : (
        <Card className="space-y-3 text-navy">
          <h2 className="text-title font-bold">Practice the whole day</h2>
          <p className="text-base">Sign in to practice the whole interview, start to finish.</p>
          <Button variant="main" className="w-full" onClick={() => auth.goToSignIn()}>Sign in</Button>
        </Card>
      )}
      </div>
    </div>
  );
}
