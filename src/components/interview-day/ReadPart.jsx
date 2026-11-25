import React, { useEffect, useState } from 'react';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import { speakText, stopSpeaking } from '@/components/utils/textToSpeech';
import { readingWords } from '@/lib/lessonPlayer';
import { SENTENCE_TRIES, sentenceStatus } from '@/lib/interviewDay';
import { OFFICER_LINES } from './interviewDayStrings';
import { AnswerArea, DayFrame, DayResult } from './dayParts';

// Reading: one sentence at a time on the call, read out loud. Scored on the
// device with the existing word matching (70%), up to 3 sentences, stopping
// at the first one read right. Like the real test, no help or hints.
export default function ReadPart({ t, items, onDone, onStop }) {
  const [i, setI] = useState(0);
  const [outcomes, setOutcomes] = useState([]);
  const [said, setSaid] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const sentence = items[i]?.text || '';

  const grade = (text) => {
    const ok = readingWords(sentence, text || '').passed;
    setSaid(text || '');
    setOutcomes((o) => [...o, ok]);
  };
  const speech = useSpeechCapture(grade);

  useEffect(() => {
    setSpeaking(true);
    speakText(OFFICER_LINES.read, 'en', { onEnd: () => setSpeaking(false) });
    return () => stopSpeaking();
  }, [i]);

  const answered = said !== null;
  const last = outcomes[outcomes.length - 1];
  const status = sentenceStatus(outcomes, items.length);
  const next = () => {
    if (status.done) { onDone(status.passed); return; }
    speech.reset(); setSaid(null); setI(i + 1);
  };

  return (
    <DayFrame part="reading" t={t} speaking={speaking} small={answered} status={speaking ? t('status_speaking') : t('status_turn')} onStop={onStop}>
      <div className="rounded-card bg-white border border-line p-5 space-y-2">
        <p className="text-small font-semibold text-muted">{t('sentence_n', { n: i + 1, total: Math.min(SENTENCE_TRIES, items.length) })}</p>
        <p className="text-small text-muted" dir="auto">{t('read_ask')}</p>
        <p className="text-[1.75rem] leading-snug font-bold" lang="en" dir="ltr">{sentence}</p>
        {speech.listening && <p className="text-base font-semibold text-denim break-words" aria-live="polite" lang="en" dir="ltr">{speech.transcript || '…'}</p>}
      </div>
      {answered ? (
        <DayResult
          t={t}
          said={said}
          ok={last}
          line={last ? t('read_ok') : status.done ? t('part_done_not') : t('sentence_not')}
          onNext={next}
          nextLabel={status.done ? t('continue') : t('next')}
        />
      ) : (
        <AnswerArea t={t} speech={speech} onTyped={grade} onStop={onStop} disabled={speaking} />
      )}
    </DayFrame>
  );
}
