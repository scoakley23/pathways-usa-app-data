import React from 'react';
import { Link } from 'react-router-dom';

const TABS = [
  { id: 'lessons', label: 'Lessons' },
  { id: 'practice', label: 'Practice' },
];

// The top of the Study page, on navy: the "Study" title, an optional action
// on the right (the Practice tab's "2025 test" button) and the
// Lessons | Practice switch (white pill for the open tab). `children` follow
// (the Practice tab's suggestion).
export default function StudyTop({ tab, action = null, children }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[30px] sm:text-[34px] leading-[1.1]">Study</h1>
        {action}
      </div>
      <nav aria-label="Study">
        <div className="inline-flex rounded-full bg-navy-2 p-1">
          {TABS.map((t) => {
            const active = t.id === tab;
            return (
              <Link
                key={t.id}
                to={`/study?tab=${t.id}`}
                aria-current={active ? 'page' : undefined}
                className={`min-h-tap inline-flex items-center rounded-full px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white
                  ${active ? 'bg-white text-navy' : 'text-on-navy hover:text-white'}`}
              >
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
      {children}
    </div>
  );
}
