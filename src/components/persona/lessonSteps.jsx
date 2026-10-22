import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mic, Square, Check, Volume2, ExternalLink } from 'lucide-react';
import TutorMessage, { ListenButton } from './TutorMessage';
import TeachingFeedback from './TeachingFeedback';
import useSpeechCapture from './useSpeechCapture';
import TopicArt from '@/components/art/TopicArt';
import { Eyebrow, IndexCard, Poster, PrimaryButton, RaisedCard, posterTone } from '@/components/pathways/ui';
import { speakText } from '@/components/utils/textToSpeech';
import { wordDiff } from '@/components/utils/wordDiff';
import { checkCivicsAnswer } from '@/components/civics/checkCivicsAnswer';
import { evaluateInterviewAnswer } from '@/components/practice/evaluateInterviewAnswer';
import { buildTutorInstructions } from '@/lib/tutorPersona';
import { checkDictation, matchOfficialAnswer, splitOfficialAnswers } from '@/lib/practiceChecks';
import { READING_PASS } from '@/lib/pretest';
import { markKeyWords } from '@/lib/tutorLesson';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

// Fixed lines inside lessons (English + hand-written Spanish).
export const UI = {
  showEnglish: { en: 'Here is the question and the answers the officer accepts. Listen and repeat.', es: 'Aquí está la pregunta y las respuestas que acepta el oficial. Escuche y repita.' },
  speakPrompt: { en: 'Now answer out loud, in English.', es: 'Ahora conteste en voz alta, en inglés.' },
  writePrompt: { en: 'Listen to the sentence. Then write it in English.', es: 'Escuche la oración. Luego escríbala en inglés.' },
  readPrompt: { en: 'Read this sentence out loud, in English.', es: 'Lea esta oración en voz alta, en inglés.' },
  interviewPrompt: { en: "Answer the officer's question in English.", es: 'Conteste la pregunta del oficial en inglés.' },
  keyWordsTip: { en: 'Use the key words from one of the accepted answers.', es: 'Use las palabras clave de una de las respuestas aceptadas.' },
  correctIs: { en: 'The correct answer is:', es: 'La respuesta correcta es:' },
  listenAgain: { en: 'Listen again and check these words:', es: 'Escuche otra vez y revise estas palabras:' },
  readAgain: { en: 'Read these words again slowly:', es: 'Lea otra vez, despacio, estas palabras:' },
  checkNext: { en: 'Thank you. On to the next one.', es: 'Gracias. Vamos a la siguiente.' },
  currentAnswer: { en: 'Current answer', es: 'Respuesta actual' },
  yourAnswer: { en: 'Your answer', es: 'Su respuesta' },
  checkedOn: { en: 'Checked on {date} from', es: 'Revisado el {date} en' },
  checkUscis: { en: 'This answer changes. Check the current answer on', es: 'Esta respuesta cambia. Vea la respuesta actual en' },
  findYours: { en: 'This answer depends on where you live. Find yours with Find My Representative.', es: 'Esta respuesta depende de dónde vive. Búsquela con Find My Representative.' },
  findButton: { en: 'Find my representatives', es: 'Buscar mis representantes' },
  checkFailed: { en: "I couldn't check that answer. Please try again.", es: 'No pude revisar esa respuesta. Por favor, intente otra vez.' },
};

const isCheck = (step) => step.mode === 'check';

// Big round microphone button with a soft halo. `onPoster`: white, for a
// red or blue poster.
function MicButton({ speech, busy, idleLabel = 'Tap and answer in English', onPoster = false }) {
  return (
    <div className="flex flex-col items-center mt-6">
      <div className="relative">
        <span className={`absolute inset-0 rounded-full ${onPoster ? 'bg-white/25' : 'bg-pw-red/20'} transition-transform ${speech.listening ? 'scale-150 animate-pulse' : 'scale-125'}`} aria-hidden="true" />
        <button
          type="button"
          onClick={speech.listening ? speech.stop : speech.start}
          disabled={busy}
          aria-label={speech.listening ? 'Stop' : idleLabel}
          className={`relative w-20 h-20 rounded-full grid place-items-center shadow-lift disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 ${onPoster ? 'bg-white text-pw-navy focus-visible:ring-white/60' : 'bg-pw-red text-white focus-visible:ring-pw-navy/30'}`}
        >
          {speech.listening ? <Square className={`w-7 h-7 ${onPoster ? 'fill-pw-navy' : 'fill-white'}`} /> : <Mic className="w-8 h-8" />}
        </button>
      </div>
      <p className="mt-4 text-base font-semibold text-center" aria-live="polite">
        {busy ? 'Checking…' : speech.listening ? 'Listening… tap to stop' : idleLabel}
      </p>
      {speech.transcript && <p className={`mt-2 italic text-center ${onPoster ? '' : 'text-pw-muted'}`}>“{speech.transcript}”</p>}
      {busy && <Loader2 className="w-5 h-5 animate-spin mt-2" />}
    </div>
  );
}

