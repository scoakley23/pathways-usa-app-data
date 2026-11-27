import React, { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { speakText, stopSpeaking } from '@/components/utils/textToSpeech';
import { checkDictation } from '@/lib/practiceChecks';
import { SENTENCE_TRIES, sentenceStatus } from '@/lib/interviewDay';
import { Button } from '@/components/pathways/ui';
import { EndCallButton } from '@/components/interview/CallFrame';
import { OFFICER_LINES } from './interviewDayStrings';
import { DayFrame, DayResult } from './dayParts';

// Writing: the officer reads a sentence and the learner types it in the
// call. Checked on the device (checkDictation), up to 3 sentences, stopping
// at the first one written right. The sentence isn't shown until it's checked.
export default function WritePart({ t, items, onDone, onStop }) {
  const [i, setI] = useState(0);
  const [outcomes, setOutcomes] = useState([]);
  const [typed, setTyped] = useState('');
  const [said, setSaid] = useState(null);
  const [speaking, setSpeaking] = useState(false);
  const sentence = items[i]?.text || '';

  const say = (withPrompt) => {
    setSpeaking(true);
    const text = withPrompt ? `${OFFICER_LINES.write} ${sentence}` : sentence;
    speakText(text, 'en', { onEnd: () => setSpeaking(false) });
  };
  useEffect(() => { say(true); return () => stopSpeaking(); }, [i]);

  const check = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    stopSpeaking();
    const ok = checkDictation(sentence, typed).isCorrect;
    setSaid(typed.trim());
    setOutcomes((o) => [...o, ok]);
  };

  const answered = said !== null;
  const last = outcomes[outcomes.length - 1];
  const status = sentenceStatus(outcomes, items.length);
  const next = () => {
    if (status.done) { onDone(status.passed); return; }
    setTyped(''); setSaid(null); setI(i + 1);
  };

  return (
    <DayFrame part="writing" t={t} speaking={speaking} small={answered} status={speaking ? t('status_speaking') : t('status_turn')} onStop={onStop}>
      <div className="rounded-card bg-white border border-line p-5 space-y-3">
        <p className="text-small font-semibold text-muted">{t('sentence_n', { n: i + 1, total: Math.min(SENTENCE_TRIES, items.length) })}</p>
        <p className="text-base text-muted" dir="auto">{t('write_ask')}</p>
        {answered && <p className="text-[1.5rem] leading-snug font-bold" lang="en" dir="ltr">{sentence}</p>}
        {!answered && (
          <>
            <button type="button" onClick={() => say(false)} disabled={speaking} className="min-h-tap inline-flex items-center gap-2 rounded-button border border-line bg-white px-4 text-base font-semibold text-navy hover:border-denim disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
              <Volume2 className="w-5 h-5" aria-hidden="true" /> {t('hear_again')}
            </button>
            <form onSubmit={check} className="space-y-2">
              <label htmlFor="day-write" className="block text-small font-semibold">{t('type_label')}</label>
              <textarea
                id="day-write"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                rows={2}
                lang="en"
                dir="ltr"
                autoCapitalize="sentences"
                className="w-full rounded-button border border-line bg-white px-4 py-3 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim"
              />
              <Button variant="main" type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
            </form>
          </>
        )}
      </div>
      {answered ? (
        <DayResult
          t={t}
          said={said}
          ok={last}
          line={last ? t('write_ok') : status.done ? t('part_done_not') : t('sentence_not')}
          onNext={next}
          nextLabel={status.done ? t('continue') : t('next')}
        />
      ) : (
        <div className="flex justify-end"><EndCallButton onClick={onStop} label={t('end_call')} /></div>
      )}
    </DayFrame>
  );
}
