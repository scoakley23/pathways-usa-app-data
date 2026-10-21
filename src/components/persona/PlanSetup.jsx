import React, { useMemo, useState } from 'react';
import { CalendarDays, ExternalLink } from 'lucide-react';
import TutorMessage from './TutorMessage';
import useTodayText from './useTodayText';
import { PrimaryButton, SecondaryButton, RaisedCard } from '@/components/pathways/ui';
import { savePlanChoice } from '@/lib/planSettings';

const PROCESSING_TIMES = 'https://egov.uscis.gov/processing-times/';

// "When is your interview, or when do you hope to be ready?" The answer is
// saved only on this device. Never asks which office or anything about the
// learner's case.
export default function PlanSetup({ profile, language, again = false, onDone }) {
  const { t, en, mine } = useTodayText(language);
  const [picking, setPicking] = useState(false);
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 18 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString(language === 'en' ? 'en-US' : language, { month: 'long', year: 'numeric' });
      return { value, label };
    });
  }, [language]);
  const [month, setMonth] = useState(months[2].value);

  const choose = (choice) => onDone(savePlanChoice(choice));
  const key = again ? 'plan_ask_again' : 'plan_ask';

  return (
    <div className="space-y-4 text-pw-navy">
      <TutorMessage profile={profile} language={language} mine={mine(key)} en={en(key)} />
      <RaisedCard className="space-y-3">
        {!picking ? (
          <PrimaryButton large className="w-full" onClick={() => setPicking(true)}>
            <CalendarDays className="w-5 h-5" aria-hidden="true" /> {t('pick_month')}
          </PrimaryButton>
        ) : (
          <div className="space-y-2">
            <label htmlFor="plan-month" className="block font-bold">{t('month_label')}</label>
            <select
              id="plan-month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="w-full min-h-[48px] rounded-2xl border border-pw-line bg-white px-4 text-base text-pw-navy focus:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy/30"
            >
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <PrimaryButton large className="w-full" onClick={() => choose({ mode: 'date', month })}>{t('use_month')}</PrimaryButton>
          </div>
        )}
        <SecondaryButton className="w-full flex-col !items-center py-2" onClick={() => choose({ mode: 'unknown' })}>
          <span>{t('dont_know')}</span>
          <span className="text-sm font-semibold text-pw-muted">{t('dont_know_note')}</span>
        </SecondaryButton>
        <SecondaryButton className="w-full border-pw-line" onClick={() => choose({ mode: 'study' })}>{t('just_study')}</SecondaryButton>
        <p className="text-sm text-pw-muted">{t('date_note')}</p>
        <a
          href={PROCESSING_TIMES}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 min-h-11 text-base font-bold text-pw-navy underline underline-offset-4 decoration-pw-red/60 hover:decoration-pw-red"
        >
          {t('processing')} <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </RaisedCard>
    </div>
  );
}
