import React from 'react';
import { Volume2 } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import useTextSize from './useTextSize';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { speakText } from '@/components/utils/textToSpeech';
import { spokenTutorName } from '@/lib/tutorPersona';
import { PillButton } from '@/components/pathways/ui';

export function ListenButton({ text, language, label = 'Listen', tutorName, className = '' }) {
  const say = () => {
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
export default function TutorMessage({ profile, language = 'en', mine, en, children, expression = 'default' }) {
  const { className: sizeClass } = useTextSize();
  const showMine = !!mine && language !== 'en';
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  return (
    <div className={`flex items-start gap-3 text-pw-navy ${sizeClass}`}>
      <TutorAvatar avatar={profile.avatar} size={52} expression={expression} />
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
          {showMine ? (
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
