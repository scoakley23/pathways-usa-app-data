import React, { useState } from 'react';
import { auth } from '@/api/auth';
import { Amio } from '@/components/pathways/Amio';
import { Button, MAIN_PRESS } from '@/components/pathways/ui';
import { rememberProgramCode } from '@/lib/programLink';
import useOnboardingText from '@/components/onboarding/useOnboardingText';

// Welcome (Amio v2, frame OnboardWelcome): what signed-out visitors see on
// Home. "Hi, I'm Amio." with hellos in a few languages, Start (signs them in,
// then first open and the quick check) and "I have a code from my tutor",
// which keeps a partner program's code on the device (like a /?program=CODE
// link) through the sign-in, so the program question starts with it picked.
// Nothing else is asked or saved here.

// Decorative hellos (frame OnboardWelcome), each in its own language.
const HELLOS = [
  { text: 'Hola', lang: 'es', className: 'start-[6%] top-[8%] bg-white text-navy -rotate-[4deg]' },
  { text: 'Xin chào', lang: 'vi', className: 'end-[7%] top-[30%] bg-sky text-navy rotate-[3deg]' },
  { text: 'Bonjou', lang: 'ht', className: 'start-[10%] top-[58%] bg-gold text-navy rotate-[2deg]' },
  { text: '你好', lang: 'zh', className: 'end-[12%] top-[72%] bg-white text-navy -rotate-[3deg]' },
  { text: 'مرحبا', lang: 'ar', className: 'start-[38%] top-[40%] bg-denim text-white -rotate-[2deg]', dir: 'rtl' },
];

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
    <section dir={rtl ? 'rtl' : 'ltr'} aria-labelledby="welcome-title" className="min-h-[calc(100vh-64px)] bg-navy text-white px-5 pt-4 pb-8 flex flex-col">
      <div className="flex-1 max-w-md w-full mx-auto flex flex-col items-center text-center">
        <div className="relative w-full h-44" aria-hidden="true">
          {HELLOS.map((h) => (
            <span key={h.lang} lang={h.lang} dir={h.dir} className={`absolute rounded-button px-3 py-2 text-base font-bold ${h.className}`}>{h.text}</span>
          ))}
        </div>
        <Amio mood="speaking" size={176} onNavy />
        <h1 id="welcome-title" className="mt-4 font-display text-[2.5rem] leading-none tracking-tight">{t('welcome_hi')}</h1>
        <p className="mt-3 text-[1.0625rem] leading-snug text-sky">{t('welcome_sub')}</p>
      </div>
      <div className="max-w-md w-full mx-auto flex flex-col gap-3 pt-6">
        {!codeOpen ? (
          <>
            <button
              type="button"
              onClick={start}
              className={`w-full min-h-main mb-[5px] rounded-button bg-gold px-6 text-lg font-extrabold text-navy ${MAIN_PRESS} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-navy`}
            >
              {t('start')}
            </button>
            <button type="button" onClick={() => setCodeOpen(true)} className="self-center min-h-tap px-2 text-[0.9375rem] text-sky underline underline-offset-4 decoration-sky/60 hover:decoration-sky rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">{t('have_code')}</button>
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
        <p className="mt-2 text-center text-small text-on-navy">{t('public_line')}</p>
      </div>
    </section>
  );
}