function CheckNext({ ctx }) {
  return <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('checkNext')} />;
}

function QuestionCard({ ctx, eyebrow = 'The officer asks', text, children }) {
  return (
    <RaisedCard className={`text-pw-navy ${ctx.sizeClass}`}>
      <Eyebrow className="mb-2">{eyebrow}</Eyebrow>
      <p className="text-[1.375em] font-extrabold leading-snug mb-3">{text}</p>
      <ListenButton text={text} language="en" />
      {children}
    </RaisedCard>
  );
}

// ---- Steps -----------------------------------------------------------------

export function PartIntroStep({ step, ctx }) {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-pw-blue-soft px-4 pt-4 pb-4">
        <TopicArt name={step.art} />
        <p className="text-[1.375em] font-extrabold mt-2 text-pw-navy">{step.title.mine || step.title.en}</p>
        {step.title.mine && <p className="text-pw-muted">{step.title.en}</p>}
      </div>
      <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.text.mine} en={step.text.en} />
    </div>
  );
}

export function ExplainStep({ step, ctx }) {
  const { note, link } = step;
  return (
    <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.text.mine} en={step.text.en}>
      {note && (
        <p className="mt-3 text-sm font-semibold text-pw-muted">
          {ctx.language !== 'en' && note.mine ? `${note.mine} · ${note.en}` : note.en}
        </p>
      )}
      {link && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 min-h-[44px] rounded-2xl bg-white text-pw-navy border-2 border-pw-navy px-4 font-bold inline-flex items-center gap-2 hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" /> {link.label}
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      )}
    </TutorMessage>
  );
}

// "Answers change / vary" questions: the confirmed current official, or the
// learner's own official from Find My Representative (see currentAnswers.js).
function NowAnswer({ now, ctx }) {
  if (!now) return null;
  const t = (key) => { const v = ctx.ui(key); return ctx.language === 'es' && v.mine ? v.mine : v.en; };
  const uscis = (
    <a href={now.source} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2 hover:text-pw-red-ink">uscis.gov</a>
  );
  return (
    <div className="mt-4 rounded-2xl bg-pw-blue-soft p-4">
      {now.kind === 'current' && (
        <>
          <Eyebrow className="mb-1">{t('currentAnswer')}</Eyebrow>
          <p className="text-[1.25em] font-extrabold">{now.text}</p>
          <ListenButton text={now.text} language="en" />
          <p className="text-sm text-pw-muted mt-2">{t('checkedOn').replace('{date}', now.checkedOn)} {uscis}</p>
        </>
      )}
      {now.kind === 'check' && <p className="font-semibold">{t('checkUscis')} {uscis}.</p>}
      {now.kind === 'yours' && (
        <>
          <Eyebrow className="mb-1">{t('yourAnswer')}</Eyebrow>
          <p className="text-[1.25em] font-extrabold">{now.text}</p>
          <ListenButton text={now.text} language="en" />
        </>
      )}
      {now.kind === 'find' && (
        <>
          <p className="font-semibold">{t('findYours')}</p>
          <Link to="/learn#find-representative" className="mt-3 min-h-[44px] rounded-2xl bg-pw-navy text-white px-4 font-bold inline-flex items-center hover:bg-pw-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pw-red focus-visible:ring-offset-2">
            {t('findButton')}
          </Link>
        </>
      )}
    </div>
  );
}

// Text with key words in yellow marks (official text is never changed).
function Marked({ text, words }) {
  return markKeyWords(text, words).map((p, i) => (p.mark
    ? <mark key={i} className="bg-pw-highlight text-pw-navy rounded px-0.5">{p.text}</mark>
    : <React.Fragment key={i}>{p.text}</React.Fragment>));
}

