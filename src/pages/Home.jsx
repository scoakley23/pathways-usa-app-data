import React, { useEffect, useState } from 'react';
import { auth } from '@/api/auth';
import TodayPage from '@/components/today/TodayPage';
import WelcomeScreen from '@/components/onboarding/WelcomeScreen';
import HelpUsImprove from '@/components/pilot/HelpUsImprove';
import CheckInCard from '@/components/pilot/CheckInCard';
import CheckInForm from '@/components/pilot/CheckInForm';
import { loadMyCheckIns } from '@/components/pilot/checkInData';
import { openCheckIn } from '@/lib/pilotCheckIns';
import { shouldShowPilotIntro, isCheckInSnoozed, snoozeCheckIn } from '@/lib/pilot';
import { loadPlanSettings } from '@/lib/planSettings';
import { useAuth } from '@/lib/AuthContext';
import useAppLanguage, { isRTL } from '@/hooks/useAppLanguage';

// Set once the learner answers or skips "Help us improve Pathways", so the
// screen doesn't come back before Layout reloads the account.
let pilotAnswered = false;
// Same for a check-in answered, put off or stopped.
let checkInsHandled = false;

// Home. Learners see Today (a navy top with the road, a cream sheet with what
// to do; full width, see SPLIT_ROUTES in Layout.jsx) and nothing else: the
// rest of the app is one tap away in the tab bar.
// Signed-out visitors see Welcome (Prompt 9). The language menu is in the header.
export default function Home({ cachedUser }) {
  const [language] = useAppLanguage();
  const rtl = isRTL(language);
  // (Auth is known before pages render, so signed-in users never see Welcome.)
  const { isAuthenticated } = useAuth();
  const learner = isAuthenticated && cachedUser;
  // "Help us improve Pathways" (optional pilot questions): once, after the
  // learner's first day, instead of Today.
  const [pilotDone, setPilotDone] = useState(pilotAnswered);
  const askPilot = learner && !pilotDone && shouldShowPilotIntro({ user: cachedUser, hasPlan: !!loadPlanSettings() });

  // A 3-, 6- or 12-month check-in that is due: a card at the top of Today,
  // which opens the check-in screen. 'card' | 'form' | 'hidden'.
  const [checkIn, setCheckIn] = useState(null); // { kind, rows }
  const [checkInView, setCheckInView] = useState('card');
  useEffect(() => {
    if (!learner || askPilot || checkInsHandled || isCheckInSnoozed()) return;
    let active = true;
    loadMyCheckIns(cachedUser.email)
      .then((rows) => {
        const kind = openCheckIn({ user: cachedUser, rows });
        if (active && kind) setCheckIn({ kind, rows });
      })
      .catch(() => {});
    return () => { active = false; };
  }, [learner, askPilot, cachedUser]);
  const closeCheckIn = () => { checkInsHandled = true; setCheckInView('hidden'); };
  const notNow = () => { snoozeCheckIn(); closeCheckIn(); };
  const never = () => {
    closeCheckIn();
    auth.updateMe({ checkins_stopped: true }).catch(() => {});
  };

  // Signed in, Home has the full width (Layout leaves out its padding), so
  // screens other than Today bring their own.
  const padded = 'container mx-auto px-4 pt-6 pb-8 max-w-5xl';

  // Signed in but the account is still loading: wait rather than flash Welcome.
  if (isAuthenticated && !cachedUser) {
    return <div className="min-h-[60vh]" aria-busy="true" />;
  }

  if (askPilot) {
    return (
      <div className={padded} dir={rtl ? 'rtl' : 'ltr'}>
        <HelpUsImprove user={cachedUser} language={language} onDone={() => { pilotAnswered = true; setPilotDone(true); }} />
      </div>
    );
  }

  if (learner && checkIn && checkInView === 'form') {
    return (
      <div className={padded} dir={rtl ? 'rtl' : 'ltr'}>
        <CheckInForm kind={checkIn.kind} rows={checkIn.rows} user={cachedUser} language={language} onDone={closeCheckIn} onNotNow={notNow} />
      </div>
    );
  }

  if (learner) {
    return (
      <div dir={rtl ? 'rtl' : 'ltr'}>
        <TodayPage
          user={cachedUser}
          quickCheckFirst={!cachedUser.skill_levels}
          sheetTop={checkIn && checkInView === 'card' && (
            <CheckInCard language={language} onOpen={() => setCheckInView('form')} onNotNow={notNow} onNever={never} />
          )}
        />
      </div>
    );
  }

  // Signed-out visitors: Welcome (Prompt 9, frame R30Welcome).
  return <WelcomeScreen />;
}
