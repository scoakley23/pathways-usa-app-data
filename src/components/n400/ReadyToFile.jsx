import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Search } from 'lucide-react';
import useAppLanguage from '@/hooks/useAppLanguage';
import useHomeTranslation from '@/hooks/useHomeTranslation';

// "Ready to file?": where to apply and check a case (uscis.gov), with "Talk
// to a lawyer first". Lives at the end of the N-400 guide (#ready-to-file;
// the N-400 coach links here when it ends).
export default function ReadyToFile() {
  const [language] = useAppLanguage();
  const { t } = useHomeTranslation(language);
  const btn = 'min-h-[48px] rounded-full font-semibold text-base inline-flex items-center justify-center gap-2 px-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2';
  return (
    <section id="ready-to-file" aria-labelledby="ready-title" className="scroll-mt-24 text-pw-navy">
      <span className="ml-4 inline-block rounded-t-lg bg-pw-navy px-3 py-1 text-sm font-semibold text-white">When you’re ready</span>
      <div className="rounded-[14px] bg-white border border-pw-line shadow-raised p-5 sm:p-6 space-y-3">
        <h2 id="ready-title" className="font-display text-[30px] leading-tight">{t('ready_title')}</h2>
        <p className="text-base text-pw-muted max-w-xl">{t('ready_body')}</p>
        <p className="text-base">
          <Link to="/lawyer-first" className="font-semibold underline underline-offset-4 decoration-pw-navy/40 hover:decoration-pw-navy">
            {t('ready_lawyer')}
          </Link>
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <a href="https://www.uscis.gov/citizenship/apply-for-naturalization" target="_blank" rel="noopener noreferrer" className={`${btn} bg-pw-navy text-white hover:bg-pw-navy-deep`}>
            <FileText className="w-5 h-5" aria-hidden="true" /> {t('btn_apply')}
          </a>
          <a href="https://egov.uscis.gov/casestatus/landing.do" target="_blank" rel="noopener noreferrer" className={`${btn} bg-white border-2 border-pw-navy hover:bg-pw-soft`}>
            <Search className="w-5 h-5" aria-hidden="true" /> {t('btn_case')}
          </a>
        </div>
      </div>
    </section>
  );
}