// Bridge: the official English question and accepted answers. With
// `keyWords` ([{ en, translation }]), the key words are highlighted and
// listed with their translation in the learner's language.
export function ShowEnglishStep({ step, ctx }) {
  const accepted = splitOfficialAnswers(step.question.answer);
  const keyWords = (step.keyWords || []).filter((k) => k && k.en);
  const words = keyWords.map((k) => k.en);
  const translated = keyWords.filter((k) => k.translation && k.translation.trim().toLowerCase() !== k.en.trim().toLowerCase());
  const dir = RTL_LANGUAGES.includes(ctx.language) ? 'rtl' : 'ltr';
  const Card = ctx.posters ? IndexCard : RaisedCard;
  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('showEnglish')} />
      <Card className={`text-pw-navy ${ctx.sizeClass}`}>
        <Eyebrow className="mb-2">The officer asks</Eyebrow>
        <p className="text-[1.375em] font-extrabold leading-snug mb-3"><Marked text={step.question.question} words={words} /></p>
        <ListenButton text={step.question.question} language="en" />
        <Eyebrow className="mt-5 mb-2">Accepted answers</Eyebrow>
        <ul className="space-y-1 mb-3">
          {accepted.map((a) => <li key={a} className="font-bold"><Marked text={a} words={words} /></li>)}
        </ul>
        <ListenButton text={accepted.join('. ')} language="en" />
        <NowAnswer now={step.now} ctx={ctx} />
      </Card>
      {translated.length > 0 && (
        <RaisedCard className={`text-pw-navy ${ctx.sizeClass}`}>
          <Eyebrow className="mb-3">{ctx.language === 'es' ? 'Palabras clave · Key words' : 'Key words'}</Eyebrow>
          <ul className="divide-y divide-pw-line">
            {translated.map((k) => (
              <li key={k.en} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2.5">
                <span className="font-bold"><mark className="bg-pw-highlight text-pw-navy rounded px-1">{k.en}</mark></span>
                <span dir={dir} lang={ctx.language} className="text-pw-muted">{k.translation}</span>
              </li>
            ))}
          </ul>
        </RaisedCard>
      )}
    </div>
  );
}

export function SpeakingStep({ step, ctx, state, setState }) {
  const { question } = step;
  const accepted = splitOfficialAnswers(question.answer);
  const [checking, setChecking] = useState(false);
  const [typed, setTyped] = useState('');

  const evaluate = async (answer, wasTyped) => {
    if (!answer.trim()) return;
    const local = () => matchOfficialAnswer(answer, question.answer).isCorrect;
    if (wasTyped) {
      // Typed text never goes to the AI here: check on the device.
      const isCorrect = local();
      setState({ answered: true, outcome: { correct: isCorrect }, result: { isCorrect, tip: isCorrect ? null : ctx.ui('keyWordsTip') } });
      return;
    }
    setChecking(true);
    try {
      const teach = isCheck(step) ? null : { instructions: buildTutorInstructions(ctx.profile, ctx.languageName), languageName: ctx.languageName };
      const r = await checkCivicsAnswer(question, answer, { teach });
      const isCorrect = !!r.is_correct;
      setState({
        answered: true,
        heard: answer,
        outcome: { correct: isCorrect },
        result: { isCorrect, right: { en: r.what_was_right_en, mine: r.what_was_right_mine }, tip: { en: r.tip_en, mine: r.tip_mine } },
      });
    } catch (e) {
      const isCorrect = local();
      setState({ answered: true, heard: answer, outcome: { correct: isCorrect }, result: { isCorrect, tip: isCorrect ? null : ctx.ui('keyWordsTip') } });
    } finally {
      setChecking(false);
    }
  };

  const speech = useSpeechCapture((t) => evaluate(t, false));
  const reset = () => { speech.reset(); setTyped(''); setState({}); };
  const showMe = () => { setState({ ...state, shown: true }); speakText(accepted[0] || '', 'en'); };

  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('speakPrompt')} expression="listening" />
      {ctx.posters ? (
        <Poster
          tone={posterTone(Math.max(0, ctx.posterIndex))}
          className={`-mx-4 sm:mx-0 sm:rounded-[14px] ${ctx.sizeClass}`}
          label={`Practice · Card ${ctx.posterIndex + 1} of ${ctx.posterTotal}`}
          question={question.question}
          questionAs="p"
        >
          <ListenButton text={question.question} language="en" />
          {!state.answered && (speech.supported ? (
            <MicButton speech={speech} busy={checking} onPoster />
          ) : (
            <form className="flex gap-2 mt-5" onSubmit={(e) => { e.preventDefault(); evaluate(typed, true); }}>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Type your answer in English"
                aria-label="Your answer"
                className="flex-1 min-w-0 min-h-[48px] rounded-[10px] bg-white px-4 text-base text-pw-navy placeholder:text-pw-muted"
              />
              <button type="submit" className="min-h-[48px] rounded-full bg-white text-pw-navy px-5 font-semibold hover:bg-pw-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">Check</button>
            </form>
          ))}
          {state.heard && <p className="mt-4">You said: <span className="italic">“{state.heard}”</span></p>}
        </Poster>
      ) : (
        <QuestionCard ctx={ctx} text={question.question}>
          {!state.answered && (speech.supported ? (
            <MicButton speech={speech} busy={checking} />
          ) : (
            <form className="flex gap-2 mt-5" onSubmit={(e) => { e.preventDefault(); evaluate(typed, true); }}>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Type your answer in English"
                aria-label="Your answer"
                className="flex-1 min-w-0 min-h-[44px] rounded-2xl border border-pw-line px-4 text-base"
              />
              <PrimaryButton type="submit">Check</PrimaryButton>
            </form>
          ))}
          {state.heard && <p className="mt-4 text-pw-muted">You said: <span className="italic">“{state.heard}”</span></p>}
        </QuestionCard>
      )}

      {state.answered && (isCheck(step) ? <CheckNext ctx={ctx} /> : (
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
      ))}
    </div>
  );
}

