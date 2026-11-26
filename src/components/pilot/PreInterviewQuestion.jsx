import React, { useState } from 'react';
import { Button, Card } from '@/components/pathways/ui';
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
    <Card padding="p-5" className="max-w-lg w-full mx-auto space-y-5 text-navy">
      <div className="space-y-2">
        <p className="text-base font-semibold text-muted" dir="auto">{t('eyebrow')}</p>
        <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{t('pre_title')}</h1>
        <p className="text-base text-muted" dir="auto">{t('small_print')}</p>
      </div>
      <ReadinessQuestion label={t('ready_label')} value={confidence} onChange={setConfidence} t={t} />
      <div className="flex flex-col gap-2">
        <Button variant="main" onClick={() => finish(true)} className="w-full">{t('save')}</Button>
        <Button variant="second" onClick={() => finish(false)} className="w-full">{t('skip')}</Button>
      </div>
    </Card>
  );
}
