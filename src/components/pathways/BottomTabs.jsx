import React from 'react';
import { Link } from 'react-router-dom';
import { TodayIcon, CourseIcon, InterviewIcon, MeIcon } from '@/components/pathways/icons';
import { TAB_PATHS } from '@/lib/shellRoutes';

// The bottom tabs (Pathways + Amio, frame R33Today): Today · Course ·
// Interview · Me on a white bar, the active tab in denim. Which addresses
// belong to which tab: src/lib/shellRoutes.js. Course opens Study until the
// journey (Prompt 5).
export const TABS = [
  { id: 'today', label: 'Today', path: TAB_PATHS.today, icon: TodayIcon },
  { id: 'course', label: 'Course', path: TAB_PATHS.course, icon: CourseIcon },
  { id: 'interview', label: 'Interview', path: TAB_PATHS.interview, icon: InterviewIcon },
  { id: 'me', label: 'Me', path: TAB_PATHS.me, icon: MeIcon },
];

const TAB = 'flex flex-col items-center justify-center gap-[3px] min-h-[56px] px-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-denim';

// `active` is a tab id (or null); `fixed` pins the bar to the bottom of the
// screen (false shows it in place, e.g. on the design preview). `dots`
// marks tabs with something new, e.g. { me: 'unread notifications' }.
export default function BottomTabs({ active = 'today', tabs = TABS, labels = {}, dots = {}, fixed = true, className = '' }) {
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
              <span className="relative">
                <Icon className="w-[22px] h-[22px]" strokeWidth={2} />
                {dots[tab.id] && <span className="absolute -top-0.5 -end-1 w-2.5 h-2.5 rounded-full bg-denim ring-2 ring-white" aria-hidden="true" />}
              </span>
              <span className="leading-none truncate max-w-full">{labels[tab.id] || tab.label}</span>
              {dots[tab.id] && <span className="sr-only">, {dots[tab.id]}</span>}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
