import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, Volume2, VolumeX } from 'lucide-react';
import TutorAvatar from './TutorAvatar';
import TutorMessage from './TutorMessage';
import TextSizePicker from './TextSizePicker';
import PlanSetup from './PlanSetup';
import { NameSuggestions } from './TutorChoices';
import useTutorProfile from './useTutorProfile';
import useTranslatedLines from './useTranslatedLines';
import { useAutoReadSetting } from './useAutoRead';
import { LANGUAGES } from '@/hooks/useLessonTranslation';
import { getAvailableVoices, speakText } from '@/components/utils/textToSpeech';
import { MAX_TUTOR_NAME_LENGTH } from '@/lib/tutorPersona';
import { markOnboarded, nextStep, onboardingSteps, saveFiledAnswer, saveStage, loadStage } from '@/lib/onboarding';
import { PrimaryButton, QuietButton, SegmentedProgress } from '@/components/pathways/ui';
import { Checkbox } from '@/components/ui/checkbox';
import { listPartners, joinProgram } from '@/lib/partners';
import { loadPendingProgram, clearPendingProgram } from '@/lib/programLink';
import { MAX_NAME_LENGTH } from '../../../base44/shared/partners.js';

// English source text. Spanish is written by hand; other languages are
// translated once by AI and cached on the device (bump the cache key when
// the English changes).
const LINES = {
  title: 'Getting started',
  language_ask: "Hi, I'm {name}, your tutor. Which language should I use to explain things? We will practice English together.",
  no_voice: "This phone has no voice for your language, so I will speak in English. Your language will still be on the screen.",
  name_ask: 'What would you like to call me? Pick a name or write your own. You can change it later in Profile.',
  name_label: 'Tutor name',
  name_ideas: 'Name ideas',
  name_via: '“Vía” means “way” or “path” in Spanish.',
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
  program_ask: "Are you studying with a class or program? If you are, they can confirm it's you and see how their learners are doing overall. Never your answers or our chats.",
  program_none: "No, I'm studying on my own",
  program_name_label: 'Your name (optional)',
  program_name_help: "So {program} knows it's you. If you leave it blank, they see your email.",
  program_share: 'Share my progress with {program}',
  program_share_help: 'They would see your quick check levels, the lessons you finished and the N-400 sections you read. You can change this in Profile.',
  program_error: 'Something went wrong. Please try again.',
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
  name_ask: '¿Cómo quiere llamarme? Elija un nombre o escriba el suyo. Puede cambiarlo después en Perfil.',
  name_label: 'Nombre del tutor',
  name_ideas: 'Ideas de nombres',
  name_via: '“Vía” quiere decir “camino”.',
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
  program_ask: '¿Estudia con una clase o un programa? Si es así, pueden confirmar que es usted y ver cómo van sus estudiantes en general. Nunca sus respuestas ni nuestras conversaciones.',
  program_none: 'No, estudio por mi cuenta',
  program_name_label: 'Su nombre (opcional)',
  program_name_help: 'Para que {program} sepa que es usted. Si lo deja en blanco, verán su correo electrónico.',
  program_share: 'Compartir mi progreso con {program}',
  program_share_help: 'Verían sus niveles de la evaluación rápida, las lecciones que terminó y las secciones del N-400 que leyó. Puede cambiarlo en Perfil.',
  program_error: 'Algo salió mal. Por favor, intente otra vez.',
  settings_ask: 'Último paso. Le leeré todo en voz alta. Puede apagarlo y hacer el texto más grande.',
  read_on: 'Léame en voz alta',
  read_off: 'Sin sonido, por favor',
  start_check: 'Empezar la evaluación rápida',
  continue: 'Continuar',
  skip: 'Saltar',
};
const CACHE_KEY = 'onboarding_v3';
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
      className={`w-full min-h-[56px] rounded-2xl border-2 px-4 py-3 text-left text-lg font-bold flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-navy focus-visible:ring-offset-2 ${
        selected ? 'border-pw-navy bg-pw-soft' : 'border-pw-line bg-white hover:border-pw-navy/50'
      } ${className}`}
    >
      <span className="flex-1 min-w-0">{children}</span>
      {selected && <Check className="w-5 h-5 shrink-0" aria-hidden="true" />}
    </button>
  );
}

