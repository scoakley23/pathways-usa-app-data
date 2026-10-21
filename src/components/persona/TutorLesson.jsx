import React, { useEffect, useState } from 'react';
import { Loader2, Mic, MicOff, Check } from 'lucide-react';
import TutorMessage, { ListenButton } from './TutorMessage';
import TeachingFeedback from './TeachingFeedback';
import useTextSize from './useTextSize';
import useTutorLines from './useTutorLines';
import useSpeechCapture from './useSpeechCapture';
import { speakText } from '@/components/utils/textToSpeech';
import { checkCivicsAnswer } from '@/components/civics/checkCivicsAnswer';
import { buildTutorInstructions } from '@/lib/tutorPersona';
import { checkDictation, matchOfficialAnswer, splitOfficialAnswers } from '@/lib/practiceChecks';
import { canContinue, progressLabel, progressPercent } from '@/lib/tutorLesson';

const NAVY = '#14264A';
const card = 'rounded-2xl border border-[#DEE4EE] bg-white p-4';
const primaryBtn = 'min-h-[44px] w-full rounded-xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-50';

// ---- Steps -----------------------------------------------------------------

function ExplainStep({ step, ctx }) {
  return <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.text.mine} en={step.text.en} />;
}

function ShowEnglishStep({ step, ctx }) {
  const accepted = splitOfficialAnswers(step.question.answer);
  return (
    <div className="space-y-3">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('showEnglish')} />
      <div className={`${card} ${ctx.sizeClass}`} style={{ color: NAVY }}>
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4A5A78]">The officer asks</p>
        <p className="font-bold text-xl leading-snug">{step.question.question}</p>
        <ListenButton text={step.question.question} language="en" />
        <p className="text-sm font-semibold uppercase tracking-wide text-[#4A5A78] mt-3">Accepted answers</p>
        <ul className="list-disc pl-5 space-y-1">
          {accepted.map((a) => <li key={a} className="font-semibold">{a}</li>)}
        </ul>
        <ListenButton text={accepted.join('. ')} language="en" />
      </div>
    </div>
  );
}

function SpeakingStep({ step, ctx, state, setState }) {
  const { question } = step;
  const accepted = splitOfficialAnswers(question.answer);
  const [checking, setChecking] = useState(false);
  const [typed, setTyped] = useState('');

  const evaluate = async (answer, wasTyped) => {
    if (!answer.trim()) return;
    if (wasTyped) {
      // Typed text never goes to the AI here: check on the device.
      const { isCorrect } = matchOfficialAnswer(answer, question.answer);
      setState({ answered: true, result: { isCorrect, tip: isCorrect ? null : ctx.ui('keyWordsTip') } });
      return;
    }
    setChecking(true);
    try {
      const r = await checkCivicsAnswer(question, answer, {
        teach: { instructions: buildTutorInstructions(ctx.profile, ctx.languageName), languageName: ctx.languageName },
      });
      setState({
        answered: true,
        heard: answer,
        result: {
          isCorrect: !!r.is_correct,
          right: { en: r.what_was_right_en, mine: r.what_was_right_mine },
          tip: { en: r.tip_en, mine: r.tip_mine },
        },
      });
    } catch (e) {
      const { isCorrect } = matchOfficialAnswer(answer, question.answer);
      setState({ answered: true, heard: answer, result: { isCorrect, tip: isCorrect ? null : ctx.ui('keyWordsTip') } });
    } finally {
      setChecking(false);
    }
  };

  const speech = useSpeechCapture((t) => evaluate(t, false));
  const reset = () => { speech.reset(); setTyped(''); setState({}); };
  const showMe = () => { setState({ ...state, shown: true }); speakText(accepted[0] || '', 'en'); };

  return (
    <div className="space-y-3">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('speakPrompt')} />
      <div className={`${card} ${ctx.sizeClass} space-y-3`} style={{ color: NAVY }}>
        <p className="font-bold text-xl leading-snug">{question.question}</p>
        <ListenButton text={question.question} language="en" />

        {!state.result && (speech.supported ? (
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={speech.listening ? speech.stop : speech.start}
              disabled={checking}
              aria-label={speech.listening ? 'Stop' : 'Answer out loud'}
              className="w-16 h-16 rounded-full text-white inline-flex items-center justify-center shadow disabled:opacity-50"
              style={{ backgroundColor: speech.listening ? '#D9483F' : NAVY }}
            >
              {speech.listening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>
            <p className="text-base text-[#4A5A78]">
              {checking ? 'Checking…' : speech.listening ? 'Listening… tap to stop' : 'Tap and answer in English'}
            </p>
            {speech.transcript && <p className="italic">“{speech.transcript}”</p>}
            {checking && <Loader2 className="w-5 h-5 animate-spin" />}
          </div>
        ) : (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); evaluate(typed, true); }}>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Type your answer in English"
              className="flex-1 min-h-[44px] rounded-xl border border-[#DEE4EE] px-3 text-base"
            />
            <button type="submit" className="min-h-[44px] rounded-xl px-4 font-semibold text-white" style={{ backgroundColor: NAVY }}>Check</button>
          </form>
        ))}
        {state.heard && <p className="text-base text-[#4A5A78]">You said: <span className="italic">“{state.heard}”</span></p>}
      </div>

      {state.result && (
        <TeachingFeedback
          profile={ctx.profile}
          language={ctx.language}
          line={ctx.line}
          isCorrect={state.result.isCorrect}
          rightText={state.result.right}
          tipText={state.result.tip}
          accepted={accepted}
          shown={state.shown}
          onTryAgain={reset}
          onShowMe={showMe}
        />
      )}
    </div>
  );
}