function WordChips({ words }) {
  return (
    <p className="flex flex-wrap gap-1.5 mt-4">
      {words.map((w, i) => (
        <span key={i} className={`rounded-lg px-2 py-0.5 font-semibold ${w.status === 'correct' ? 'bg-pw-green-soft text-pw-green-ink' : 'bg-pw-red-soft text-pw-red-ink underline'}`}>{w.word}</span>
      ))}
    </p>
  );
}

export function WritingStep({ step, ctx, state, setState }) {
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
    setState({ answered: true, outcome: { correct: r.isCorrect }, result: { isCorrect: r.isCorrect, words: r.words, tip } });
  };

  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('writePrompt')} expression="listening" />
      <RaisedCard className={`text-pw-navy ${ctx.sizeClass}`}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={say}
            aria-label="Play the sentence"
            className="w-16 h-16 shrink-0 rounded-full bg-pw-navy text-white grid place-items-center shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-pw-red/40"
          >
            <Volume2 className="w-7 h-7" />
          </button>
          <p className="font-semibold">Play the sentence. You can play it again.</p>
        </div>
        {!state.answered && (
          <form className="space-y-3 mt-5" onSubmit={check}>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Write what you hear"
              aria-label="Write what you hear"
              autoCapitalize="sentences"
              className="w-full min-h-[48px] rounded-2xl border border-pw-line px-4 text-base"
            />
            <PrimaryButton type="submit" className="w-full">Check</PrimaryButton>
          </form>
        )}
        {state.answered && !isCheck(step) && <WordChips words={state.result.words} />}
      </RaisedCard>
      {state.answered && (isCheck(step) ? <CheckNext ctx={ctx} /> : (
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
      ))}
    </div>
  );
}

// Read a sentence aloud: word matching on the live transcript (no audio kept).
export function ReadingStep({ step, ctx, state, setState }) {
  const onDone = (transcript) => {
    if (!transcript.trim()) return;
    const diff = wordDiff(step.sentence, transcript);
    const passed = diff.accuracy >= READING_PASS;
    const missing = diff.words.filter((w) => w.status === 'missing').map((w) => w.word).join(', ');
    const again = ctx.ui('readAgain');
    const tip = passed ? null : { en: `${again.en} ${missing}.`, mine: again.mine && `${again.mine} ${missing}.` };
    setState({ answered: true, heard: transcript, outcome: { correct: passed }, result: { isCorrect: passed, words: diff.words, tip } });
  };
  const speech = useSpeechCapture(onDone);

  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('readPrompt')} expression="listening" />
      <RaisedCard className={`text-pw-navy ${ctx.sizeClass}`}>
        <Eyebrow className="mb-2">Read out loud</Eyebrow>
        <p className="text-[1.375em] font-extrabold leading-snug">{step.sentence}</p>
        {!state.answered && (speech.supported ? <MicButton speech={speech} idleLabel="Tap and read out loud" /> : (
          <p className="mt-4 text-pw-muted">Reading needs a browser with speech recognition, like Chrome or Safari. You can skip this part.</p>
        ))}
        {state.answered && !isCheck(step) && <WordChips words={state.result.words} />}
      </RaisedCard>
      {state.answered && (isCheck(step) ? <CheckNext ctx={ctx} /> : (
        <TeachingFeedback
          profile={ctx.profile}
          language={ctx.language}
          line={ctx.line}
          isCorrect={state.result.isCorrect}
          tipText={state.result.tip}
          acceptLabel="The sentence"
          accepted={[step.sentence]}
          shown={state.shown}
          onTryAgain={() => { speech.reset(); setState({}); }}
          onShowMe={() => { setState({ ...state, shown: true }); speakText(step.sentence, 'en'); }}
        />
      ))}
    </div>
  );
}

