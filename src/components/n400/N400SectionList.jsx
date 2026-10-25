import React from 'react';
import { Check } from 'lucide-react';
import { tabFor, SECTION_SOLID } from './N400Folder';

// Inside the folder: one row per section (title, where it is on the form)
// with a colored block showing how many questions it has, and a check once
// read. Picking a row opens that section with the full wording.
export default function N400SectionList({ sections, completedIds = [], countFor, onSelect }) {
  return (
    <div className="text-pw-navy">
      <span className="block w-32 h-5 rounded-t-[10px] bg-pw-manila" aria-hidden="true" />
      <ul className="rounded-[14px] rounded-tl-none bg-pw-manila p-2.5 sm:p-4 shadow-[0_10px_24px_rgba(20,38,74,0.14)] space-y-2">
        {sections.map((s) => {
          const tone = tabFor(s).tone;
          const done = completedIds.includes(s.id);
          const n = countFor(s);
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onSelect(s.id)}
                className="w-full min-h-[72px] flex items-stretch overflow-hidden rounded-[10px] bg-white text-left shadow-[0_2px_4px_rgba(20,38,74,0.08)] hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 focus-visible:ring-offset-pw-manila"
              >
                <span className="flex-1 min-w-0 px-3 sm:px-4 py-3 flex flex-col justify-center gap-0.5">
                  <span className="text-[17px] font-bold leading-snug">{s.title}</span>
                  <span className="text-sm text-pw-muted">{s.partLabel}</span>
                </span>
                <span className={`w-[84px] sm:w-[112px] shrink-0 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 text-center text-[15px] font-bold ${SECTION_SOLID[tone]}`}>
                  {n} {n === 1 ? 'item' : 'items'}
                  {done && <><Check className="w-4 h-4" strokeWidth={3} aria-hidden="true" /><span className="sr-only">, read</span></>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
