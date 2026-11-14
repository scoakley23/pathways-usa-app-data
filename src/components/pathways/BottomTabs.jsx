import React from 'react';
import { Link } from 'react-router-dom';
import { TodayIcon, CourseIcon, InterviewIcon, MeIcon } from '@/components/pathways/icons';

// The new bottom tabs (Pathways + Amio, frame R33Today): Today · Course ·
// Interview · Me on a white bar, the active tab in denim. Built in Prompt 1
// but not shown anywhere yet: Prompt 3 swaps it in for TabBar, with the real
// Course, Interview and Me screens. Until then the paths point at today's
// nearest screens, and the old routes keep working.
export const TABS = [
  { id: 'today', label: 'Today', path: '/', icon: TodayIcon },
  { id: 'course', label: 'Course', path: '/study?tab=lessons', icon: CourseIcon },
  { id: 'interview', label: 'Interview', path: '/interview-day', icon: InterviewIcon },
  { id: 'me', label: 'Me', path: '/Profile', icon: MeIcon },
];

const TAB = 'flex flex-col items-center justify-center gap-[3px] min-h-[56px] px-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim';

// `active` is a tab id; `fixed` pins the bar to the bottom of the screen
// (false shows it in place, e.g. on the design preview).
export default function BottomTabs({ active = 'today', tabs = TABS, labels = {}, fixed = true, className = '' }) {
  return (
    <nav
      aria-label="Main"
      className={`${fixed ? 'fixed bottom-0 inset-x-0 z-40' : ''} bg-white border-t border-line pt-2 pb-[max(env(safe-area-inset-bottom),14px)] ${className}`}
    >
      <div className="grid grid-cols-4 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const on = tab.id === active;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.id}
              to={tab.path}
              aria-current={on ? 'page' : undefined}
              className={`${TAB} ${on ? 'text-denim font-bold' : 'text-muted font-medium hover:text-navy'}`}
            >
              <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
              <span className="leading-none truncate max-w-full">{labels[tab.id] || tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
