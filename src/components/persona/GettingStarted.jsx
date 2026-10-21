import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Volume2, VolumeX } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import TutorMessage from './TutorMessage';
import TextSizePicker from './TextSizePicker';
import PlanSetup from './PlanSetup';
import useTutorProfile from './useTutorProfile';
import useTranslatedLines from './useTranslatedLines';
import { useAutoReadSetting } from './useAutoRead';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { getAvailableVoices, speakText } from '@/components/utils/textToSpeech';
import { TUTOR_AVATARS } from '@/lib/tutorPersona';
import { markOnboarded, nextStep, onboardingSteps, saveFiledAnswer, saveStage, loadStage } from '@/lib/onboarding';
import { PrimaryButton, QuietButton, SegmentedProgress } from '@/components/pathways/ui';

// English source text. Spanish is written by hand; other languages are
// translated once by AI and cached on the device (bump the cache key when
// the English changes).
const LINES = {
  title: 'Getting started',
  language_ask: "Hi, I'm {name}, your tutor. Which language should I use to explain things? We will practice English together.",
  no_voice: "This phone has no voice for your language, so I will speak in English. Your language will still be on the screen.",
  tutor_ask: 'Choose the face you want to see when I teach you. You can change it later in Profile.',
  stage_ask: 'Where are you in the citizenship process? Your answer stays on this phone. It helps me plan your practice.',
  stage_preparing: 'Getting ready to apply',
  stage_applied: 'I sent my N-400',
  stage_interview: 'My interview is scheduled',
  stage_learning: 'Just learning for now',
  filed_ask: 'Did you send your N-400 before October 20, 2025? This tells us which civics test you will take.',
  filed_before: 'Before October 20, 2025',
  filed_after: 'On or after October 20, 2025',
  filed_unsure: "I'm not sure",
  filed_link: 'Which test will I take? (uscis.gov)',
  settings_ask: 'Last step. I will read everything out loud for you. You can turn this off, and make the text bigger.',
  read_on: 'Read out loud for me',
  read_off: 'No sound, please',
  start_check: 'Start the quick check',
  continue: 'Continue',
  skip: 'Skip setup',
};
const LINES_ES = {
  title: 'Primeros pasos',
  language_ask: 'Hola, soy {name}. Le voy a enseñar. ¿En qué idioma le explico las cosas? Vamos a practicar inglés.',
  no_voice: 'Este teléfono no tiene voz para su idioma, así que hablaré en inglés. Su idioma seguirá en la pantalla.',
  tutor_ask: 'Elija la cara que quiere ver cuando le enseño. Puede cambiarla después en Perfil.',
  stage_ask: '¿En qué parte del proceso de ciudadanía está? Su respuesta se queda en este teléfono. Me ayuda a planear su práctica.',
  stage_preparing: 'Preparándome para aplicar',
  stage_applied: 'Ya envié mi N-400',
  stage_interview: 'Ya tengo fecha de entrevista',
  stage_learning: 'Solo estoy aprendiendo',
  filed_ask: '¿Envió su N-400 antes del 20 de octubre de 2025? Así sabemos qué examen de educación cívica tomará.',
  filed_before: 'Antes del 20 de octubre de 2025',
  filed_after: 'El 20 de octubre de 2025 o después',
  filed_unsure: 'No estoy seguro/a',
  filed_link: '¿Qué examen tomaré? (uscis.gov)',
  settings_ask: 'Último paso. Le leeré todo en voz alta. Puede apagarlo y hacer el texto más grande.',
  read_on: 'Léame en voz alta',
  read_off: 'Sin sonido, por favor',
  start_check: 'Empezar la evaluación rápida',
  continue: 'Continuar',
  skip: 'Saltar',
};
const CACHE_KEY = 'onboarding_v1';
const USCIS_TEST = 'https://www.uscis.gov/citizenship/2025-test';

// "Start" in several languages, for the very first screen (before the
// learner has picked one). Tapping it also lets the browser play speech.
const START_WORDS = ['Start', 'Empezar', '开始', 'Bắt đầu', 'Magsimula', '시작', 'ابدأ', 'Commencer', 'Начать', 'Começar', 'Kòmanse'];

const nativeName = (label) => label.split(' (')[0];
const englishName = (label) => (label.match(/\(([^)]+)\)/) || [])[1] || label;

