import React from 'react';
import { Button, Card } from '@/components/pathways/ui';
import usePilotText from './pilotStrings';

// Top of Today when a 3-, 6- or 12-month check-in is due.
export default function CheckInCard({ language = 'en', onOpen, onNotNow, onNever }) {
  const t = usePilotText(language);
  return (
    <Card padding="p-5" className="space-y-4 text-navy" aria-labelledby="checkin-card-title">
      <p className="text-base font-semibold text-muted" dir="auto">{t('eyebrow')}</p>
      <h2 id="checkin-card-title" className="font-display text-[1.5rem] leading-tight text-navy" dir="auto">{t('card_prompt')}</h2>
      <div className="flex flex-col gap-2">
        <Button variant="main" onClick={onOpen} className="w-full">{t('card_open')}</Button>
        <Button variant="second" onClick={onNotNow} className="w-full">{t('not_now')}</Button>
        <Button variant="link" onClick={onNever} className="w-full">{t('never')}</Button>
      </div>
    </Card>
  );
}