function WritingStep({ step, ctx, state, setState }) {
  const [typed, setTyped] = useState('');
  const say = () => speakText(step.sentence, 'en');
  useEffect(() => { say(); }, [step.sentence]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    const r = checkDictation(step.sentence, typed);
    const words = `${r.missing.join(', ')}.`;
    const again = ctx.ui('listenAgain');
    const tip = r.isCorrect ? null : { en: `${again.en} ${words}`, mine: again.mine && `${again.mine} ${words}` };
    setState({ answered: true, result: { isCorrect: r.isCorrect, words: r.words, tip } });
  };

  return (
    <div className="space-y-3">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('writePrompt')} />
      <div className={`${card} ${ctx.sizeClass} space-y-3`} style={{ color: NAVY }}>
        <ListenButton text={step.sentence} language="en" label="Play the sentence" />
        {!state.result && (
          <form className="space-y-2" onSubmit={check}>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Write what you hear"
              autoCapitalize="sentences"
              className="w-full min-h-[44px] rounded-xl border border-[#DEE4EE] px-3 text-base"
            />
            <button type="submit" className={primaryBtn} style={{ backgroundColor: NAVY }}>Check</button>
          </form>
        )}
        {state.result && (
          <p className="flex flex-wrap gap-1">
            {state.result.words.map((w, i) => (
              <span key={i} className={`rounded px-1 ${w.status === 'correct' ? 'bg-[#E3F4EA]' : 'bg-[#FBE3E1] underline'}`}>{w.word}</span>
            ))}
          </p>
        )}
      </div>
      {state.result && (
        <TeachingFeedback
          profile={ctx.profile}
          language={ctx.language}
          line={ctx.line}
          isCorrect={state.result.isCorrect}
          tipText={state.result.tip}
          acceptLabel="The sentence"
          accepted={[step.sentence]}
          shown={state.shown}
          onTryAgain={() => { setTyped(''); setState({}); }}
          onShowMe={() => { setState({ ...state, shown: true }); say(); }}
        />
      )}
    </div>
  );
}

