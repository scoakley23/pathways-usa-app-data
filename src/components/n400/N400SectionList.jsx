import React from 'react';
import { Check, ChevronRight } from 'lucide-react';
import { sectionStates } from '@/lib/n400View';
import useN400GuideText from './useN400GuideText';

// The guide's sections (Amio v2): one card each. Read = navy with a gold
// check; the next one to read = sky, marked "Next" in words; the rest white.
// Each shows the title and how many cards it has. Only whole sections are
// saved as read (never which cards). Nothing is locked.
const LOOK = {
  done: { card: 'bg-navy border-navy text-white', sub: 'text-on-navy', dot: 'bg-gold text-navy' },
  current: { card: 'bg-sky border-sky text-navy', sub: 'text-navy', dot: 'bg-navy text-white' },
  later: { card: 'bg-white border-line text-navy', sub: 'text-muted', dot: 'bg-line-soft text-navy' },
};

export default function N400SectionList({ sections, completedIds = [], countFor, onSelect }) {
  const { t } = useN400GuideText();
  const states = sectionStates(sections, completedIds);
  return (
    <ol className="flex flex-col gap-2 list-none m-0 p-0">
      {sections.map((s, i) => {
        const state = states[i];
        const look = LOOK[state] || LOOK.later;
        const n = countFor(s);
        return (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onSelect(s.id)}
              className={`w-full min-h-[72px] flex items-center gap-3 rounded-card border-[2.5px] px-4 py-3 text-start hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${look.card}`}
            >
              <span className={`w-10 h-10 shrink-0 rounded-full grid place-items-center text-base font-bold ${look.dot}`} aria-hidden="true">
                {state === 'done' ? <Check className="w-5 h-5" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[1.0625rem] font-semibold leading-snug" dir="auto">{t(`title_${s.id}`)}</span>
                <span className={`block text-base ${look.sub}`} dir="auto">
                  {n === 1 ? t('cards_one') : t('cards_many', { n })}
                  {state === 'done' && ` · ${t('state_read')}`}
                  {state === 'current' && ` · ${t('state_next')}`}
                </span>
              </span>
              <ChevronRight className="w-5 h-5 shrink-0 rtl:rotate-180" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}
