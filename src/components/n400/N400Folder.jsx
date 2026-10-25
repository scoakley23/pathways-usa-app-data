import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Folder, FolderTab } from '@/components/pathways/ui';

// Short tab labels and colors for the N-400 sections (Part 8, then the Part 9
// groups), in form order: seven different colors so each section is easy to
// find again (folder tabs, the section list, the chips on the cover).
const TABS = {
  'time-outside-us': { label: 'Part 8', tone: 'civics' },
  'citizenship-voting-taxes': { label: 'Citizenship, voting, and taxes', tone: 'reading' },
  'groups-violence': { label: 'Groups and violence', tone: 'writing' },
  'crimes-offenses': { label: 'Crimes and offenses', tone: 'speaking' },
  'immigration-history': { label: 'Immigration history', tone: 'plum' },
  'selective-service-military': { label: 'Selective Service and military', tone: 'sky' },
  'oath-questions': { label: 'Oath questions', tone: 'navy' },
};

// Solid section color with its text color (all ≥ 4.5:1; Sky takes ink).
export const SECTION_SOLID = {
  civics: 'bg-pw-civics text-white',
  reading: 'bg-pw-reading text-white',
  writing: 'bg-pw-writing text-white',
  speaking: 'bg-pw-red-ink text-white',
  plum: 'bg-pw-plum text-white',
  sky: 'bg-pw-sky text-pw-navy',
  navy: 'bg-pw-navy text-white',
};
export const SECTION_BORDER = {
  civics: 'border-pw-civics',
  reading: 'border-pw-reading',
  writing: 'border-pw-writing',
  speaking: 'border-pw-red-ink',
  plum: 'border-pw-plum',
  sky: 'border-pw-sky',
  navy: 'border-pw-navy',
};

export const tabFor = (section) => TABS[section.id] || { label: section.title, tone: 'navy' };

// The manila N-400 folder (Phase 6): one colored tab per section, the open
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
              {active && <p className="text-sm font-semibold uppercase tracking-[0.14em]">{active.partLabel}</p>}
              {active && <h2 className="font-display text-[30px] sm:text-[36px] leading-tight">{active.title}</h2>}
            </div>
            <p className="text-base font-semibold">{read} of {sections.length} sections read</p>
          </div>
          {children}
        </div>
      </Folder>
    </div>
  );
}
