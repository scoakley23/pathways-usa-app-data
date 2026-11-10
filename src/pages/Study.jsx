import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import Lessons from './Lessons';
import Practice from './Practice';
import { studyTab } from '@/lib/studyRoutes';

const TABS = [
  { id: 'lessons', label: 'Lessons' },
  { id: 'practice', label: 'Practice' },
];

// Study: what is now Lessons and Practice, as two tabs (/study?tab=lessons |
// practice). A practice run (?mode=…) is full screen, so the switch hides.
// The page's own look comes with the Study redesign (Prompt 4).
export default function Study(props) {
  const { search } = useLocation();
  const tab = studyTab(search);
  const inRun = new URLSearchParams(search).has('mode');

  return (
    <div>
      {!inRun && (
        <nav aria-label="Study" className="mb-6">
          <div className="inline-flex rounded-full bg-sand p-1">
            {TABS.map((t) => {
              const active = t.id === tab;
              return (
                <Link
                  key={t.id}
                  to={`/study?tab=${t.id}`}
                  aria-current={active ? 'page' : undefined}
                  className={`min-h-tap inline-flex items-center rounded-full px-5 text-base font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy
                    ${active ? 'bg-navy text-white' : 'text-ink hover:bg-sand-hover'}`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
      {tab === 'practice' ? <Practice {...props} /> : <Lessons {...props} />}
    </div>
  );
}
