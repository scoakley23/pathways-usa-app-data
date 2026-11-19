import React, { useEffect, useState } from 'react';
import { Check, ExternalLink, Loader2, Volume2, VolumeX } from 'lucide-react';
import TutorMessage from './TutorMessage';
import TextSizePicker from './TextSizePicker';
import useTutorProfile from './useTutorProfile';
import useTranslatedLines from './useTranslatedLines';
import { useAutoReadSetting } from './useAutoRead';
import { getAvailableVoices, speakText } from '@/components/utils/textToSpeech';
import { markOnboarded, nextStep, onboardingSteps, saveFiledAnswer, saveStage, loadStage } from '@/lib/onboarding';
import { Button } from '@/components/pathways/ui';
import NavyBanner from '@/components/pathways/NavyBanner';
import { StepBar } from '@/components/pathways/StepBar';
import LanguageStep, { nativeName } from '@/components/onboarding/LanguageStep';
import MeetAmioStep from '@/components/onboarding/MeetAmioStep';
import useOnboardingText from '@/components/onboarding/useOnboardingText';
import { Checkbox } from '@/components/ui/checkbox';
import { listPartners, joinProgram } from '@/lib/partners';
import { loadPendingProgram, clearPendingProgram } from '@/lib/programLink';
import { MAX_NAME_LENGTH } from '@/lib/partners';

// English source text. Spanish is written by hand; other languages are
// translated once by AI and cached on the device (bump the cache key when
// the English changes).
import { GETTING_STARTED_LINES as LINES } from './gettingStartedStrings';
const LINES_ES = {
  title: 'Primeros pasos',
  language_ask: 'Hola, soy {name}. Le voy a enseñar. ¿En qué idioma le explico las cosas? Vamos a practicar inglés.',
  no_voice: 'Este teléfono no tiene voz para su idioma, así que hablaré en inglés. Su idioma seguirá en la pantalla.',
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
  program_share_help: 'Verían sus niveles de la evaluación rápida, las lecciones que terminó, sus estrellas, los puntos de control que pasó y las secciones del N-400 que leyó. Puede cambiarlo después en «Yo».',
  program_error: 'Algo salió mal. Por favor, intente otra vez.',
  settings_ask: 'Último paso. Le leeré todo en voz alta. Puede apagarlo y hacer el texto más grande.',
  read_on: 'Léame en voz alta',
  read_off: 'Sin sonido, por favor',
  start_check: 'Empezar la evaluación rápida',
  continue: 'Continuar',
  skip: 'Saltar',
};
const CACHE_KEY = 'onboarding_v6';
const USCIS_TEST = 'https://www.uscis.gov/citizenship/2025-test';

function ChoiceButton({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full min-h-[56px] rounded-card border-2 px-4 py-3 text-start text-lg font-bold text-navy flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${
        selected ? 'border-denim bg-tint' : 'border-line bg-white hover:border-denim'
      } ${className}`}
    >
      <span className="flex-1 min-w-0">{children}</span>
      {selected && <Check className="w-5 h-5 shrink-0 text-denim" aria-hidden="true" />}
    </button>
  );
}

// Getting started (Prompt 9), after Welcome and the sign-in: Choose your
// language (R30Language), Meet Amio (R30MeetAmio), then the pilot sign-up
// questions exactly as before: where they are in the process (and which
// civics test once they have applied), which partner program they study
// with (when there are any), then sound and text size. Every step can be
// skipped. The interview month is asked on Your plan, after the quick check.
export default function GettingStarted({ language, onLanguageChange, onDone }) {
  const { profile } = useTutorProfile();
  const tr = useTranslatedLines(LINES, language, { cacheKey: CACHE_KEY, handWritten: { es: LINES_ES } });
  const { t } = useOnboardingText(language);
  const [step, setStep] = useState('language');
  const [stage, setStage] = useState(loadStage);
  const [noVoice, setNoVoice] = useState(false);
  const [readOn, setReadOn] = useAutoReadSetting();
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

  if (step === 'language') {
    return (
      <LanguageStep
        language={language}
        t={t}
        onPick={pickLanguage}
        onContinue={() => go()}
        note={noVoice ? <p className="rounded-card bg-tint p-4 text-base text-navy">{label('no_voice')}</p> : null}
      />
    );
  }

  if (step === 'meet') return <MeetAmioStep t={t} onContinue={() => go()} />;

  const position = steps.indexOf(step) - 1; // after language and Meet Amio
  const asked = steps.length - 2;
  return (
    <div className="min-h-screen bg-paper">
      <NavyBanner
        title={label('title')}
        right={<Button variant="link" onNavy onClick={finish}>{label('skip')}</Button>}
        extra={<StepBar total={asked} current={position} label={`${label('title')}: ${position} / ${asked}`} />}
      />
      <div className="max-w-lg mx-auto px-4 py-5 flex flex-col gap-5 text-navy">
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
            className="inline-flex items-center gap-2 min-h-11 text-base font-bold text-denim underline underline-offset-4 decoration-denim/40 hover:decoration-denim"
          >
            {label('filed_link')} <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </>
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
                <p id="onboarding-program-name-help" className="text-base text-muted">{label('program_name_help').split('{program}').join(program.name)}</p>
                <input
                  id="onboarding-program-name"
                  value={learnerName}
                  maxLength={MAX_NAME_LENGTH}
                  autoComplete="name"
                  aria-describedby="onboarding-program-name-help"
                  onChange={(e) => setLearnerName(e.target.value)}
                  className="w-full min-h-[56px] rounded-2xl border-2 border-line bg-white px-4 text-lg font-bold text-navy focus:outline-none focus:border-denim focus:ring-2 focus:ring-denim/20"
                />
              </div>
              {program.shareLearners && (
                <label htmlFor="onboarding-program-share" className="flex items-start gap-3 min-h-11 cursor-pointer">
                  <Checkbox id="onboarding-program-share" checked={share} onCheckedChange={(v) => setShare(v === true)} className="mt-1 h-5 w-5" />
                  <span className="text-base">
                    <span className="block font-bold">{label('program_share').split('{program}').join(program.name)}</span>
                    <span className="block text-muted">{label('program_share_help')}</span>
                  </span>
                </label>
              )}
              {joinError && <p role="alert" className="text-base font-semibold text-not-yet">{label('program_error')}</p>}
              <Button variant="main" type="submit" className="w-full" disabled={joining}>
                {joining && <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />}
                {label('continue')}
              </Button>
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
          <Button variant="main" className="w-full" onClick={finish}>{label('start_check')}</Button>
        </>
      )}
      </div>
    </div>
  );
}