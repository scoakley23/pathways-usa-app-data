import React, { useEffect, useId } from 'react';
import { Square, Volume2 } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import useTextSize from './useTextSize';
import useAutoRead, { currentSpeakingId, readAloud, stopReading, useSpeakingId } from './useAutoRead';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { speakText } from '@/components/utils/textToSpeech';
import { spokenTutorName } from '@/lib/tutorPersona';
import { PillButton } from '@/components/pathways/ui';

export function ListenButton({ text, language, label = 'Listen', tutorName, className = '' }) {
  const say = () => {
    stopReading();
    const spoken = tutorName ? text.split(tutorName).join(spokenTutorName(tutorName, language)) : text;
    speakText(spoken, language);
  };
  return (
    <PillButton onClick={say} className={className}>
      <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {label}
    </PillButton>
  );
}

// The tutor's avatar and speech bubble. `mine` is the text in the learner's
// language; `en` is the English version, shown under it in the same bubble.
// Every message has a Listen button (and "English" when both are shown).
// `expression` picks the tutor's face (see TutorAvatar).
// On auto-read screens (see useAutoRead) the message reads itself aloud when
// it appears, with a Stop button while it speaks. `readAlso` ({ mine, en }) is
// read after the message but not shown (e.g. the answer choices).
// `readDelay` waits before reading (e.g. for a translation still loading).
export default function TutorMessage({ profile, language = 'en', mine, en, children, expression = 'default', readAlso, readDelay = 0 }) {
  const { className: sizeClass } = useTextSize();
  const showMine = !!mine && language !== 'en';
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';
  const id = useId();
  const autoRead = useAutoRead();
  const speakingId = useSpeakingId();
  const speaking = speakingId === id;

  const join = (a, b) => [a, b].filter(Boolean).join(' ');
  const readMine = showMine ? join(mine, readAlso?.mine) : null;
  const readEn = join(en, readAlso?.en);

  useEffect(() => {
    if (!autoRead) return undefined;
    const timer = setTimeout(() => readAloud(id, { mine: readMine, en: readEn, language, tutorName: profile.name }), 150 + readDelay);
    return () => clearTimeout(timer);
  }, [autoRead, id, readMine, readEn, language, profile.name, readDelay]);

  // Stop reading when the message goes away (next step, leaving the page).
  useEffect(() => () => { if (currentSpeakingId() === id) stopReading(); }, [id]);

  return (
    <div className={`flex items-start gap-3 text-pw-navy ${sizeClass}`}>
      <span className="relative shrink-0">
        {speaking && <span className="absolute -inset-1 rounded-full ring-4 ring-pw-red/30 motion-safe:animate-pulse" aria-hidden="true" />}
        <TutorAvatar avatar={profile.avatar} size={52} expression={expression} />
      </span>
      <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md bg-white border border-pw-line shadow-raised p-4">
        {showMine ? (
          <>
            <p dir={dir} className="leading-relaxed">{mine}</p>
            {en && <p className="leading-relaxed text-pw-muted mt-2">{en}</p>}
          </>
        ) : (
          en && <p className="leading-relaxed">{en}</p>
        )}
        <div className="flex flex-wrap gap-2 mt-3">
          {speaking ? (
            <PillButton onClick={stopReading}>
              <Square className="w-4 h-4 shrink-0 fill-current" aria-hidden="true" /> Stop
            </PillButton>
          ) : showMine ? (
            <>
              <ListenButton text={mine} language={language} tutorName={profile.name} />
              {en && <ListenButton text={en} language="en" label="English" tutorName={profile.name} />}
            </>
          ) : (
            en && <ListenButton text={en} language="en" tutorName={profile.name} />
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
