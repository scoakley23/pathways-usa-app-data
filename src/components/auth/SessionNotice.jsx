import React from 'react';
import { useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { isRTL } from '@/hooks/useAppLanguage';
import { SIGN_IN_CACHE_KEY, SIGN_IN_STRINGS } from './signInStrings';

// When a login ends by itself (renewal failed, or signed out on another
// device), the page keeps working as signed out and this small notice offers
// "Sign in again". No broken page, no forced jump.
export default function SessionNotice() {
  const { sessionExpired, dismissSessionExpired, navigateToLogin } = useAuth();
  const location = useLocation();
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(SIGN_IN_STRINGS, language, { cacheKey: SIGN_IN_CACHE_KEY });
  const t = (key) => tr(key) || SIGN_IN_STRINGS[key];
  if (!sessionExpired || location.pathname === '/sign-in') return null;

  return (
    <div
      role="status"
      dir={isRTL(language) && tr('signedOutNotice') ? 'rtl' : 'ltr'}
      className="fixed inset-x-0 bottom-0 z-[70] p-4 flex justify-center pointer-events-none"
    >
      <div className="pointer-events-auto w-full max-w-md rounded-card bg-white border border-line shadow-float p-4 flex items-center gap-3">
        <p className="flex-1 min-w-0 text-base text-navy break-words">{t('signedOutNotice')}</p>
        <Button
          variant="next"
          onClick={() => { dismissSessionExpired(); navigateToLogin(`${location.pathname}${location.search}`, 'expired'); }}
        >
          {t('signInAgain')}
        </Button>
        <button
          type="button"
          onClick={dismissSessionExpired}
          aria-label={t('close')}
          className="min-w-tap min-h-tap inline-flex items-center justify-center rounded-full text-navy hover:bg-tint focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
        >
          <X className="w-5 h-5" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
