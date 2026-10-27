import React from 'react';
import { RaisedCard, PrimaryButton, QuietButton, Eyebrow } from '@/components/pathways/ui';
import usePilotText from './pilotStrings';

// Top of Today when a 3-, 6- or 12-month check-in is due.
export default function CheckInCard({ language = 'en', onOpen, onNotNow, onNever }) {
  const t = usePilotText(language);
  return (
    <RaisedCard className="space-y-4" aria-labelledby="checkin-card-title">
      <Eyebrow>{t('eyebrow')}</Eyebrow>
      <h2 id="checkin-card-title" className="font-display text-[28px] leading-tight text-pw-navy">{t('card_prompt')}</h2>
      <div className="flex flex-col sm:flex-row gap-2">
        <PrimaryButton onClick={onOpen} className="w-full sm:w-auto">{t('card_open')}</PrimaryButton>
        <QuietButton onClick={onNotNow} className="w-full sm:w-auto">{t('not_now')}</QuietButton>
        <QuietButton onClick={onNever} className="w-full sm:w-auto text-pw-muted">{t('never')}</QuietButton>
      </div>
    </RaisedCard>
  );
}
