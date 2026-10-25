import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { tabFor, SECTION_BORDER, SECTION_SOLID } from './N400Folder';

// "See the form": what the paper N-400 looks like for the parts the guide
// covers, always BLANK. The form's words come verbatim from n400Content.js
// (approved items only, as in the guide); the boxes stay empty and nothing is
// typed, picked or saved. "What it asks" opens that section in the guide.
// No example people and no example answers anywhere.
const YES_NO = ['Yes', 'No'];
const TRIP_COLUMNS = ['Date you left', 'Date you returned', 'Countries you traveled to'];

export default function N400BlankForm({ sections, isAdmin = false, onOpenSection }) {
  const [activeId, setActiveId] = useState(sections[0]?.id);
  const section = sections.find((s) => s.id === activeId) || sections[0];
  const items = isAdmin ? section.questions : section.questions.filter((q) => q.status === 'approved');
  const isTrips = section.id === 'time-outside-us';

  return (
    <div className="space-y-5 text-pw-navy">
      <div role="group" aria-label="Part of the form" className="flex flex-wrap gap-2">
        {sections.map((s) => {
          const tone = tabFor(s).tone;
          const on = s.id === section.id;
          return (
            <button
              key={s.id}
              type="button"
              aria-pressed={on}
              onClick={() => setActiveId(s.id)}
              className={`min-h-11 rounded-full border-2 px-4 text-[15px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${SECTION_BORDER[tone]} ${on ? SECTION_SOLID[tone] : 'bg-white text-pw-navy hover:bg-pw-soft'}`}
            >
              {tabFor(s).label}
            </button>
          );
        })}
      </div>

      {/* One blank page of the form */}
      <section aria-label={`Blank form: ${section.title}`} className="rounded-[4px] bg-white border border-pw-rule p-4 sm:p-6 shadow-[0_6px_18px_rgba(20,38,74,0.12)] font-form space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b-2 border-pw-navy pb-2">
          <h2 className="text-base sm:text-lg font-bold">{section.partLabel} · {section.title}</h2>
          <span className="text-sm text-pw-muted">BLANK · NOTHING IS SAVED</span>
        </div>
        {items.length === 0 ? (
          <p className="font-sans text-base text-pw-muted">This part of the guide is still being prepared.</p>
        ) : items.map((q) => (
          <div key={q.id} className="space-y-3 border-b border-dashed border-pw-rule pb-4 last:border-0 last:pb-0">
            <p className="text-base sm:text-lg leading-relaxed"><span className="font-bold">{q.label}.</span> {q.official}</p>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {isTrips ? (
                <div className="w-full overflow-x-auto" aria-hidden="true">
                  <div className="grid min-w-[264px] grid-cols-3 border border-pw-navy text-xs sm:text-sm">
                    {TRIP_COLUMNS.map((c) => <span key={c} className="border-e border-pw-navy [&:nth-child(3n)]:border-e-0 px-2 py-1.5 font-bold">{c}</span>)}
                    {Array.from({ length: 9 }, (_, k) => <span key={k} className="h-8 border-t border-e border-pw-navy [&:nth-child(3n)]:border-e-0" />)}
                  </div>
                </div>
              ) : (
                <span className="flex gap-4 text-base" aria-hidden="true">
                  {YES_NO.map((w) => (
                    <span key={w} className="inline-flex items-center gap-2"><span className="inline-block w-4 h-4 border-[1.5px] border-pw-navy" />{w}</span>
                  ))}
                </span>
              )}
              <button
                type="button"
                onClick={() => onOpenSection(section.id)}
                className="font-sans min-h-11 rounded-full bg-pw-soft px-4 text-[15px] font-semibold inline-flex items-center gap-1.5 hover:bg-pw-soft-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy"
              >
                What it asks <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </section>

      <div className="space-y-2 text-base leading-relaxed">
        <p>The boxes stay empty. Tap <span className="font-semibold">What it asks</span> to open that question in the guide, in plain words.</p>
        <p className="text-pw-muted">The other parts of the form ask about you, your home, your family and your work. How to answer about your own life is a question for a lawyer.</p>
        <Link to="/lawyer-first" className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4 decoration-pw-navy/40 hover:decoration-pw-navy">
          Talk to a lawyer first
        </Link>
      </div>
    </div>
  );
}
