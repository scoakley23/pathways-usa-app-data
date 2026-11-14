import React from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, X } from 'lucide-react';
import { auth, AUTH_PROVIDER } from '@/api/auth';
import { CODE_LENGTH, cleanCode, safeNext } from '@/api/supabaseAuth';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Button, Card } from '@/components/pathways/ui';
import LanguageSelector from '@/components/lessons/LanguageSelector';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { isRTL } from '@/hooks/useAppLanguage';
import { SIGN_IN_CACHE_KEY, SIGN_IN_STRINGS, fill } from './signInStrings';

// /sign-in: two short steps. 1) type your email, get a 6-digit code;
// 2) type the code. ?next= is where to go after (inside the app only);
// ?reason=expired says the login ended by itself. A first sign-in goes to
// Getting started and the quick check, as before.
const INPUT = 'w-full min-h-tap rounded-button border border-line bg-white px-4 py-3 text-navy text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy';

function ErrorLine({ children }) {
  return (
    <p role="alert" className="flex items-start gap-2 text-base font-semibold text-not-yet">
      <span className="mt-0.5 w-5 h-5 shrink-0 rounded-full bg-not-yet text-white grid place-items-center" aria-hidden="true">
        <X className="w-3.5 h-3.5" strokeWidth={3} />
      </span>
      <span className="min-w-0 break-words">{children}</span>
    </p>
  );
}

export default function SignInScreen() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = safeNext(params.get('next') || '/');
  const expired = params.get('reason') === 'expired';
  const [language, setLanguage] = useAppLanguage();
  const tr = useTranslatedLines(SIGN_IN_STRINGS, language, { cacheKey: SIGN_IN_CACHE_KEY });
  const t = (key) => tr(key) || SIGN_IN_STRINGS[key];

  const [step, setStep] = React.useState('email');
  const [email, setEmail] = React.useState('');
  const [code, setCode] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [notice, setNotice] = React.useState(null);
  const [wait, setWait] = React.useState(0);
  const codeRef = React.useRef(null);

  // Base44's login has its own hosted page.
  React.useEffect(() => {
    if (AUTH_PROVIDER !== 'supabase') auth.goToSignIn(next);
  }, [next]);

  // Already signed in: go on.
  React.useEffect(() => {
    if (AUTH_PROVIDER !== 'supabase') return;
    auth.me().then(() => navigate(next, { replace: true })).catch(() => {});
  }, [navigate, next]);

  // The "Send a new code" countdown.
  React.useEffect(() => {
    if (step !== 'code') return undefined;
    setWait(auth.resendWait());
    const id = setInterval(() => setWait(auth.resendWait()), 1000);
    return () => clearInterval(id);
  }, [step]);

  React.useEffect(() => { if (step === 'code') codeRef.current?.focus(); }, [step]);

  const sendCode = async (e) => {
    e?.preventDefault();
    if (busy) return;
    setBusy(true); setError(null); setNotice(null);
    const res = await auth.sendCode(email);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    if (step === 'code') { setNotice(t('newCodeSent')); setCode(''); codeRef.current?.focus(); }
    setStep('code');
    setWait(auth.resendWait());
  };

  const verify = async (value = code) => {
    if (busy) return;
    setBusy(true); setError(null); setNotice(null);
    const res = await auth.verifyCode(email, value);
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    navigate(res.firstSignIn ? '/quick-check' : next, { replace: true });
  };

  const onCodeChange = (e) => {
    const value = cleanCode(e.target.value);
    setCode(value);
    setError(null);
    if (value.length === CODE_LENGTH) verify(value);
  };

  // Right-to-left once the words are in that language (English stays left-to-right).
  const dir = isRTL(language) && tr('title') ? 'rtl' : 'ltr';
  if (AUTH_PROVIDER !== 'supabase') return null;

  return (
    <div dir={dir} className="min-h-screen bg-page text-navy font-sans flex flex-col">
      <NavyBanner
        title={step === 'email' ? t('title') : t('checkTitle')}
        subtitle="Pathways USA"
        left={(
          <Link to="/" aria-label={t('back')} className="min-w-tap min-h-tap inline-flex items-center justify-center rounded-full text-white hover:bg-chip-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
            <ArrowLeft className="w-6 h-6 rtl:rotate-180" strokeWidth={2} aria-hidden="true" />
          </Link>
        )}
        right={<LanguageSelector language={language} onLanguageChange={setLanguage} compact onNavy />}
      />

      <main id="main" className="flex-1 w-full max-w-md mx-auto px-4 py-6 flex flex-col gap-4">
        {expired && step === 'email' && (
          <p role="status" className="rounded-card bg-tint px-4 py-3 text-base text-navy">{t('expiredNote')}</p>
        )}

        <Card className="flex flex-col gap-4">
          {step === 'email' ? (
            <form onSubmit={sendCode} className="flex flex-col gap-4" noValidate>
              <p className="text-base text-navy">{t('intro')}</p>
              <label className="flex flex-col gap-2">
                <span className="text-base font-semibold">{t('emailLabel')}</span>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  dir="ltr"
                  required
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  aria-invalid={Boolean(error)}
                  className={INPUT}
                />
              </label>
              {error && <ErrorLine>{t(error)}</ErrorLine>}
              <Button type="submit" variant="main" className="w-full" disabled={busy || !email.trim()}>
                {busy ? t('sending') : t('sendCode')}
              </Button>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verify(); }} className="flex flex-col gap-4" noValidate>
              <p className="text-base text-navy break-words">
                {(() => {
                  const [before, after = ''] = t('sentTo').split('{name}');
                  return <>{before}<bdi dir="ltr" className="font-semibold">{email.trim()}</bdi>{after}</>;
                })()}
              </p>
              <p className="text-small text-muted">{t('sentHelp')}</p>
              <label className="flex flex-col gap-2">
                <span className="text-base font-semibold">{t('codeLabel')}</span>
                <input
                  ref={codeRef}
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]*"
                  maxLength={CODE_LENGTH}
                  dir="ltr"
                  value={code}
                  onChange={onCodeChange}
                  aria-invalid={Boolean(error)}
                  className={`${INPUT} text-center text-[28px] font-bold tracking-[0.4em]`}
                />
              </label>
              {error && <ErrorLine>{t(error)}</ErrorLine>}
              {notice && <p role="status" className="text-base text-navy">{notice}</p>}
              <Button type="submit" variant="main" className="w-full" disabled={busy || code.length !== CODE_LENGTH}>
                {busy ? t('checking') : t('signIn')}
              </Button>
              <div className="flex flex-col items-center gap-1">
                <Button variant="link" onClick={sendCode} disabled={busy || wait > 0}>
                  {wait > 0 ? fill(t('resendIn'), String(wait)) : t('resend')}
                </Button>
                <Button variant="link" onClick={() => { setStep('email'); setCode(''); setError(null); setNotice(null); }}>
                  {t('otherEmail')}
                </Button>
              </div>
            </form>
          )}
        </Card>

        <p className="mt-auto pt-4 text-center text-small text-muted">{t('footer')}</p>
      </main>
    </div>
  );
}
