import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { tabFor } from './n400Tabs';
import useN400GuideText from './useN400GuideText';

// "See the form": what the paper N-400 looks like for the parts the guide
// covers, always BLANK. The form's words come verbatim from n400Content.js
// (approved items only, as in the guide); the boxes stay empty and nothing is
// typed, picked or saved. "What it asks" opens that section in the guide.
// No example people and no example answers anywhere.

export default function N400BlankForm({ sections, isAdmin = false, onOpenSection }) {
  const { t } = useN400GuideText();
  const YES_NO = [t('yes'), t('no')];
  const TRIP_COLUMNS = [t('trip_left'), t('trip_returned'), t('trip_countries')];
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const section = sections.find((s) => s.id === activeId) || sections[0];
  const items = isAdmin ? section.questions : section.questions.filter((q) => q.status === 'approved');
  const isTrips = section.id === 'time-outside-us';

  return (
    <div className="space-y-5 text-navy">
      <div role="group" aria-label={t('form_part')} className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const on = s.id === section.id;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => setActiveId(s.id)}
              className={`min-h-11 rounded-button border-[1.5px] px-4 text-base font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${on ? 'bg-navy border-navy text-white' : 'bg-white border-line text-navy hover:border-navy'}`}
            >
              <span dir="auto">{t(`tab_${s.id}`) || tabFor(s).label}</span>
            </button>
          );
        })}
      </div>

      {/* One blank page of the form */}
      <section aria-label={t('form_blank_label', { title: section.title })} className="rounded-card bg-white border p-4 sm:p-6 border-line space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-navy pb-2">
          <h2 className="text-base sm:text-lg font-bold" lang="en" dir="ltr">{section.partLabel} · {section.title}</h2>
          <span className="text-small text-muted" dir="auto">{t('form_blank')}</span>
        </div>
        {items.length === 0 ? (
          <p className="font-sans text-base text-muted" dir="auto">{t('form_preparing')}</p>
        ) : items.map((q) => (
          <div key={q.id} className="space-y-3 border-b border-dashed border-line pb-4 last:border-0 last:pb-0">
            <p className="text-base sm:text-lg leading-relaxed" lang="en" dir="ltr"><span className="font-bold">{q.label}.</span> {q.official}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {isTrips ? (
                <div className="w-full overflow-x-auto" aria-hidden="true">
                  <div className="grid min-w-[264px] grid-cols-3 border border-navy text-xs sm:text-sm">
                    {TRIP_COLUMNS.map((c) => <span key={c} className="border-e border-navy [&:nth-child(3n)]:border-e-0 px-2 py-1.5 font-bold">{c}</span>)}
                    {Array.from({ length: 9 }, (_, k) => <span key={k} className="h-8 border-t border-e border-navy [&:nth-child(3n)]:border-e-0" />)}
                  </div>
                </div>
              ) : (
                <span className="flex gap-4 text-base" aria-hidden="true">
                  {YES_NO.map((w) => (
                    <span key={w} className="inline-flex items-center gap-2"><span className="inline-block w-4 h-4 border-[1.5px] border-navy" />{w}</span>
                  ))}
                </span>
              )}
              <button
                type="button"
                onClick={() => onOpenSection(section.id)}
                className="font-sans min-h-11 rounded-button bg-line-soft px-4 text-base font-semibold inline-flex items-center gap-1.5 hover:bg-line focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
              >
                <span dir="auto">{t('what_asks')}</span> <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="space-y-2 text-base leading-relaxed">
        <p dir="auto">{t('form_help')}</p>
        <p className="text-muted" dir="auto">{t('form_other')}</p>
        <Link to="/lawyer-first" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 decoration-navy/40 hover:decoration-navy">
          <span dir="auto">{t('lawyer_title')}</span>
        </Link>
      </div>
    </div>
  );
}
