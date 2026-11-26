import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Card } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { ERROR_PAGE_LINES } from '@/components/shell/leftoverStrings';

// Shown when the signed-in account isn't registered for the app (Amio v2,
// amio-v2/leftovers: a paper page with the title, what to do, and a white
// card of things to try). Wording in ERROR_PAGE_LINES (pack set "error-pages").
const UserNotRegisteredError = () => {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(ERROR_PAGE_LINES, language, { cacheKey: 'error_pages_v1' });
  const t = (key) => (language !== 'en' && tr(key)) || ERROR_PAGE_LINES[key] || key;
  return (
    <div dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'} className="min-h-screen bg-paper text-navy">
      <main id="main" className="mx-auto max-w-md px-4 pt-10 pb-8 flex flex-col gap-5">
        <AlertTriangle className="w-8 h-8 text-not-yet" aria-hidden="true" />
        <h1 className="font-display text-[2rem] leading-tight" dir="auto">{t('restricted')}</h1>
        <p className="text-lg text-muted" dir="auto">{t('restricted_body')}</p>
        <Card padding="p-4" className="text-base">
          <p dir="auto">{t('restricted_try')}</p>
          <ul className="list-disc ps-5 mt-2 space-y-1 text-muted">
            <li dir="auto">{t('restricted_1')}</li>
            <li dir="auto">{t('restricted_2')}</li>
            <li dir="auto">{t('restricted_3')}</li>
          </ul>
        </Card>
      </main>
    </div>
  );
};

export default UserNotRegisteredError;
