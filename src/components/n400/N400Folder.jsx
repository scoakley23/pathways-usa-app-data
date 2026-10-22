import React, { useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { Folder, FolderTab } from '@/components/pathways/ui';

// Short tab labels and colors for the N-400 sections (Part 8, then the Part 9
// groups), in form order.
const TABS = {
  'time-outside-us': { label: 'Part 8', tone: 'navy' },
  'citizenship-voting-taxes': { label: 'Citizenship, voting, and taxes', tone: 'civics' },
  'groups-violence': { label: 'Groups and violence', tone: 'reading' },
  'crimes-offenses': { label: 'Crimes and offenses', tone: 'writing' },
  'immigration-history': { label: 'Immigration history', tone: 'speaking' },
  'selective-service-military': { label: 'Selective Service and military', tone: 'civics' },
  'oath-questions': { label: 'Oath questions', tone: 'reading' },
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
