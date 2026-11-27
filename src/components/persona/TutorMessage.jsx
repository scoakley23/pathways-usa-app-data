import React, { useEffect, useId } from 'react';
import { Square, Volume2 } from 'lucide-react';
import useTextSize from './useTextSize';
import useAutoRead, { currentSpeakingId, readAloud, stopReading, useSpeakingId } from './useAutoRead';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';
import { speakText } from '@/components/utils/textToSpeech';
import { spokenTutorName } from '@/lib/tutorPersona';
import { Chip } from '@/components/pathways/ui';
import { Amio, AmioSays } from '@/components/pathways/Amio';
import useLearnText from '@/components/lessons/useLearnText';

// `onNavy`: for a navy top (a navy-2 chip instead of the sand pill).
export function ListenButton({ text, language, label: givenLabel, tutorName, onNavy = false, className = '' }) {
  const { t } = useLearnText();
  const label = givenLabel || t('listen');
  const say = () => {
    stopReading();
    const spoken = tutorName ? text.split(tutorName).join(spokenTutorName(tutorName, language)) : text;
    speakText(spoken, language);
  };
  if (onNavy) {
    return (
      <Chip onNavy onClick={say} className={className}>
        <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {label}
      </Chip>
    );
  }
  return (
    <Chip onClick={say} className={className}>
      <Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {label}
    </Chip>
  );
}

// Amio's message (Amio v2, amio-v2/old-lessons). A short line is Amio's
// bubble (AmioSays); a longer explanation (more than one line, or with
// `children`) is Amio with "Amio · AI tutor" over a white card, so Amio
// still says one short thing and the card holds the rest. `mine` is the text
// in the learner's language; `en` the English version, shown under it.
// Every message has Listen (and "English" when both are shown).
// `expression` is no longer shown.
// On auto-read screens (see useAutoRead) the message reads itself aloud when
// it appears, with a Stop button while it speaks. `readAlso` ({ mine, en }) is
// read after the message but not shown (e.g. the answer choices).
// `readDelay` waits before reading (e.g. for a translation still loading).
const SHORT = 140;
export default function TutorMessage({ profile, language = 'en', mine, en, children, readAlso, readDelay = 0 }) {
  const { className: sizeClass } = useTextSize();
  const { t } = useLearnText();
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

  const main = showMine ? mine : en;
  const hasExtra = React.Children.toArray(children).length > 0;
  const short = !hasExtra && !!main && !/\n/.test(main) && main.length <= SHORT;

  const buttons = (
    <div className="flex flex-wrap gap-2">
      {speaking ? (
        <Chip onClick={stopReading}>
          <Square className="w-4 h-4 shrink-0 fill-current" aria-hidden="true" /> {t('stop')}
        </Chip>
      ) : showMine ? (
        <>
          <ListenButton text={mine} language={language} tutorName={profile.name} label={t('listen')} />
          {en && <ListenButton text={en} language="en" label={t('english')} tutorName={profile.name} />}
        </>
      ) : (
        en && <ListenButton text={en} language="en" tutorName={profile.name} label={t('listen')} />
      )}
    </div>
  );

  return (
    <div className={`relative text-navy flex flex-col gap-2 ${sizeClass}`}>
      {speaking && <span className="pointer-events-none absolute -inset-1 rounded-card ring-4 ring-navy/20 motion-safe:animate-pulse" aria-hidden="true" />}
      {short ? (
        <>
          <AmioSays mood="hello" size={56}>
            <span dir={showMine ? dir : 'ltr'} lang={showMine ? language : 'en'} className="block">{main}</span>
          </AmioSays>
          {showMine && en && <p className="ps-16 text-base text-muted leading-relaxed" lang="en" dir="ltr">{en}</p>}
          <div className="ps-16">{buttons}</div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <Amio mood="speaking" size={40} />
            <span className="text-small font-semibold text-muted" dir="auto">{t('amio_label')}</span>
          </div>
          <div className="relative rounded-card bg-white border-[1.5px] border-line p-4 flex flex-col gap-3">
            {showMine ? (
              <div>
                <p dir={dir} lang={language} className="leading-relaxed whitespace-pre-line">{mine}</p>
                {en && <p lang="en" dir="ltr" className="leading-relaxed whitespace-pre-line text-muted mt-2">{en}</p>}
              </div>
            ) : (
              en && <p lang="en" dir="ltr" className="leading-relaxed whitespace-pre-line">{en}</p>
            )}
            {buttons}
            {children}
          </div>
        </>
      )}
    </div>
  );
}
