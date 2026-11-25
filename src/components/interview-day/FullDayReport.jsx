import React from 'react';
import { Link } from 'react-router-dom';
import { Check, ChevronRight } from 'lucide-react';
import { Amio } from '@/components/pathways/Amio';
import { Button } from '@/components/pathways/ui';

// The whole day's report (Amio v2, the report look): one row per part,
// "Passed" with a check or "Not yet" in words (never color alone, never red),
// "Work on next" links to that Practice run, and "Nothing is saved".
export default function FullDayReport({ t, rows, onAgain, onBack }) {
  const notYet = rows.filter((r) => !r.passed);
  return (
    <div className="min-h-screen bg-paper text-navy">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-10 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <Amio mood={notYet.length ? 'kind' : 'proud'} size={64} className="shrink-0" />
          <h1 className="font-display text-[2.25rem] leading-none tracking-tight" dir="auto">{t('report_title')}</h1>
        </div>
        <p className="text-base text-muted" dir="auto">{t('report_sub')}</p>

        <ul className="rounded-card bg-white border-[1.5px] border-line overflow-hidden divide-y divide-line list-none m-0 p-0">
          {rows.map((r) => (
            <li key={r.skill} className="min-h-[3.5rem] px-4 py-3 flex items-center gap-3">
              <span className="flex-1 min-w-0 text-base font-bold" dir="auto">{t(`row_${r.skill}`)}</span>
              {r.passed ? (
                <span className="inline-flex items-center gap-1.5 text-base font-bold text-correct">
                  <Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" />{t('passed')}
                </span>
              ) : (
                <span className="text-base font-bold text-muted">{t('not_yet')}</span>
              )}
            </li>
          ))}
        </ul>

        {notYet.length > 0 && (
          <section aria-labelledby="day-work-on" className="flex flex-col gap-2">
            <h2 id="day-work-on" className="text-lg font-bold">{t('work_on')}</h2>
            <div className="rounded-card bg-white border-[1.5px] border-line overflow-hidden divide-y divide-line">
              {notYet.map((r) => (
                <Link key={r.skill} to={r.practicePath} className="min-h-[3.25rem] px-4 py-2 flex items-center gap-3 text-base font-semibold text-navy hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim">
                  <span className="flex-1 min-w-0" dir="auto">{t('practice_link', { part: t(`row_${r.skill}`) })}</span>
                  <ChevronRight className="w-5 h-5 shrink-0 text-muted rtl:rotate-180" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </section>
        )}

        <Button variant="main" className="w-full" onClick={onAgain}>{t('again')}</Button>
        <Link to="/interview" onClick={onBack} className="self-center min-h-tap inline-flex items-center px-2 text-base font-semibold text-denim underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">{t('back_interview')}</Link>
      </div>
    </div>
  );
}
