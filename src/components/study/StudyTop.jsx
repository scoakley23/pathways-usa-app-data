import React from 'react';
import usePracticeText from '@/components/practice/usePracticeText';

// The top of Practice (Amio v2, on paper): the "Practice" title and an
// optional action on the end side (the "2025 test" button). Study is Practice
// only since the old Lessons tab merged into Course. `children` follow.
export default function StudyTop({ action = null, children }) {
  const { t } = usePracticeText();
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[2.25rem] leading-none tracking-tight" dir="auto">{t('tab_practice')}</h1>
        {action}
      </div>
      {children}
    </div>
  );
}
