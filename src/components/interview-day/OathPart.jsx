import React, { useEffect, useState } from 'react';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import { speakText, stopSpeaking } from '@/components/utils/textToSpeech';
import { Button } from '@/components/pathways/ui';
import { heardOathYes } from '@/lib/interviewDay';
import { OFFICER_LINES } from './interviewDayStrings';
import { AnswerArea, DayFrame } from './dayParts';

// Part 1 of the whole day: the promise to tell the truth. Not scored. "I do"
// is checked on the device; what the learner says isn't sent anywhere.
export default function OathPart({ t, onDone, onStop }) {
  const [speaking, setSpeaking] = useState(false);
  const [heard, setHeard] = useState('');
  const speech = useSpeechCapture((text) => {
    setHeard(text || '');
    if (heardOathYes(text)) onDone();
  });

  const say = () => {
    setSpeaking(true);
    speakText(OFFICER_LINES.oath, 'en', { onEnd: () => setSpeaking(false) });
  };
  useEffect(() => { say(); return () => stopSpeaking(); }, []);

  return (
    <DayFrame part="oath" t={t} speaking={speaking} status={speaking ? t('status_speaking') : t('status_turn')} onStop={onStop}>
      <div className="rounded-card bg-white border border-line p-5 space-y-2">
        <p className="text-question font-bold leading-snug" lang="en" dir="ltr">{OFFICER_LINES.oath}</p>
        <p className="text-base text-muted" dir="auto">{t('oath_say')}</p>
        {(speech.listening || heard) && (
          <p className="text-base font-semibold text-denim break-words" aria-live="polite" dir="auto">
            {speech.listening ? (speech.transcript || '…') : t('oath_heard', { heard })}
          </p>
        )}
      </div>
      <AnswerArea t={t} speech={speech} onRepeat={say} onTyped={(text) => { setHeard(text); if (heardOathYes(text)) onDone(); }} onStop={onStop} disabled={speaking} />
      <Button variant="main" className="w-full" onClick={onDone}>{t('i_do')}</Button>
    </DayFrame>
  );
}