function ChoiceButton({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full min-h-[56px] rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 ${
        selected ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/50'
      } ${className}`}
    >
      <span className="flex-1 min-w-0">{children}</span>
      {selected && <Check className="w-5 h-5 shrink-0" aria-hidden="true" />}
    </button>
  );
}

// The questions before the first quick check: language, tutor picture,
// where they are in the process (and which civics test / interview month
// when that applies), then sound and text size. Every step can be skipped.
export default function GettingStarted({ language, onLanguageChange, onDone }) {
  const { profile, saveProfile } = useTutorProfile();
  const tr = useTranslatedLines(LINES, language, { cacheKey: CACHE_KEY, handWritten: { es: LINES_ES } });
  const [step, setStep] = useState('start');
  const [stage, setStage] = useState(loadStage);
  const [noVoice, setNoVoice] = useState(false);
  const [readOn, setReadOn] = useAutoReadSetting();

  const steps = onboardingSteps({ stage });
  const fill = (s) => (s || '').split('{name}').join(profile.name);
  const say = (key) => ({ en: fill(LINES[key]), mine: language !== 'en' ? fill(tr(key)) || null : null });
  const label = (key) => (language !== 'en' && tr(key)) || LINES[key];
  // Wait a moment for a translation that is still loading before reading.
  const readDelay = language !== 'en' && !tr('continue') ? 1500 : 0;
  const go = (next, answers = { stage }) => {
    const n = next || nextStep(step, answers);
    if (!n) { finish(); return; }
    setStep(n);
    window.scrollTo({ top: 0 });
  };
  const finish = () => { markOnboarded(); onDone(); };

  // Does this device have a voice for the chosen language?
  useEffect(() => {
    let active = true;
    if (language === 'en') { setNoVoice(false); return undefined; }
    getAvailableVoices(language).then((v) => { if (active) setNoVoice(v.length === 0); });
    return () => { active = false; };
  }, [language]);

  const pickLanguage = (value, labelText) => {
    onLanguageChange(value);
    getAvailableVoices(value).then((v) => {
      if (value === 'en' || v.length) speakText(nativeName(labelText), value);
    });
  };

  const options = (keys) => ({ en: keys.map((k) => LINES[k]).join('. ') + '.', mine: language !== 'en' && tr(keys[0]) ? keys.map((k) => tr(k)).join('. ') + '.' : null });

  if (step === 'start') {
    return (
      <div className="space-y-6 text-pw-navy text-center pt-4">
        <div className="mx-auto w-fit rounded-full bg-white p-2 shadow-lift">
          <TutorAvatar avatar={profile.avatar} size={144} expression="greeting" decorative />
        </div>
        <div className="space-y-2">
          <h1 className="text-[32px] leading-tight font-extrabold">Welcome</h1>
          <p className="text-lg text-pw-muted">Tap Start. Your tutor will talk with you.</p>
          <p className="text-lg text-pw-muted" lang="es">Toque Empezar. Le hablaremos en voz alta.</p>
        </div>
        <button
          type="button"
          onClick={() => go('language')}
          className="w-full min-h-[88px] rounded-3xl bg-pw-navy text-white shadow-lift hover:bg-pw-navy-deep px-4 py-3 flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pw-red/40"
        >
          <span className="text-2xl font-extrabold flex items-center gap-2"><Volume2 className="w-7 h-7" aria-hidden="true" /> Start</span>
          <span className="text-base font-semibold text-white/80" aria-hidden="true">{START_WORDS.slice(1).join(' · ')}</span>
        </button>
        <QuietButton className="w-full" onClick={finish}>Skip setup</QuietButton>
      </div>
    );
  }

  const position = steps.indexOf(step) - 1;
  return (
    <div className="space-y-5 text-pw-navy">
      <div className="flex items-center gap-3">
        <div className="flex-1"><SegmentedProgress current={position} total={steps.length - 1} label={`Getting started, step ${position + 1} of ${steps.length - 1}`} /></div>
        <QuietButton className="shrink-0 text-base" onClick={finish}>{label('skip')}</QuietButton>
      </div>
      <h1 className="text-[28px] leading-tight font-extrabold">{label('title')}</h1>

      {step === 'language' && (
        <>
          <TutorMessage profile={profile} language={language} expression="greeting" {...say('language_ask')} readDelay={readDelay} />
          {noVoice && <p className="rounded-2xl bg-pw-soft p-4 text-base">{label('no_voice')}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Language">
            {LANGUAGES.map((l) => (
              <ChoiceButton key={l.value} selected={language === l.value} onClick={() => pickLanguage(l.value, l.label)}>
                <span className="block" lang={l.value}>{nativeName(l.label)}</span>
                {nativeName(l.label) !== englishName(l.label) && <span className="block text-sm font-semibold text-pw-muted">{englishName(l.label)}</span>}
              </ChoiceButton>
            ))}
          </div>
          <div className="sticky bottom-0 -mx-4 px-4 pt-4 pb-4 bg-gradient-to-t from-pw-page via-pw-page to-transparent">
            <PrimaryButton large className="w-full" onClick={() => go()}>{label('continue')}</PrimaryButton>
          </div>
        </>
      )}

      {step === 'tutor' && (
        <>
          <TutorMessage profile={profile} language={language} {...say('tutor_ask')} readDelay={readDelay} />
          <div className="grid grid-cols-3 gap-3" role="group" aria-label="Tutor picture">
            {TUTOR_AVATARS.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={profile.avatar === id}
                onClick={() => saveProfile({ ...profile, avatar: id }).catch(() => {})}
                className={`rounded-3xl border-2 p-2 grid place-items-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2 ${
                  profile.avatar === id ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/50'
                }`}
              >
                <TutorAvatar avatar={id} size={88} expression={profile.avatar === id ? 'greeting' : 'default'} />
              </button>
            ))}
          </div>
          <PrimaryButton large className="w-full" onClick={() => go()}>{label('continue')}</PrimaryButton>
        </>
      )}

      {step === 'stage' && (
        <>
          <TutorMessage
            profile={profile}
            language={language}
            {...say('stage_ask')}
            readAlso={options(['stage_preparing', 'stage_applied', 'stage_interview', 'stage_learning'])}
            readDelay={readDelay}
          />
          <div className="space-y-2" role="group" aria-label="Where you are">
            {['preparing', 'applied', 'interview', 'learning'].map((s) => (
              <ChoiceButton
                key={s}
                selected={stage === s}
                onClick={() => { setStage(s); saveStage(s); go(null, { stage: s }); }}
              >
                {label(`stage_${s}`)}
              </ChoiceButton>
            ))}
          </div>
        </>
      )}

      {step === 'filed' && (
        <>
          <TutorMessage
            profile={profile}
            language={language}
            {...say('filed_ask')}
            readAlso={options(['filed_before', 'filed_after', 'filed_unsure'])}
            readDelay={readDelay}
          />
          <div className="space-y-2" role="group" aria-label="When you sent Form N-400">
            {['before', 'after', 'unsure'].map((a) => (
              <ChoiceButton key={a} onClick={() => { saveFiledAnswer(a); go(); }}>{label(`filed_${a}`)}</ChoiceButton>
            ))}
          </div>
          <a
            href={USCIS_TEST}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-11 text-base font-bold underline underline-offset-4 decoration-pw-red/60 hover:decoration-pw-red"
          >
            {label('filed_link')} <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </>
      )}

      {step === 'interview' && (
        <PlanSetup profile={profile} language={language} onDone={() => go()} />
      )}

      {step === 'settings' && (
        <>
          <TutorMessage profile={profile} language={language} {...say('settings_ask')} readDelay={readDelay} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2" role="group" aria-label="Sound">
            <ChoiceButton selected={readOn} onClick={() => setReadOn(true)}>
              <span className="flex items-center gap-2"><Volume2 className="w-5 h-5 shrink-0" aria-hidden="true" /> {label('read_on')}</span>
            </ChoiceButton>
            <ChoiceButton selected={!readOn} onClick={() => setReadOn(false)}>
              <span className="flex items-center gap-2"><VolumeX className="w-5 h-5 shrink-0" aria-hidden="true" /> {label('read_off')}</span>
            </ChoiceButton>
          </div>
          <TextSizePicker />
          <PrimaryButton large className="w-full" onClick={finish}>{label('start_check')}</PrimaryButton>
        </>
      )}
    </div>
  );
}
