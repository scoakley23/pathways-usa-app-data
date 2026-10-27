import React, { useState } from 'react';
import { RaisedCard, PrimaryButton, QuietButton, Eyebrow } from '@/components/pathways/ui';
import useAppLanguage from '@/hooks/useAppLanguage';
import { skipPreInterview } from '@/lib/pilot';
import usePilotText from './pilotStrings';
import { saveCheckIn } from './checkInData';
import { ReadinessQuestion } from './PilotFields';

// Asked once before a Mock Interview when the learner's latest stage is
// "interview scheduled" (shouldAskPreInterview). Saves kind "pre_interview";
// Skip is noted on the device so it isn't asked again for 30 days. The
// interview starts right away either way.
export default function PreInterviewQuestion({ email, onDone }) {
  const [language] = useAppLanguage();
  const t = usePilotText(language);
  const [confidence, setConfidence] = useState('');

  const finish = (save) => {
    if (save && confidence) {
      saveCheckIn(email, { kind: 'pre_interview', confidence }).catch(() => {});
    } else {
      skipPreInterview();
    }
    onDone();
  };

  return (
    <RaisedCard padding="p-5 sm:p-8" className="max-w-2xl w-full mx-auto space-y-6">
      <div className="space-y-3">
        <Eyebrow>{t('eyebrow')}</Eyebrow>
        <h2 className="font-display text-[32px] leading-tight text-pw-navy">{t('pre_title')}</h2>
        <p className="text-base text-pw-muted">{t('small_print')}</p>
      </div>
      <ReadinessQuestion label={t('ready_label')} value={confidence} onChange={setConfidence} t={t} />
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
        <QuietButton onClick={() => finish(false)} className="w-full sm:w-auto">{t('skip')}</QuietButton>
        <PrimaryButton large onClick={() => finish(true)} className="w-full sm:w-auto">{t('save')}</PrimaryButton>
      </div>
    </RaisedCard>
  );
}
