import React, { useState } from 'react';
import { auth } from '@/api/auth';
import { Amio } from '@/components/pathways/Amio';
import { Button, PathwaysLockup } from '@/components/pathways/ui';
import { rememberProgramCode } from '@/lib/programLink';
import useOnboardingText from '@/components/onboarding/useOnboardingText';

// Welcome (Prompt 9, frame R30Welcome): what signed-out visitors see on Home.
// "Get started" signs them in and goes on to Getting started and the quick
// check. "I have a code from my tutor" keeps a partner program's code on the
// device (like a /?program=CODE link) through the sign-in, so the program
// question starts with it picked. Nothing else is asked or saved here.

const NEXT = '/quick-check';

export default function WelcomeScreen() {
  const { t, rtl } = useOnboardingText();
  const [codeOpen, setCodeOpen] = useState(false);
  const [code, setCode] = useState('');
  const [bad, setBad] = useState(false);

  const start = () => auth.goToSignIn(NEXT);
  const useCode = (e) => {
    e.preventDefault();
    if (!rememberProgramCode(code)) { setBad(true); return; }
    auth.goToSignIn(NEXT);
  };

  return (
    <section dir={rtl ? 'rtl' : 'ltr'} aria-labelledby="welcome-title" className="min-h-[calc(100vh-64px)] bg-navy text-white px-4 pt-6 pb-8 flex flex-col">
      <div className="flex-1 max-w-md w-full mx-auto flex flex-col items-center text-center gap-4">
        <PathwaysLockup layout="stacked" size={56} tone="navy" />
        <Amio mood="wave" size={112} onNavy />
        <h1 id="welcome-title" className="text-[26px] font-bold leading-snug">{t('welcome_tagline')}</h1>
        <p className="text-base text-on-navy">{t('welcome_free')}</p>
      </div>
      <div className="max-w-md w-full mx-auto flex flex-col gap-3 pt-6">
        {!codeOpen ? (
          <>
            <Button variant="main" onNavy className="w-full" onClick={start}>{t('get_started')}</Button>
            <Button variant="second" onNavy className="w-full min-h-[52px]" onClick={() => setCodeOpen(true)}>{t('have_code')}</Button>
          </>
        ) : (
          <form onSubmit={useCode} className="rounded-card bg-white text-navy p-5 flex flex-col gap-3 text-start">
            <h2 className="text-lg font-bold">{t('code_title')}</h2>
            <p id="welcome-code-help" className="text-base text-muted">{t('code_help')}</p>
            <label htmlFor="welcome-code" className="text-base font-semibold">{t('code_label')}</label>
            <input
              id="welcome-code"
              value={code}
              onChange={(e) => { setCode(e.target.value); setBad(false); }}
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={40}
              dir="ltr"
              aria-describedby="welcome-code-help"
              aria-invalid={bad}
              className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-lg font-bold uppercase tracking-wide focus:outline-none focus:ring-2 focus:ring-denim"
            />
            {bad && <p role="alert" className="text-base font-semibold text-not-yet">{t('code_bad')}</p>}
            <Button variant="main" type="submit" className="w-full" disabled={!code.trim()}>{t('code_continue')}</Button>
            <Button variant="link" type="button" className="self-center" onClick={() => { setCodeOpen(false); setBad(false); }}>{t('cancel')}</Button>
          </form>
        )}
      </div>
    </section>
  );
}
