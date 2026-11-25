import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import CallFrame, { EndCallButton } from '@/components/interview/CallFrame';
import MicButton from '@/components/pathways/MicButton';
import { Button } from '@/components/pathways/ui';
import { DAY_PARTS } from '@/lib/interviewDay';

// Shared pieces of the whole-day call (Interview Day). Everything stays in
// memory: nothing is saved and nothing goes to browser storage.

/** The call frame for one part of the day: "The whole day · Part 3 of 5: Reading". */
export function DayFrame({ part, t, status, speaking = false, small = false, onStop, children }) {
  const n = DAY_PARTS.indexOf(part) + 1;
  return (
    <CallFrame
      title={t('call_title', { n, total: DAY_PARTS.length, part: t(`part_${part}`) })}
      dashes={{ total: DAY_PARTS.length, current: n - 1 }}
      dashLabel={t('parts_label', { n, total: DAY_PARTS.length })}
      speaking={speaking}
      small={small}
      status={status}
      officerLabel={t('officer_label')}
      closeLabel={t('stop')}
      onClose={onStop}
    >
      {children}
    </CallFrame>
  );
}

/** "Repeat, please", the big mic and End call; "Type instead" opens a small box. */
export function AnswerArea({ t, speech, onRepeat, onTyped, onStop, typeLabel, disabled = false }) {
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        {onRepeat ? (
          <button
            type="button"
            onClick={onRepeat}
            disabled={disabled || speech.listening}
            className="min-h-tap rounded-button border border-line bg-white px-4 text-base font-semibold text-navy hover:border-denim disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
          >
            “{t('repeat')}”
          </button>
        ) : <span className="w-14 shrink-0" aria-hidden="true" />}
        {speech.supported && (
          <MicButton
            listening={speech.listening}
            onStart={() => { setTyping(false); speech.start(); }}
            onStop={speech.stop}
            label={t('tap_answer')}
            listeningLabel={t('tap_stop')}
            disabled={disabled}
          />
        )}
        <EndCallButton onClick={onStop} label={t('end_call')} />
      </div>
      {typing ? (
        <form
          onSubmit={(e) => { e.preventDefault(); if (typed.trim()) { onTyped(typed.trim()); setTyped(''); setTyping(false); } }}
          className="space-y-2"
        >
          <label htmlFor="day-type" className="block text-small font-semibold">{typeLabel || t('type_label')}</label>
          <div className="flex items-center gap-2">
            <input
              id="day-type"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoFocus
              lang="en"
              dir="ltr"
              className="flex-1 min-w-0 h-[3.25rem] rounded-button border border-line bg-white px-4 text-base text-navy focus:outline-none focus:ring-2 focus:ring-denim"
            />
            <Button variant="second" type="submit" disabled={!typed.trim()} className="shrink-0 px-5">{t('done')}</Button>
          </div>
        </form>
      ) : !speech.listening && (
        <div className="text-center">
          <button type="button" onClick={() => setTyping(true)} disabled={disabled} className="min-h-tap px-3 text-small font-semibold text-denim underline underline-offset-4 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim">
            {t('type_instead')}
          </button>
        </div>
      )}
    </div>
  );
}

/** After an answer: what the learner said and one line in words (never color alone, never red). */
export function DayResult({ t, said, ok, line, onNext, nextLabel }) {
  return (
    <div className="space-y-3">
      {said && (
        <div className="rounded-card bg-white border border-line px-4 py-3">
          <p className="text-small font-semibold text-muted">{t('you_said')}</p>
          <p className="text-base font-semibold break-words" lang="en" dir="ltr">“{said}”</p>
        </div>
      )}
      {line && (
        <p className="flex items-center gap-2 text-base font-semibold" role="status">
          {ok === true && <Check className="w-5 h-5 shrink-0 text-correct" strokeWidth={3} aria-hidden="true" />}
          {ok === false && <X className="w-5 h-5 shrink-0 text-not-yet" strokeWidth={3} aria-hidden="true" />}
          <span dir="auto">{line}</span>
        </p>
      )}
      <Button variant="main" className="w-full" onClick={onNext}>{nextLabel}</Button>
    </div>
  );
}
