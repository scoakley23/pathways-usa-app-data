import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck, ChevronRight, FileText, MessagesSquare, Mic } from 'lucide-react';
import NavyBanner from '@/components/pathways/NavyBanner';
import { Card } from '@/components/pathways/ui';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { INTERVIEW_LINKS } from '@/lib/shellRoutes';

// The Interview tab (/interview): the practice interview, the interview-day
// guide, the N-400 guide and the N-400 coach, as they are today. Prompt 10
// gives it the "Are you ready?" look (frame R30Interview).
const ICONS = { mock: Mic, day: CalendarCheck, n400: FileText, coach: MessagesSquare };

const LINES = {
  title: 'Interview',
  subtitle: 'Practice for the day of your interview.',
  ...Object.fromEntries(INTERVIEW_LINKS.flatMap((l) => [[`${l.id}_label`, l.label], [`${l.id}_body`, l.body]])),
};

export default function InterviewPage() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(LINES, language, { cacheKey: 'interview_tab_v1' });
  const t = (key) => (language !== 'en' && tr(key)) || LINES[key];
  return (
    <div dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'}>
      <NavyBanner title={t('title')} subtitle={t('subtitle')} />
      <ul className="max-w-lg mx-auto px-4 py-5 space-y-3">
        {INTERVIEW_LINKS.map((l) => {
          const Icon = ICONS[l.id];
          return (
            <li key={l.id}>
              <Link to={l.path} className="block rounded-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2">
                <Card padding="p-4" className="flex items-center gap-4 hover:border-denim">
                  <span className="w-12 h-12 shrink-0 rounded-full bg-navy text-white grid place-items-center" aria-hidden="true">
                    <Icon className="w-6 h-6" strokeWidth={2} />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-base font-bold text-navy">{t(`${l.id}_label`)}</span>
                    <span className="block text-small text-muted mt-0.5">{t(`${l.id}_body`)}</span>
                  </span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
                </Card>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