// Answer an interview question aloud, scored like the mock interview.
export function InterviewStep({ step, ctx, state, setState }) {
  const [checking, setChecking] = useState(false);
  const [failed, setFailed] = useState(false);

  const onDone = async (transcript) => {
    if (!transcript.trim()) return;
    setChecking(true);
    setFailed(false);
    try {
      // step.extra: more scoring instructions, e.g. a practice person's facts.
      const r = await evaluateInterviewAnswer(step.question, transcript, step.extra || '');
      const score = Number(r?.overall_score) || 0;
      setState({ answered: true, heard: transcript, outcome: { score }, result: { isCorrect: !!r.is_acceptable, better: r.corrected_version, tip: r.improvement_tips } });
    } catch (e) {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  };
  const speech = useSpeechCapture(onDone);

  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('interviewPrompt')} expression="listening" />
      <QuestionCard ctx={ctx} text={step.question.question}>
        {!state.answered && (speech.supported ? <MicButton speech={speech} busy={checking} /> : (
          <p className="mt-4 text-pw-muted">Speaking needs a browser with speech recognition, like Chrome or Safari. You can skip this part.</p>
        ))}
        {state.heard && <p className="mt-4 text-pw-muted">You said: <span className="italic">“{state.heard}”</span></p>}
      </QuestionCard>
      {failed && <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('checkFailed')} />}
      {state.answered && (isCheck(step) ? <CheckNext ctx={ctx} /> : (
        <TeachingFeedback
          profile={ctx.profile}
          language={ctx.language}
          line={ctx.line}
          isCorrect={state.result.isCorrect}
          tipText={{ en: state.result.tip }}
          acceptLabel="A good answer"
          accepted={state.result.better ? [state.result.better] : []}
          shown={state.shown}
          onTryAgain={() => { speech.reset(); setState({}); }}
          onShowMe={() => setState({ ...state, shown: true })}
        />
      ))}
    </div>
  );
}

export function CheckStep({ step, ctx, state, setState }) {
  const choose = (option) => {
    if (state.answered) return;
    const correct = option === step.correct;
    setState({ answered: true, choice: option, outcome: { correct }, result: { isCorrect: correct } });
  };
  const l = state.result ? ctx.line(state.result.isCorrect ? 'wellDone' : 'tryAgain') : null;
  const a = ctx.ui('correctIs');
  const after = (x, y) => (x && y ? `${x} ${y} ${step.correct}.` : null);

  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.prompt.mine} en={step.prompt.en} />
      <div className={`grid gap-2 ${ctx.sizeClass}`} role="group" aria-label="Choose one answer">
        {step.options.map((o) => {
          const isRight = state.answered && o === step.correct;
          const isWrongChoice = state.answered && o === state.choice && o !== step.correct;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              aria-pressed={state.choice === o}
              className={`min-h-[52px] rounded-2xl border-2 px-4 py-2 text-left font-bold inline-flex items-center justify-between gap-2 text-pw-navy transition-colors ${
                isRight ? 'border-pw-green-ink bg-pw-green-soft' : isWrongChoice ? 'border-pw-red bg-pw-red-soft' : 'border-pw-line bg-white hover:border-pw-navy'
              }`}
            >
              {o} {isRight && <Check className="w-5 h-5 text-pw-green-ink shrink-0" aria-label="Correct answer" />}
            </button>
          );
        })}
      </div>
      {state.result && (
        <TutorMessage
          profile={ctx.profile}
          language={ctx.language}
          expression={state.result.isCorrect ? 'proud' : 'default'}
          {...(state.result.isCorrect ? l : { en: after(l.en, a.en), mine: after(l.mine, a.mine) })}
        />
      )}
    </div>
  );
}

export const STEPS = {
  'part-intro': PartIntroStep,
  explain: ExplainStep,
  'show-english': ShowEnglishStep,
  'practice-speaking': SpeakingStep,
  'practice-writing': WritingStep,
  'practice-reading': ReadingStep,
  'practice-interview': InterviewStep,
  'check-understanding': CheckStep,
};
