import React from 'react';
import TopicArt from '@/components/art/TopicArt';
import { RaisedCard, Tag } from '@/components/pathways/ui';
import { LANGUAGES } from '@/hooks/useLessonTranslation';

// Languages the tutor can teach in (English included).
const LANGUAGE_COUNT = LANGUAGES.length;

// Two promises on Home: answers come from USCIS, and lessons can be in the
// learner's language while the interview itself is in English.
export default function HomePromises({ t }) {
  return (
    <section aria-labelledby="promises-title" className="space-y-3">
      <h2 id="promises-title" className="text-[28px] font-display font-normal text-pw-navy">{t('promise_title')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <RaisedCard padding="p-0" className="overflow-hidden">
          <div className="bg-pw-blue-soft px-4 pt-3 pb-2">
            <TopicArt name="capitol" className="w-full h-14" accent={false} />
          </div>
          <div className="p-5 space-y-2">
            <Tag tone="blue">{t('promise_official_tag')}</Tag>
            <h3 className="text-xl font-extrabold text-pw-navy">{t('promise_official_title')}</h3>
            <p className="text-base text-pw-muted">{t('promise_official_body')}</p>
            <p className="text-sm text-pw-muted">{t('promise_official_note')}</p>
          </div>
        </RaisedCard>
        <RaisedCard padding="p-0" className="overflow-hidden">
          <div className="bg-pw-green-soft px-4 pt-3 pb-2">
            <TopicArt name="speech" className="w-full h-14" accent={false} />
          </div>
          <div className="p-5 space-y-2">
            <Tag tone="green">{t('promise_language_tag')}</Tag>
            <h3 className="text-xl font-extrabold text-pw-navy">{t('promise_language_title')}</h3>
            <p className="text-base text-pw-muted">{t('promise_language_body').replace('{n}', LANGUAGE_COUNT)}</p>
            <p className="text-base text-pw-navy font-bold">{t('promise_language_english')}</p>
          </div>
        </RaisedCard>
      </div>
    </section>
  );
}
