import React from 'react';
import { Link } from 'react-router-dom';
import usePracticeText from '@/components/practice/usePracticeText';

const TABS = ['lessons', 'practice'];

// The top of the Study page (Amio v2, on paper): the "Study" title, an
// optional action on the end side (the Practice tab's "2025 test" button)
// and the Lessons | Practice switch as two tabs like Course's (the open one
// white with a navy border, the other pale). `children` follow.
export default function StudyTop({ tab, action = null, children }) {
  const { t } = usePracticeText();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[2.25rem] leading-none tracking-tight" dir="auto">{t('study')}</h1>
        {action}
      </div>
      <nav aria-label={t('study')} className="grid grid-cols-2 gap-1.5">
        {TABS.map((id) => {
          const active = id === tab;
          return (
            <Link
              key={id}
              to={`/study?tab=${id}`}
              aria-current={active ? 'page' : undefined}
              className={`min-h-[3rem] grid place-items-center rounded-button px-2 text-base font-bold border-[2.5px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${active ? 'bg-white text-navy border-navy' : 'bg-line-soft text-navy border-line-soft hover:border-line'}`}
            >
              {t(`tab_${id}`)}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
