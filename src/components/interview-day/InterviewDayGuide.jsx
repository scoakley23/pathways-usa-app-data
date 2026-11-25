import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { dayGuideSteps } from '@/lib/interviewDay';
import { YOU_CAN_SAY } from './interviewDayStrings';

// "What happens on the day" (Amio v2): the six steps (numbers from
// src/lib/interviewDay.js, never typed into the text), then what to bring,
// what you can always say, and what happens after. General education only:
// nothing here tells a learner how to answer about their own life or whether
// they are eligible.
function Bullets({ items }) {
  return (
    <ul className="space-y-2 list-none m-0 p-0">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-navy mt-2.5 shrink-0" aria-hidden="true" />
          <span dir="auto">{item}</span>
        </li>
      ))}
    </ul>
  );
}

const ROW_LINK = 'min-h-[3.25rem] px-4 py-2 flex items-center gap-3 text-base font-semibold text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim';

export default function InterviewDayGuide({ t, version = '2025' }) {
  return (
    <section aria-label={t('title')} className="flex flex-col gap-4 text-navy">
      <ol className="flex flex-col gap-2 list-none m-0 p-0">
        {dayGuideSteps(version).map((step, i) => (
          <li key={step.key} className="rounded-card bg-white border-[1.5px] border-line p-4 flex items-start gap-4">
            <span className="w-10 h-10 shrink-0 rounded-button bg-navy text-white grid place-items-center text-lg font-bold" aria-hidden="true">{i + 1}</span>
            <div className="min-w-0">
              <p className="text-lg font-bold" dir="auto">{t(`step_${step.key}`)}</p>
              <p className="text-base text-muted" dir="auto">{t(`step_${step.key}_body`, step.vars)}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="text-base text-muted" dir="auto">{t('order_note')}</p>

      <div className="rounded-card bg-sky-soft p-4">
        <h2 className="text-base font-bold" dir="auto">{t('ask_title')}</h2>
        <p className="text-base" dir="auto">{t('ask_intro')}</p>
        <ul className="mt-1 list-none m-0 p-0">
          {YOU_CAN_SAY.map((line) => <li key={line} className="text-base font-bold" lang="en" dir="ltr">{line}</li>)}
        </ul>
      </div>

      <div className="rounded-card bg-white border-[1.5px] border-line p-4 flex flex-col gap-2">
        <h2 className="text-base font-bold" dir="auto">{t('before_title')}</h2>
        <Bullets items={[1, 2, 3, 4, 5].map((n) => t(`before_${n}`))} />
      </div>

      <div className="rounded-card bg-white border-[1.5px] border-line p-4 flex flex-col gap-2">
        <h2 className="text-base font-bold" dir="auto">{t('after_title')}</h2>
        <Bullets items={[1, 2, 3].map((n) => t(`after_${n}`))} />
      </div>

      <div className="rounded-card bg-white border-[1.5px] border-line overflow-hidden">
        <div className="p-4">
          <h2 className="text-base font-bold" dir="auto">{t('own_case_title')}</h2>
          <p className="text-base text-muted" dir="auto">{t('own_case_body')}</p>
        </div>
        <div className="divide-y divide-line border-t border-line">
          <Link to="/lawyer-first" className={ROW_LINK}><span className="flex-1">{t('lawyer')}</span><ChevronRight className="w-5 h-5 text-muted rtl:rotate-180" aria-hidden="true" /></Link>
          <Link to="/resources" className={ROW_LINK}><span className="flex-1">{t('help_near')}</span><ChevronRight className="w-5 h-5 text-muted rtl:rotate-180" aria-hidden="true" /></Link>
        </div>
      </div>
    </section>
  );
}
