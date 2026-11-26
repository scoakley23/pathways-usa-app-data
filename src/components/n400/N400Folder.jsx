import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Folder, FolderTab } from '@/components/pathways/ui';
import { tabFor } from './n400Tabs';

// Solid section fill with its text color.
const SOLID = 'bg-navy text-white';
export const SECTION_SOLID = {
  civics: SOLID,
  reading: SOLID,
  writing: SOLID,
  speaking: SOLID,
  plum: SOLID,
  sky: SOLID,
  navy: SOLID,
};
export const SECTION_BORDER = {
  civics: 'border-navy',
  reading: 'border-navy',
  writing: 'border-navy',
  speaking: 'border-navy',
  plum: 'border-navy',
  sky: 'border-navy',
  navy: 'border-navy',
};

export { tabFor };

// The N-400 folder: one tab per section, the open
// section's title and part, and "n of 7 sections read" (N400SectionProgress,
// section completion only). `onSelect(id)` opens a section.
export default function N400Folder({ sections, activeId, completedIds = [], onSelect, children }) {
  const active = sections.find((s) => s.id === activeId);
  const read = sections.filter((s) => completedIds.includes(s.id)).length;
  const ref = useRef(null);
  // Bring the open tab into view in the scrolling tab row (only the row
  // scrolls, never the page).
  useEffect(() => {
    const tab = ref.current?.querySelector('[aria-current="true"]');
    const row = tab?.parentElement;
    if (tab && row) row.scrollLeft = Math.max(0, tab.offsetLeft - row.offsetLeft - (row.clientWidth - tab.offsetWidth) / 2);
  }, [activeId]);
  return (
    <div ref={ref}>
      <Folder
        tabs={sections.map((s) => {
          const tab = tabFor(s);
          const done = completedIds.includes(s.id);
          return (
            <FolderTab key={s.id} tone={tab.tone} active={s.id === activeId} onClick={() => onSelect(s.id)} aria-label={`${s.title}${done ? ', read' : ''}`}>
              <span className="inline-flex items-center gap-1.5">
                {done && <Check className="w-4 h-4" aria-hidden="true" />}
                {tab.label}
              </span>
            </FolderTab>
          );
        })}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <div className="min-w-0">
              {active && <p className="text-sm font-semibold">{active.partLabel}</p>}
              {active && <h2 className="font-display text-[1.875rem] sm:text-[2.25rem] leading-tight">{active.title}</h2>}
            </div>
            <p className="text-base font-semibold">{read} of {sections.length} sections read</p>
          </div>
          {children}
        </div>
      </Folder>
    </div>
  );
}
