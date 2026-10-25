import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import SkillLevels from './SkillLevels';
import { RaisedCard, Tag } from '@/components/pathways/ui';

const linkBtn = 'min-h-[52px] w-full rounded-2xl font-bold text-lg inline-flex items-center justify-center bg-pw-navy text-white hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2';
const quietLink = 'min-h-[44px] w-full rounded-2xl font-bold inline-flex items-center justify-center text-pw-navy hover:bg-pw-soft';

// Offers the quick check. `variant="home"` shows only until the learner has
// levels; `variant="progress"` shows the saved levels and "take it again".
// `t` translates the home strings (Home page only).
export default function QuickCheckCard({ variant = 'home', t = (k, en) => en, language = 'en' }) {
  const [levels, setLevels] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then((u) => setLevels(u?.skill_levels || null)).catch(() => setLevels(null));
  }, []);

  if (levels === undefined) return null;
  if (variant === 'home' && levels) return null;

  return (
    <RaisedCard padding="p-0" className="text-pw-navy overflow-hidden">
      <div className="p-5 space-y-3">
        {levels ? (
          <>
            <Tag tone="teal">Your levels</Tag>
            <h2 className="text-[28px] font-display font-normal">Quick check results</h2>
            <SkillLevels levels={levels} language={language} />
            <Link to="/quick-check" className={quietLink}>Take the quick check again</Link>
          </>
        ) : (
          <>
            <Tag tone="teal">{t('qc_time', 'About 10 minutes')}</Tag>
            <h2 className="text-[28px] font-display font-normal">{t('qc_title', 'Start with a quick check')}</h2>
            <p className="text-base text-pw-muted leading-relaxed">
              {t('qc_desc', 'Your tutor checks your civics, reading, writing, and speaking, then plans your practice. You can skip any part.')}
            </p>
            <Link to="/quick-check" className={linkBtn}>{t('qc_start', 'Start the quick check')}</Link>
          </>
        )}
      </div>
    </RaisedCard>
  );
}
