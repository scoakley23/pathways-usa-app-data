import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { auth } from '@/api/auth';
import PageTop from '@/components/pathways/PageTop';
import { PrimaryButton, RaisedCard, CreamSheet } from '@/components/pathways/ui';
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

// Interview Day (/interview-day): what to expect, then a full practice
// rehearsal. The rehearsal saves nothing: no Base44 records and no browser
// storage. Its answers, scores, and choices live only in page memory.
export default function InterviewDay() {
  const [user, setUser] = useState(undefined);
  const [version, setVersion] = useState(defaultVersion);
  const [running, setRunning] = useState(false);

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
      <PageTop
        back
        tag="Practice"
        title="Interview Day"
        subtitle="What to expect, and a full practice rehearsal."
        guide="Here you can practice the whole interview, start to finish. It's practice only, and nothing you say is saved."
      />
      <CreamSheet>
      <div className="max-w-2xl mx-auto space-y-6 pb-8">


      <InterviewDayGuide />

      {user === undefined ? (
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-pw-navy" aria-label="Loading" />
      ) : user ? (
        <RehearsalStart
          version={version}
          onSelectVersion={setVersion}
          onStart={start}
        />
      ) : (
        <RaisedCard className="space-y-3 text-pw-navy">
          <h2 className="text-[28px] leading-snug font-display font-normal">Full rehearsal</h2>
          <p className="text-base">Sign in to practice the whole interview, start to finish.</p>
          <PrimaryButton className="w-full" onClick={() => auth.goToSignIn()}>Sign in</PrimaryButton>
        </RaisedCard>
      )}
      </div>
      </CreamSheet>
    </div>
  );
}