function CheckStep({ step, ctx, state, setState }) {
  const choose = (option) => {
    if (state.answered) return;
    setState({ answered: true, choice: option, result: { isCorrect: option === step.correct } });
  };
  return (
    <div className="space-y-3">
      <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.prompt.mine} en={step.prompt.en} />
      <div className={`grid gap-2 ${ctx.sizeClass}`}>
        {step.options.map((o) => {
          const isRight = state.answered && o === step.correct;
          const isWrongChoice = state.answered && o === state.choice && o !== step.correct;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              className={`min-h-[44px] rounded-2xl border-2 px-3 py-2 text-left font-semibold inline-flex items-center justify-between gap-2 ${
                isRight ? 'border-[#2E7D4F] bg-[#E3F4EA]' : isWrongChoice ? 'border-[#D9483F] bg-[#FBE3E1]' : 'border-[#DEE4EE] bg-white'
              }`}
              style={{ color: NAVY }}
            >
              {o} {isRight && <Check className="w-5 h-5 text-[#2E7D4F] shrink-0" />}
            </button>
          );
        })}
      </div>
      {state.result && (
        <TutorMessage
          profile={ctx.profile}
          language={ctx.language}
          {...(() => {
            const l = ctx.line(state.result.isCorrect ? 'wellDone' : 'tryAgain');
            const a = ctx.ui('correctIs');
            const add = (x, y) => (x && y ? `${x} ${y} ${step.correct}.` : null);
            return state.result.isCorrect ? l : { en: add(l.en, a.en), mine: add(l.mine, a.mine) };
          })()}
        />
      )}
    </div>
  );
}

const STEPS = {
  explain: ExplainStep,
  'show-english': ShowEnglishStep,
  'practice-speaking': SpeakingStep,
  'practice-writing': WritingStep,
  'check-understanding': CheckStep,
};

// ---- Lesson ----------------------------------------------------------------

// Fixed UI lines inside lessons (English + hand-written Spanish).
const UI = {
  showEnglish: { en: 'Here is the question and the answers the officer accepts. Listen and repeat.', es: 'Aquí está la pregunta y las respuestas que acepta el oficial. Escuche y repita.' },
  speakPrompt: { en: 'Now answer out loud, in English.', es: 'Ahora conteste en voz alta, en inglés.' },
  writePrompt: { en: 'Listen to the sentence. Then write it in English.', es: 'Escuche la oración. Luego escríbala en inglés.' },
  keyWordsTip: { en: 'Use the key words from one of the accepted answers.', es: 'Use las palabras clave de una de las respuestas aceptadas.' },
  correctIs: { en: 'The correct answer is:', es: 'La respuesta correcta es:' },
  listenAgain: { en: 'Listen again and check these words:', es: 'Escuche otra vez y revise estas palabras:' },
};

// One step at a time: "Step 2 of 4" with a progress bar, then one big
// Continue button that unlocks when the step is done.
export default function TutorLesson({ lesson, profile, language = 'en', languageName = 'English', onFinish }) {
  const [index, setIndex] = useState(0);
  const [states, setStates] = useState({});
  const { className: sizeClass } = useTextSize();
  const line = useTutorLines(profile, language);

  const steps = lesson.steps;
  const step = steps[index];
  const state = states[index] || {};
  const setState = (s) => setStates((prev) => ({ ...prev, [index]: s }));
  const ui = (key) => ({ en: UI[key].en, mine: language === 'es' ? UI[key].es : null });
  const ctx = { profile, language, languageName, line, ui, sizeClass };
  const Step = STEPS[step.type];
  const isLast = index === steps.length - 1;

  const next = () => {
    if (isLast) { if (onFinish) onFinish(); return; }
    setIndex(index + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-xl mx-auto space-y-4 pb-24" style={{ color: NAVY }}>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-base font-semibold">
          <span>{lesson.title}</span>
          <span className="text-[#4A5A78]">{progressLabel(index, steps.length)}</span>
        </div>
        <div
          className="h-2 rounded-full bg-[#DEE4EE] overflow-hidden"
          role="progressbar"
          aria-valuenow={index + 1}
          aria-valuemin={1}
          aria-valuemax={steps.length}
        >
          <div className="h-full rounded-full transition-all" style={{ width: `${progressPercent(index, steps.length)}%`, backgroundColor: NAVY }} />
        </div>
      </div>

      <Step key={index} step={step} ctx={ctx} state={state} setState={setState} />

      <div className="sticky bottom-3 pt-2">
        <button
          type="button"
          onClick={next}
          disabled={!canContinue(step, state)}
          className={`${primaryBtn} min-h-[52px] text-lg shadow-lg`}
          style={{ backgroundColor: NAVY }}
        >
          {isLast ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
