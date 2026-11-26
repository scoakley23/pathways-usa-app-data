import React, { useState } from 'react';
import { Loader2, Volume2 } from 'lucide-react';
import { Button } from '@/components/pathways/ui';
import { SETTINGS_PIECE_LINES } from '@/components/shell/leftoverStrings';
import useTranslatedLines from './useTranslatedLines';
import useAppLanguage, { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { speakText } from '@/components/utils/textToSpeech';
import {
  ENGLISH_MIX,
  FIXED_LINES_ES,
  TUTOR_TONES,
  fixedTutorLines,
  normalizeTutorProfile,
} from '@/lib/tutorPersona';

const LINES = fixedTutorLines();

function OptionButton({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`min-h-[44px] rounded-card border-2 px-4 py-3 text-start text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2 ${
        selected ? 'border-navy bg-white' : 'bg-white border-line hover:border-navy'
      } ${className}`}
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
      className="min-h-[44px] -ms-3 inline-flex items-center gap-2 rounded-button px-3 text-base font-semibold text-denim hover:bg-line-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy"
    >
      <Volume2 className="w-5 h-5" aria-hidden="true" /> <span dir="auto">{label}</span>
    </button>
  );
}

// "Your tutor" screen: tone, English mix, and a preview line. The tutor is
// always Amio, so there is no name to pick. Used in Settings.
export default function TutorSetup({ initialProfile, onSave, onSkip, saveLabel, saving = false }) {
  const [draft, setDraft] = useState(() => normalizeTutorProfile(initialProfile));
  const [language] = useAppLanguage();
  const trPiece = useTranslatedLines(SETTINGS_PIECE_LINES, language, { cacheKey: 'settings_pieces_v1' });
  const t = (key) => (language !== 'en' && trPiece(key)) || SETTINGS_PIECE_LINES[key] || key;
  const translate = useTranslatedLines(LINES, language, {
    cacheKey: 'tutor_lines_v2',
    handWritten: { es: FIXED_LINES_ES },
  });

  const set = (field, value) => setDraft((d) => ({ ...d, [field]: value }));
  const profile = normalizeTutorProfile(draft);
  const fill = (text) => text.replace('{name}', profile.name);

  const englishLines = [fill(LINES.intro), LINES[`${profile.tone}_greeting`]];
  const mineIntro = translate('intro');
  const mineGreeting = translate(`${profile.tone}_greeting`);
  const showMine = language !== 'en' && mineIntro && mineGreeting;
  const mineLines = showMine ? [fill(mineIntro), mineGreeting] : null;

  const sayInEnglish = englishLines.join(' ');

  return (
    <div className="space-y-6 text-base text-navy">
      {/* Preview */}
      <div className="rounded-card bg-line-soft p-4">
        <div className="space-y-2">
          {mineLines && (
            <div className="rounded-card rounded-ss-[4px] bg-white border border-line p-3">
              <p dir={RTL_LANGUAGES.includes(language) ? 'rtl' : 'ltr'}>{mineLines.join(' ')}</p>
              <ListenButton text={mineLines.join(' ')} language={language} label={t('listen')} />
            </div>
          )}
          <div className={`rounded-card p-3 ${mineLines ? 'bg-white/60' : 'rounded-ss-[4px] bg-white border border-line'}`}>
            {mineLines && <p className="text-small font-semibold text-muted" dir="auto">{t('english')}</p>}
            <p lang="en" dir="ltr">{englishLines.join(' ')}</p>
            <ListenButton text={sayInEnglish} language="en" label={mineLines ? t('listen_english') : t('listen')} />
          </div>
          <p className="font-medium text-lg text-muted">— {profile.name}</p>
        </div>
      </div>

      {/* Tone */}
      <fieldset className="space-y-2">
        <legend className="font-bold mb-2" dir="auto">{t('how_talk')}</legend>
        <div className="grid gap-2">
          {Object.keys(TUTOR_TONES).map((id) => (
            <OptionButton key={id} selected={profile.tone === id} onClick={() => set('tone', id)}>
              <span className="block font-semibold" dir="auto">{t(`tone_${id}`)}</span>
              <span className="block text-small text-muted" dir="auto">{t(`tone_${id}_sub`)}</span>
            </OptionButton>
          ))}
        </div>
      </fieldset>

      {/* English mix */}
      {language !== 'en' && (
        <fieldset className="space-y-2">
          <legend className="font-bold mb-2" dir="auto">{t('how_much_english')}</legend>
          <div className="grid gap-2">
            {Object.keys(ENGLISH_MIX).map((id) => (
              <OptionButton key={id} selected={profile.english_mix === id} onClick={() => set('english_mix', id)}>
                <span className="font-semibold" dir="auto">{t(`mix_${id}`)}</span>
              </OptionButton>
            ))}
          </div>
          <p className="text-small text-muted" dir="auto">{t('mix_note')}</p>
        </fieldset>
      )}

      <div className="flex flex-col gap-2">
        <Button variant="main" className="w-full" disabled={saving} onClick={() => onSave(profile)}>
          {saving && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />} {saveLabel || t('save')}
        </Button>
        {onSkip && <Button variant="second" className="w-full" onClick={onSkip}>{t('skip')}</Button>}
      </div>
    </div>
  );
}
