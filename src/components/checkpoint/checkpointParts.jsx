import React from 'react';
import { Check, X } from 'lucide-react';
import MicButton from '@/components/pathways/MicButton';
import useTranslatedLines from '@/components/persona/useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { CHECKPOINT_LINES } from '@/components/checkpoint/checkpointStrings';

// Shared pieces of the checkpoint screens (Prompt 8): the wording, the gold
// Speak it! header with progress dots, and the mic inside a ring.

export function useCheckpointText() {
  const [language] = useAppLanguage();
  const tr = useTranslatedLines(CHECKPOINT_LINES, language, { cacheKey: 'checkpoints_v1' });
  const t = (key, vars = {}) => {
    let s = (language !== 'en' && tr(key)) || CHECKPOINT_LINES[key] || key;
    for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
  return { t, language, rtl: RTL_LANGUAGES.includes(language) };
}

/** A close button and title on a colored bar (gold for Speak it!, navy otherwise). */
export function CheckpointHeader({ title, subtitle, onClose, closeLabel, tone = 'gold', children }) {
  const gold = tone === 'gold';
  return (
    <header className={`${gold ? 'bg-gold text-navy' : 'bg-navy text-white'} px-4 pt-5 pb-4 flex flex-col gap-3`}>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onClose} aria-label={closeLabel} className={`shrink-0 w-11 h-11 -ms-1 grid place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 ${gold ? 'hover:bg-white/40 focus-visible:ring-navy' : 'hover:bg-chip-navy focus-visible:ring-white'}`}>
          <X className="w-6 h-6" aria-hidden="true" />
        </button>
        <div className="min-w-0">
          <h1 className="text-title font-bold break-words" dir="auto">{title}</h1>
          {subtitle && <p className={`text-small break-words ${gold ? 'text-navy' : 'text-on-navy'}`} dir="auto">{subtitle}</p>}
        </div>
      </div>
      {children}
    </header>
  );
}

/**
 * One dot per question: right = green with a check, missed = white with an
 * X, can't check = white, current = white with a navy ring, later = pale.
 * results: [true | false | null]; `current` = index.
 */
export function ProgressDots({ total, results = [], current, label }) {
  return (
    <ol className={`flex flex-wrap justify-center list-none m-0 p-0 ${total > 10 ? 'gap-1.5' : 'gap-2'}`} aria-label={label}>
      {Array.from({ length: total }).map((_, i) => {
        const r = results[i];
        const answered = i < results.length;
        const look = answered
          ? r === true ? 'bg-correct text-white' : 'bg-white text-not-yet'
          : i === current ? 'bg-white ring-2 ring-navy' : 'bg-white/50';
        const size = total > 10 ? 'w-5 h-5' : 'w-7 h-7';
        const icon = total > 10 ? 'w-3 h-3' : 'w-4 h-4';
        return (
          <li key={i} className={`grid place-items-center ${size} rounded-full ${look}`} aria-hidden="true">
            {answered && r === true && <Check className={icon} strokeWidth={3} />}
            {answered && r === false && <X className={icon} strokeWidth={3} />}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * The mic inside a gold ring (frame R33SpeakAsk). The ring turns while
 * listening to show the app is listening; there is no time limit. With
 * reduced motion it stays still.
 */
export function RingMic(props) {
  const { listening } = props;
  return (
    <div className="relative grid place-items-center">
      <svg viewBox="0 0 120 120" className={`absolute -top-3 w-[120px] h-[120px] pointer-events-none ${listening ? 'motion-safe:animate-[spin_3s_linear_infinite]' : ''}`} aria-hidden="true" focusable="false">
        <circle cx="60" cy="60" r="56" fill="none" strokeWidth="6" className="stroke-mid" />
        {listening && <circle cx="60" cy="60" r="56" fill="none" strokeWidth="6" strokeLinecap="round" strokeDasharray="230 352" className="stroke-gold" />}
      </svg>
      <MicButton {...props} />
    </div>
  );
}
