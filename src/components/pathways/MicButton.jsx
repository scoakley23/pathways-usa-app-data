import React from 'react';
import { Mic, Square } from 'lucide-react';
import { stopReading } from '@/components/persona/useAutoRead';

// The microphone on speaking screens (frame R33Teach): the biggest button,
// round denim with a navy lip, a short label under it, and a small "Type
// instead" link for learners who can't speak or hear. It holds no speech
// logic: callers start and stop their own speech recognition. Any read-aloud
// stops first, so the mic doesn't hear the app.
// `tone="gold"` (Amio v2, frame Speak) is the speaking screens' mic on navy:
// gold with a navy-deep outline and lip, white label, sky "Type instead".
export default function MicButton({
  listening = false,
  onStart,
  onStop,
  label = 'Answer in English',
  listeningLabel = 'Listening… tap to stop',
  onTypeInstead,
  typeInsteadLabel = 'Type instead',
  disabled = false,
  tone = 'denim',
  className = '',
}) {
  const gold = tone === 'gold';
  const press = () => {
    if (listening) {
      onStop?.();
      return;
    }
    stopReading();
    onStart?.();
  };
  const text = listening ? listeningLabel : label;
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={press}
        disabled={disabled}
        aria-pressed={listening}
        aria-label={text}
        className={gold
          ? `w-24 h-24 mb-1.5 rounded-full grid place-items-center text-navy border-[2.5px] border-navy-deep shadow-lip active:translate-y-[5px] active:shadow-none motion-reduce:active:translate-y-0 motion-reduce:active:shadow-lip transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/60 ${listening ? 'bg-white ring-4 ring-gold motion-safe:animate-pulse' : 'bg-gold'}`
          : `w-24 h-24 mb-1.5 rounded-full grid place-items-center text-white shadow-[0_6px_0_theme(colors.navy)] active:translate-y-1 active:shadow-[0_2px_0_theme(colors.navy)] motion-reduce:active:translate-y-0 transition disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-denim/40 ${listening ? 'bg-navy ring-4 ring-gold motion-safe:animate-pulse' : 'bg-denim hover:bg-denim-deep'}`}
      >
        {listening
          ? <Square className={`w-9 h-9 ${gold ? 'fill-navy' : 'fill-white'}`} strokeWidth={2} aria-hidden="true" />
          : <Mic className="w-10 h-10" strokeWidth={2} aria-hidden="true" />}
      </button>
      <span className={gold ? 'text-[1.25rem] font-bold text-white text-center' : 'text-[0.9375rem] font-semibold text-navy text-center'} aria-hidden="true">{text}</span>
      {onTypeInstead && (
        <button
          type="button"
          onClick={onTypeInstead}
          className={`min-h-tap px-3 text-small font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 rounded ${gold ? 'text-sky decoration-sky/60 hover:decoration-sky focus-visible:ring-white' : 'text-denim decoration-denim/40 hover:decoration-denim focus-visible:ring-navy'}`}
        >
          {typeInsteadLabel}
        </button>
      )}
    </div>
  );
}
