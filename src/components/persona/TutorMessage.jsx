import React from 'react';
import { Volume2 } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import useTextSize from './useTextSize';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { speakText } from '@/components/utils/textToSpeech';
import { spokenTutorName } from '@/lib/tutorPersona';

const NAVY = '#14264A';

export function ListenButton({ text, language, label = 'Listen', tutorName }) {
  const say = () => {
    const spoken = tutorName ? text.split(tutorName).join(spokenTutorName(tutorName, language)) : text;
    speakText(spoken, language);
  };
  return (
    <button
      type="button"
      onClick={say}
      className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-2 -ml-2 font-semibold hover:bg-[#EEF2F8]"
      style={{ color: NAVY }}
    >
      <Volume2 className="w-5 h-5 shrink-0" /> <span className="text-base">{label}</span>
    </button>
  );
}

// The tutor's avatar and speech bubble. `mine` is the text in the learner's
// language; `en` is the English version (shown below in a light card when
// both are present). Every message has a Listen button.
export default function TutorMessage({ profile, language = 'en', mine, en, children }) {
  const { className: sizeClass } = useTextSize();
  const showMine = !!mine && language !== 'en';
  const dir = RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr';

  return (
    <div className={`flex items-start gap-3 ${sizeClass}`} style={{ color: NAVY }}>
      <TutorAvatar avatar={profile.avatar} size={48} />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="rounded-2xl rounded-tl-sm bg-white border border-[#DEE4EE] p-3 space-y-1">
          {showMine ? (
            <>
              <p dir={dir} className="leading-relaxed">{mine}</p>
              <ListenButton text={mine} language={language} tutorName={profile.name} />
            </>
          ) : (
            en && (
              <>
                <p className="leading-relaxed">{en}</p>
                <ListenButton text={en} language="en" tutorName={profile.name} />
              </>
            )
          )}
          {children}
        </div>
        {showMine && en && (
          <div className="rounded-2xl bg-[#EEF2F8] p-3 space-y-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4A5A78]">English</p>
            <p className="leading-relaxed">{en}</p>
            <ListenButton text={en} language="en" label="Listen in English" tutorName={profile.name} />
          </div>
        )}
      </div>
    </div>
  );
}
