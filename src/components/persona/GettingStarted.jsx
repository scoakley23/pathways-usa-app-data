import React, { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import TutorMessage from './TutorMessage';
import useTutorProfile from './useTutorProfile';
import useTranslatedLines from './useTranslatedLines';
import { getAvailableVoices, speakText } from '@/components/utils/textToSpeech';
import { markOnboarded, nextStep, saveFiledAnswer, saveStage, loadStage } from '@/lib/onboarding';
import { DEFAULT_PER_DAY } from '@/lib/dailyMinutes';
import { today as todayApi } from '@/api/today';
import { Button } from '@/components/pathways/ui';
import LanguageStep, { nativeName } from '@/components/onboarding/LanguageStep';
import HowAmioWorksStep from '@/components/onboarding/HowAmioWorksStep';
import PlanStep from '@/components/onboarding/PlanStep';
import useOnboardingText from '@/components/onboarding/useOnboardingText';
import { LANGUAGES } from '@/lib/languages';
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
  no_voice: 'Este teléfono no tiene voz para su idioma, así que hablaré en inglés. Su idioma seguirá en la pantalla.',
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
  program_share_help: 'Verían sus niveles de la evaluación rápida, las lecciones que terminó, sus puntajes de las lecciones, los puntos de control que pasó y las secciones del N-400 que leyó. Puede cambiarlo después en «Yo».',
  program_error: 'Algo salió mal. Por favor, intente otra vez.',
  continue: 'Continuar',
  skip: 'Saltar',
};
const CACHE_KEY = 'onboarding_v8';

function ChoiceButton({ selected, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`w-full min-h-[56px] rounded-card border-2 px-4 py-3 text-start text-lg font-bold text-navy flex items-center gap-3 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim focus-visible:ring-offset-2 ${
        selected ? 'border-navy bg-white' : 'border-line bg-white hover:border-navy'
      } ${className}`}
    >
      <span className="flex-1 min-w-0">{children}</span>
      {selected && <Check className="w-5 h-5 shrink-0 text-navy" aria-hidden="true" />}
    </button>
  );
}

// First open (Amio v2), after Welcome and the sign-in: Your language
// (OnboardLanguage), How Amio works (OnboardHowItWorks) and Your plan
// (OnboardPlan: the stage question, which civics test once sent, and about
// 5 / 10 / 15 min a day = lessons_per_day 1 / 2 / 3), then the partner program
// question exactly as before (only when there are programs). Sound and text
// size are in Settings. The quick check comes next and only suggests where
// to start.
export default function GettingStarted({ language, onLanguageChange, onDone }) {
  const { profile } = useTutorProfile();
  const tr = useTranslatedLines(LINES, language, { cacheKey: CACHE_KEY, handWritten: { es: LINES_ES } });
  const { t, rtl } = useOnboardingText(language);
  const [step, setStep] = useState('language');
  const [stage, setStage] = useState(loadStage);
  const [filed, setFiled] = useState(null);
  const [perDay, setPerDay] = useState(DEFAULT_PER_DAY);
  const [savingPlan, setSavingPlan] = useState(false);
  const [noVoice, setNoVoice] = useState(false);
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
  const fill = (s) => (s || '').split('{name}').join(profile.name);
  const say = (key) => ({ en: fill(LINES[key]), mine: language !== 'en' ? fill(tr(key)) || null : null });
  const label = (key) => (language !== 'en' && tr(key)) || LINES[key];
  // Wait a moment for a translation that is still loading before reading.
  const readDelay = language !== 'en' && !tr('continue') ? 1500 : 0;
  const go = (next, answers = {}) => {
    const n = next || nextStep(step, { hasPrograms, ...answers });
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

  const languageName = nativeName((LANGUAGES.find((l) => l.value === language) || LANGUAGES[0]).label);

  // Make my plan: the stage and civics test are already saved on the device
  // when tapped; lessons per day goes where Your plan saves it (the profile on
  // Supabase, this device on Base44). A failed save never blocks first open.
  const savePlan = async () => {
    setSavingPlan(true);
    try { await todayApi.setLessonsPerDay(perDay); } catch { /* Your plan can set it later */ }
    setSavingPlan(false);
    go();
  };

  if (step === 'language') {
    return (
      <LanguageStep
        language={language}
        t={t}
        rtl={rtl}
        onPick={pickLanguage}
        onContinue={() => go()}
        note={noVoice ? <p className="rounded-card bg-tint p-4 text-base text-navy">{label('no_voice')}</p> : null}
      />
    );
  }

  if (step === 'how') return <HowAmioWorksStep t={t} rtl={rtl} languageName={languageName} onContinue={() => go()} />;

  if (step === 'plan') {
    return (
      <PlanStep
        t={t}
        rtl={rtl}
        label={label}
        stage={stage}
        onStage={(s) => { setStage(s); saveStage(s); }}
        filed={filed}
        onFiled={(a) => { setFiled(a); saveFiledAnswer(a); }}
        perDay={perDay}
        onPerDay={setPerDay}
        busy={savingPlan}
        onDone={savePlan}
      />
    );
  }

  // The partner program question, exactly as before (Amio v2 paper top in
  // amio-v2/leftovers: the title and Skip, no navy banner).
  return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-5 flex flex-col gap-5 text-navy">
      <div className="flex items-start justify-between gap-3">
        <h1 className="font-display text-[1.75rem] leading-tight" dir="auto">{label('title')}</h1>
        <Button variant="link" onClick={finish}>{label('skip')}</Button>
      </div>
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
                  className="w-full min-h-[56px] rounded-button border-2 border-line bg-white px-4 text-lg font-bold text-navy focus:outline-none focus:border-denim focus:ring-2 focus:ring-denim/20"
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

      </div>
    </div>
  );
}