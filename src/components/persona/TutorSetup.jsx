import React, { useState } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import useTranslatedLines from './useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { speakText } from '@/components/utils/textToSpeech';
import {
  ENGLISH_MIX,
  FIXED_LINES_ES,
  MAX_TUTOR_NAME_LENGTH,
  TUTOR_AVATARS,
  TUTOR_TONES,
  fixedTutorLines,
  normalizeTutorProfile,
  spokenTutorName,
} from '@/lib/tutorPersona';

const NAVY = '#14264A';
const LINES = fixedTutorLines();

function OptionButton({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[44px] rounded-2xl border-2 px-3 py-2 text-left transition-colors ${
        selected ? 'bg-[#EEF2F8]' : 'bg-white border-[#DEE4EE] hover:border-[#9AA8C2]'
      } ${className}`}
      style={selected ? { borderColor: NAVY } : undefined}
    >
      {children}
    </button>
  );
}

function ListenButton({ text, language, label }) {
  return (
    <button
      type="button"
      onClick={() => speakText(text, language)}
      className="min-h-[44px] inline-flex items-center gap-2 rounded-xl px-3 text-base font-semibold hover:bg-[#EEF2F8]"
      style={{ color: NAVY }}
    >
      <Volume2 className="w-5 h-5" /> {label}
    </button>
  );
}

// "Your tutor" screen: name, avatar, tone, English mix, and a preview line.
// Used in onboarding and in Profile.
export default function TutorSetup({ initialProfile, onSave, onSkip, saveLabel = 'Save', saving = false }) {
  const [draft, setDraft] = useState(() => normalizeTutorProfile(initialProfile));
  const [nameInput, setNameInput] = useState(draft.name);
  const [language] = useAppLanguage();
  const translate = useTranslatedLines(LINES, language, {
    cacheKey: 'tutor_lines_v1',
    handWritten: { es: FIXED_LINES_ES },
  });

  const set = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const profile = normalizeTutorProfile({ ...draft, name: nameInput });
  const fill = (text) => text.replace('{name}', profile.name);

  const englishLines = [fill(LINES.intro), LINES[`${profile.tone}_greeting`]];
  const mineIntro = translate('intro');
  const mineGreeting = translate(`${profile.tone}_greeting`);
  const showMine = language !== 'en' && mineIntro && mineGreeting;
  const mineLines = showMine ? [fill(mineIntro), mineGreeting] : null;

  const sayInEnglish = englishLines.join(' ').replace(profile.name, spokenTutorName(profile.name, 'en'));

  return (
    <div className="space-y-6 text-base" style={{ color: NAVY }}>
      {/* Preview */}
      <div className="rounded-2xl border border-[#DEE4EE] bg-[#F3F5F9] p-4">
        <div className="flex items-start gap-3">
          <TutorAvatar avatar={profile.avatar} size={56} />
          <div className="min-w-0 flex-1 space-y-2">
            {mineLines && (
              <div className="rounded-2xl rounded-tl-sm bg-white border border-[#DEE4EE] p-3">
                <p dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'}>{mineLines.join(' ')}</p>
                <ListenButton text={mineLines.join(' ')} language={language} label="Listen" />
              </div>
            )}
            <div className={`rounded-2xl p-3 ${mineLines ? 'bg-[#EEF2F8]' : 'rounded-tl-sm bg-white border border-[#DEE4EE]'}`}>
              {mineLines && <p className="text-sm font-semibold uppercase tracking-wide text-[#4A5A78]">English</p>}
              <p>{englishLines.join(' ')}</p>
              <ListenButton text={sayInEnglish} language="en" label={mineLines ? 'Listen in English' : 'Listen'} />
            </div>
          </div>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="tutor-name" className="block font-bold">Name</label>
        <input
          id="tutor-name"
          value={nameInput}
          maxLength={MAX_TUTOR_NAME_LENGTH}
          onChange={(e) => setNameInput(e.target.value)}
          className="w-full min-h-[44px] rounded-xl border border-[#DEE4EE] bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#14264A]"
        />
        <p className="text-sm text-[#4A5A78]">“Vía” means “way” or “path.” You can give your tutor any name.</p>
      </div>

      {/* Avatar */}
      <fieldset className="space-y-2">
        <legend className="font-bold mb-2">Picture</legend>
        <div className="grid grid-cols-3 gap-2">
          {TUTOR_AVATARS.map((id) => (
            <OptionButton key={id} selected={profile.avatar === id} onClick={() => set('avatar', id)} className="flex justify-center">
              <TutorAvatar avatar={id} size={56} />
            </OptionButton>
          ))}
        </div>
      </fieldset>

      {/* Tone */}
      <fieldset className="space-y-2">
        <legend className="font-bold mb-2">How should your tutor talk?</legend>
        <div className="grid gap-2">
          {Object.entries(TUTOR_TONES).map(([id, t]) => (
            <OptionButton key={id} selected={profile.tone === id} onClick={() => set('tone', id)}>
              <span className="block font-semibold">{t.label}</span>
              <span className="block text-sm text-[#4A5A78]">{t.description}</span>
            </OptionButton>
          ))}
        </div>
      </fieldset>

      {/* English mix */}
      {language !== 'en' && (
        <fieldset className="space-y-2">
          <legend className="font-bold mb-2">How much English?</legend>
          <div className="grid gap-2">
            {Object.entries(ENGLISH_MIX).map(([id, m]) => (
              <OptionButton key={id} selected={profile.english_mix === id} onClick={() => set('english_mix', id)}>
                <span className="font-semibold">{m.label}</span>
              </OptionButton>
            ))}
          </div>
          <p className="text-sm text-[#4A5A78]">Your tutor explains in your app language. You can change this any time.</p>
        </fieldset>
      )}

      <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="min-h-[44px] rounded-xl px-4 font-semibold hover:bg-[#EEF2F8]"
          >
            Skip for now
          </button>
        )}
        <button
          type="button"
          disabled={saving}
          onClick={() => onSave(profile)}
          className="min-h-[44px] rounded-xl px-5 font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: NAVY }}
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />} {saveLabel}
        </button>
      </div>
    </div>
  );
}