// The questions before the first quick check: language, tutor name,
// where they are in the process (and which civics test / interview month
// when that applies), which partner program they study with (when there
// are any), then sound and text size. Every step can be skipped.
export default function GettingStarted({ language, onLanguageChange, onDone }) {
  const { profile, saveProfile } = useTutorProfile();
  const tr = useTranslatedLines(LINES, language, { cacheKey: CACHE_KEY, handWritten: { es: LINES_ES } });
  const [step, setStep] = useState('start');
  const [stage, setStage] = useState(loadStage);
  const [noVoice, setNoVoice] = useState(false);
  const [readOn, setReadOn] = useAutoReadSetting();
  const [nameDraft, setNameDraft] = useState(null); // null until the learner edits it
  const [partners, setPartners] = useState([]);
  const [program, setProgram] = useState(null); // the picked partner
  const [learnerName, setLearnerName] = useState('');
  const [share, setShare] = useState(false);
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState(false);

  // Partner programs to pick from (none when signed out or none exist). A
  // partner's link (?program=CODE) picks theirs.
  useEffect(() => {
    let active = true;
    listPartners()
      .then((list) => {
        if (!active) return;
        setPartners(list);
        const pending = list.find((p) => p.code === loadPendingProgram());
        if (pending) setProgram(pending);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const hasPrograms = partners.length > 0;
  const steps = onboardingSteps({ stage, hasPrograms });
  const fill = (s) => (s || '').split('{name}').join(profile.name);
  const say = (key) => ({ en: fill(LINES[key]), mine: language !== 'en' ? fill(tr(key)) || null : null });
  const label = (key) => (language !== 'en' && tr(key)) || LINES[key];
  // Wait a moment for a translation that is still loading before reading.
  const readDelay = language !== 'en' && !tr('continue') ? 1500 : 0;
  const go = (next, answers = {}) => {
    const n = next || nextStep(step, { stage, hasPrograms, ...answers });
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
        <div className="mx-auto w-fit">
          <TutorAvatar name={profile.name} size={144} />
        </div>
        <div className="space-y-2">
          <h1 className="font-display text-[40px] leading-tight">Welcome</h1>
          <p className="text-lg text-pw-muted">Tap Start. Your tutor will talk with you.</p>
          <p className="text-lg text-pw-muted" lang="es">Toque Empezar. Le hablaremos en voz alta.</p>
        </div>
        <button
          type="button"
          onClick={() => go('language')}
          className="w-full min-h-[88px] rounded-[14px] bg-pw-navy text-white shadow-lift hover:bg-pw-navy-deep px-4 py-3 flex flex-col items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pw-navy/40"
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
      <h1 className="font-display text-[36px] leading-tight">{label('title')}</h1>

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

      {step === 'name' && (
        <>
          <TutorMessage profile={profile} language={language} {...say('name_ask')} readDelay={readDelay} />
          <div className="space-y-2">
            <label htmlFor="onboarding-tutor-name" className="block text-lg font-bold">{label('name_label')}</label>
            <input
              id="onboarding-tutor-name"
              value={nameDraft ?? profile.name}
              maxLength={MAX_TUTOR_NAME_LENGTH}
              autoComplete="off"
              onChange={(e) => setNameDraft(e.target.value)}
              className="w-full min-h-[56px] rounded-2xl border-2 border-pw-line bg-white px-4 text-lg font-bold text-pw-navy focus:outline-none focus:border-pw-navy focus:ring-2 focus:ring-pw-navy/20"
            />
            <p className="text-base text-pw-muted">{label('name_via')}</p>
          </div>
          <NameSuggestions value={nameDraft ?? profile.name} onPick={setNameDraft} label={label('name_ideas')} />
          <PrimaryButton
            large
            className="w-full"
            onClick={() => {
              if (nameDraft !== null && nameDraft.trim() !== profile.name) saveProfile({ ...profile, name: nameDraft }).catch(() => {});
              go();
            }}
          >
            {label('continue')}
          </PrimaryButton>
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
            className="inline-flex items-center gap-2 min-h-11 text-base font-bold underline underline-offset-4 decoration-pw-navy/40 hover:decoration-pw-navy"
          >
            {label('filed_link')} <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </>
      )}

      {step === 'interview' && (
        <PlanSetup profile={profile} language={language} onDone={() => go()} />
      )}

      {step === 'program' && (
        <>
          <TutorMessage
            profile={profile}
            language={language}
            {...say('program_ask')}
            readAlso={{ en: [...partners.map((p) => p.name), LINES.program_none].join('. ') + '.', mine: language !== 'en' && tr('program_none') ? [...partners.map((p) => p.name), tr('program_none')].join('. ') + '.' : null }}
            readDelay={readDelay}
          />
          <div className="space-y-2" role="group" aria-label="Your program">
            {partners.map((p) => (
              <ChoiceButton key={p.code} selected={program?.code === p.code} onClick={() => { setProgram(p); setShare(false); setJoinError(false); }}>
                {p.name}
              </ChoiceButton>
            ))}
            <ChoiceButton onClick={() => { setProgram(null); clearPendingProgram(); go(); }}>{label('program_none')}</ChoiceButton>
          </div>
          {program && (
            <form
              className="space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setJoining(true);
                setJoinError(false);
                try {
                  await joinProgram(program.code, { name: learnerName, share });
                  clearPendingProgram();
                  go();
                } catch (err) {
                  setJoinError(true);
                } finally {
                  setJoining(false);
                }
              }}
            >
              <div className="space-y-2">
                <label htmlFor="onboarding-program-name" className="block text-lg font-bold">{label('program_name_label')}</label>
                <p id="onboarding-program-name-help" className="text-base text-pw-muted">{label('program_name_help').split('{program}').join(program.name)}</p>
                <input
                  id="onboarding-program-name"
                  value={learnerName}
                  maxLength={MAX_NAME_LENGTH}
                  autoComplete="name"
                  aria-describedby="onboarding-program-name-help"
                  onChange={(e) => setLearnerName(e.target.value)}
                  className="w-full min-h-[56px] rounded-2xl border-2 border-pw-line bg-white px-4 text-lg font-bold text-pw-navy focus:outline-none focus:border-pw-navy focus:ring-2 focus:ring-pw-navy/20"
                />
              </div>
              {program.shareLearners && (
                <label htmlFor="onboarding-program-share" className="flex items-start gap-3 min-h-11 cursor-pointer">
                  <Checkbox id="onboarding-program-share" checked={share} onCheckedChange={(v) => setShare(v === true)} className="mt-1 h-5 w-5" />
                  <span className="text-base">
                    <span className="block font-bold">{label('program_share').split('{program}').join(program.name)}</span>
                    <span className="block text-pw-muted">{label('program_share_help')}</span>
                  </span>
                </label>
              )}
              {joinError && <p role="alert" className="text-base font-semibold text-pw-red-ink">{label('program_error')}</p>}
              <PrimaryButton large type="submit" className="w-full" disabled={joining}>
                {joining && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                {label('continue')}
              </PrimaryButton>
            </form>
          )}
        </>
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
