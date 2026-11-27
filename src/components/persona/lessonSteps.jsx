import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Mic, Square, Check, Volume2, ExternalLink } from 'lucide-react';
import TutorMessage, { ListenButton } from './TutorMessage';
import TeachingFeedback from './TeachingFeedback';
import useSpeechCapture from './useSpeechCapture';
import TopicArt from '@/components/art/TopicArt';
import { Card as RaisedCard, Poster, PrimaryButton } from '@/components/pathways/ui';

// A small plain label (was the all-caps Eyebrow).
const Eyebrow = ({ className = '', children }) => <p className={`text-base font-semibold text-muted ${className}`} dir="auto">{children}</p>;
import { speakText } from '@/components/utils/textToSpeech';
import { wordDiff } from '@/components/utils/wordDiff';
import { checkCivicsAnswer, officeholderCheck } from '@/components/civics/checkCivicsAnswer';
import OfficeholderNote from '@/components/civics/OfficeholderNote';
import useLearnerLocation from '@/components/civics/useLearnerLocation';
import { FIND_REPRESENTATIVE_PATH, officeholderAnswerFor } from '@/lib/officeholderQuestions';
import { evaluateInterviewAnswer, evaluateUnderstanding } from '@/components/practice/evaluateInterviewAnswer';
import { checkDictation, splitOfficialAnswers } from '@/lib/practiceChecks';
import { matchCivicsAnswer } from '@/lib/answerVariants';
import { READING_PASS } from '@/lib/pretest';
import { isRepeatRequest } from '@/lib/repeatRequest';
import { markKeyWords } from '@/lib/tutorLesson';
import { RTL_LANGUAGES } from '@/hooks/useAppLanguage';

import { UI_LINES, UI_LINES_ES } from './tutorStepLines';
import LessonVideo from '@/components/lesson/LessonVideo';

export { UI_LINES, UI_LINES_ES };
export const UI = Object.fromEntries(Object.keys(UI_LINES).map((k) => [k, { en: UI_LINES[k], es: UI_LINES_ES[k] }]));

const isCheck = (step) => step.mode === 'check';

// Big round microphone button with a soft halo. `onPoster`: white, for a
// red or blue poster.
function MicButton({ speech, busy, idleLabel, onPoster = false, t }) {
  return (
    <div className="flex flex-col items-center mt-6">
      <div className="relative">
        <span className={`absolute inset-0 rounded-full ${onPoster ? 'bg-white/25' : 'bg-navy/15'} transition-transform ${speech.listening ? 'scale-150 animate-pulse' : 'scale-125'}`} aria-hidden="true" />
        <button
          type="button"
          onClick={speech.listening ? speech.stop : speech.start}
          disabled={busy}
          aria-label={speech.listening ? t('stop') : (idleLabel || t('tap_answer'))}
          className={`relative w-20 h-20 rounded-full grid place-items-center disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 ${onPoster ? 'bg-gold text-navy focus-visible:ring-white/60' : 'bg-navy text-white focus-visible:ring-navy/30'}`}
        >
          {speech.listening ? <Square className={`w-7 h-7 ${onPoster ? 'fill-navy' : 'fill-white'}`} aria-hidden="true" /> : <Mic className="w-8 h-8" aria-hidden="true" />}
        </button>
      </div>
      <p className="mt-4 text-base font-semibold text-center" aria-live="polite" dir="auto">
        {busy ? t('checking') : speech.listening ? t('listening') : (idleLabel || t('tap_answer'))}
      </p>
      {speech.transcript && <p lang="en" dir="ltr" className={`mt-2 text-center ${onPoster ? '' : 'text-muted'}`}>“{speech.transcript}”</p>}
      {busy && <Loader2 className="w-5 h-5 animate-spin mt-2" />}
    </div>
  );
}

function CheckNext({ ctx }) {
  return <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('checkNext')} />;
}

function QuestionCard({ ctx, eyebrow, text, children }) {
  return (
    <RaisedCard className={`text-navy ${ctx.sizeClass}`}>
      <Eyebrow className="mb-2">{eyebrow || ctx.t('officer_asks')}</Eyebrow>
      <p className="text-[1.375em] font-bold leading-snug mb-3" lang="en" dir="ltr">{text}</p>
      <ListenButton text={text} language="en" label={ctx.t('listen_short')} />
      {children}
    </RaisedCard>
  );
}

// ---- Steps -----------------------------------------------------------------

export function PartIntroStep({ step, ctx }) {
  return (
    <div className="space-y-4">
      <div className="rounded-card bg-white border-[1.5px] border-line px-4 pt-4 pb-4">
        <TopicArt name={step.art} />
        <p className="text-[1.375em] font-bold mt-2 text-navy" dir="auto">{step.title.mine || step.title.en}</p>
        {step.title.mine && <p className="text-muted" lang="en" dir="ltr">{step.title.en}</p>}
      </div>
      <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.text.mine} en={step.text.en} />
    </div>
  );
}

export function ExplainStep({ step, ctx }) {
  const { note, link, video } = step;
  return (
    <TutorMessage profile={ctx.profile} language={ctx.language} mine={step.text.mine} en={step.text.en}>
      {note && (
        <p className="text-small font-semibold text-muted" dir="auto">
          {ctx.language !== 'en' && note.mine ? `${note.mine} · ${note.en}` : note.en}
        </p>
      )}
      {link && (
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="self-start min-h-[44px] rounded-button bg-white text-navy border-[1.5px] border-line px-4 font-semibold inline-flex items-center gap-2 hover:border-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
        >
          <Volume2 className="w-5 h-5" aria-hidden="true" /> {link.label}
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
          <span className="sr-only">{ctx.t('new_tab')}</span>
        </a>
      )}
      {video && <LessonVideo video={video} t={ctx.t} />}
    </TutorMessage>
  );
}

// "Answers change / vary" questions: the current officeholder (or capital)
// from the officeholders table, for "your state's" questions with the
// learner's saved "Who Represents Me?" place (see currentAnswers.js).
function NowAnswer({ now, ctx }) {
  if (!now) return null;
  const t = (key) => { const v = ctx.ui(key); return ctx.language === 'es' && v.mine ? v.mine : v.en; };
  return (
    <div className="mt-4 rounded-card bg-line-soft p-4">
      {now.kind === 'current' && (
        <>
          <Eyebrow className="mb-1">{t('currentAnswer')}</Eyebrow>
          {now.accepted.length > 0 && <p className="text-[1.25em] font-bold" lang="en" dir="ltr">{now.accepted.join(' · ')}</p>}
          {now.accepted.length > 0 && <ListenButton text={now.accepted.join('. ')} language="en" />}
          {now.message && <p className="mt-2">{now.message}</p>}
          {now.mayChangeSoon && <p className="font-semibold mt-2">{t('mayChangeSoon')}</p>}
          <p className="text-small text-muted mt-2" dir="auto">{t('checkedOn').replace('{date}', now.checkedOn)}.</p>
        </>
      )}
      {now.kind === 'find' && (
        <>
          <p className="font-semibold">{t('findYours')}</p>
          <Link to={FIND_REPRESENTATIVE_PATH} className="mt-3 min-h-[44px] rounded-button bg-navy text-white px-4 font-bold inline-flex items-center hover:bg-navy-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2">
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
    ? <mark key={i} className="bg-stop-chest text-navy rounded px-0.5">{p.text}</mark>
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
  const Card = RaisedCard;
  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('showEnglish')} />
      <Card className={`text-navy ${ctx.sizeClass}`}>
        <Eyebrow className="mb-2">{ctx.t('officer_asks')}</Eyebrow>
        <p className="text-[1.375em] font-bold leading-snug mb-3" lang="en" dir="ltr"><Marked text={step.question.question} words={words} /></p>
        <ListenButton text={step.question.question} language="en" />
        <Eyebrow className="mt-5 mb-2">{ctx.t('accepted')}</Eyebrow>
        <ul className="space-y-1 mb-3" lang="en" dir="ltr">
          {accepted.map((a) => <li key={a} className="font-bold"><Marked text={a} words={words} /></li>)}
        </ul>
        <ListenButton text={accepted.join('. ')} language="en" />
        <NowAnswer now={step.now} ctx={ctx} />
      </Card>
      {translated.length > 0 && (
        <RaisedCard className={`text-navy ${ctx.sizeClass}`}>
          <Eyebrow className="mb-3">{ctx.t('key_words')}</Eyebrow>
          <ul className="divide-y divide-line">
            {translated.map((k) => (
              <li key={k.en} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 py-2.5">
                <span className="font-bold"><mark className="bg-stop-chest text-navy rounded px-1">{k.en}</mark></span>
                <span dir={dir} lang={ctx.language} className="text-muted">{k.translation}</span>
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
  const { location } = useLearnerLocation();
  // Officeholder / capital questions: accepted names from the officeholders table.
  const officeholder = officeholderAnswerFor(question, location);
  const accepted = officeholder ? officeholder.accepted : splitOfficialAnswers(question.answer);
  const [checking, setChecking] = useState(false);
  const [typed, setTyped] = useState('');

  const evaluate = async (answer, wasTyped) => {
    if (!answer.trim()) return;
    // "Could you say that again?" is not an answer: ask again, grade nothing.
    if (isRepeatRequest(answer)) {
      speech.reset(); setTyped(''); setState({ askedAgain: true });
      speakText(question.question, 'en');
      return;
    }
    // Graded from the table on the device, never the AI. correct === null =
    // can't be graded (e.g. no saved place): counted neither right nor wrong.
    const officeholderResult = officeholderCheck(question, answer, location);
    if (officeholderResult) {
      const isCorrect = officeholderResult.is_correct;
      setState({
        answered: true,
        heard: wasTyped ? undefined : answer,
        outcome: { correct: isCorrect },
        result: { isCorrect, officeholder: officeholderResult.officeholder, tip: isCorrect === false ? ctx.ui('keyWordsTip') : null },
      });
      return;
    }
    const local = () => matchCivicsAnswer(answer, question).isCorrect;
    // A spoken answer that clearly matches an accepted answer is checked on
    // the device too; only the rest go to the AI.
    if (wasTyped || matchCivicsAnswer(answer, question).sure) {
      // Typed text never goes to the AI here: check on the device.
      const isCorrect = local();
      setState({ answered: true, heard: wasTyped ? undefined : answer, outcome: { correct: isCorrect }, result: { isCorrect, tip: isCorrect ? null : ctx.ui('keyWordsTip') } });
      return;
    }
    setChecking(true);
    try {
      const teach = isCheck(step) ? null : { language: ctx.language, tutor: ctx.profile };
      const r = await checkCivicsAnswer(question, answer, { teach });
      const isCorrect = !!r.is_correct;
      setState({
        answered: true,
        heard: answer,
        outcome: { correct: isCorrect },
        result: { isCorrect, right: { en: r.what_was_right_en, mine: r.what_was_right_mine }, tip: { en: r.tip_en, mine: r.tip_mine } },
      });
    } catch {
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
      {state.askedAgain && !state.answered && <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('askedAgain')} />}
      {ctx.posters ? (
        <Poster
          className={`-mx-4 sm:mx-0 sm:rounded-card ${ctx.sizeClass}`}
          label={ctx.t('practice_of', { n: ctx.posterIndex + 1, total: ctx.posterTotal })}
          question={question.question}
          questionAs="p"
        >
          <ListenButton text={question.question} language="en" />
          {!state.answered && (speech.supported ? (
            <MicButton speech={speech} busy={checking} onPoster t={ctx.t} />
          ) : (
            <form className="flex gap-2 mt-5" onSubmit={(e) => { e.preventDefault(); evaluate(typed, true); }}>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={ctx.t('type_answer')}
                aria-label={ctx.t('your_answer')}
                className="flex-1 min-w-0 min-h-[48px] rounded-[10px] bg-white px-4 text-base text-navy placeholder:text-muted"
              />
              <button type="submit" className="min-h-[48px] rounded-button bg-white text-navy px-5 font-semibold hover:bg-paper focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">{ctx.t('check')}</button>
            </form>
          ))}
          {state.heard && <p className="mt-4"><span dir="auto">{ctx.t('you_said')}</span> <span className="font-medium" lang="en" dir="ltr">“{state.heard}”</span></p>}
        </Poster>
      ) : (
        <QuestionCard ctx={ctx} text={question.question}>
          {!state.answered && (speech.supported ? (
            <MicButton speech={speech} busy={checking} t={ctx.t} />
          ) : (
            <form className="flex gap-2 mt-5" onSubmit={(e) => { e.preventDefault(); evaluate(typed, true); }}>
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={ctx.t('type_answer')}
                aria-label={ctx.t('your_answer')}
                className="flex-1 min-w-0 min-h-[44px] rounded-button border border-line px-4 text-base"
              />
              <PrimaryButton type="submit">{ctx.t('check')}</PrimaryButton>
            </form>
          ))}
          {state.heard && <p className="mt-4 text-muted"><span dir="auto">{ctx.t('you_said')}</span> <span className="font-medium" lang="en" dir="ltr">“{state.heard}”</span></p>}
        </QuestionCard>
      )}

      {state.answered && state.result?.isCorrect === null && (
        <RaisedCard className={`text-navy ${ctx.sizeClass}`}>
          <p className="font-semibold mb-2">{(() => { const v = ctx.ui('notCounted'); return ctx.language === 'es' && v.mine ? v.mine : v.en; })()}</p>
          <OfficeholderNote answer={state.result.officeholder} graded={false} />
        </RaisedCard>
      )}
      {state.answered && (isCheck(step) || state.result?.isCorrect === null ? <CheckNext ctx={ctx} /> : (
        <>
          <TeachingFeedback
          t={ctx.t}
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
          {state.result.officeholder && <OfficeholderNote answer={state.result.officeholder} graded={false} className="px-1" />}
        </>
      ))}
    </div>
  );
}

function WordChips({ words }) {
  return (
    <p className="flex flex-wrap gap-1.5 mt-4">
      {words.map((w, i) => (
        <span key={i} className={`rounded-lg px-2 py-0.5 font-semibold ${w.status === 'correct' ? 'bg-correct-bg text-correct' : 'bg-not-yet-bg text-not-yet underline'}`}>{w.word}</span>
      ))}
    </p>
  );
}

export function WritingStep({ step, ctx, state, setState }) {
  const [typed, setTyped] = useState('');
  const say = () => speakText(step.sentence, 'en');
  useEffect(() => { say(); }, [step.sentence]);

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
      <RaisedCard className={`text-navy ${ctx.sizeClass}`}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={say}
            aria-label={ctx.t('play_sentence')}
            className="w-16 h-16 shrink-0 rounded-full bg-navy text-white grid place-items-center shadow-lift focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy/40"
          >
            <Volume2 className="w-7 h-7" />
          </button>
          <p className="font-semibold" dir="auto">{ctx.t('play_again')}</p>
        </div>
        {!state.answered && (
          <form className="space-y-3 mt-5" onSubmit={check}>
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={ctx.t('write_hear')}
              aria-label={ctx.t('write_hear')}
              autoCapitalize="sentences"
              className="w-full min-h-[48px] rounded-button border border-line px-4 text-base"
            />
            <PrimaryButton type="submit" className="w-full">{ctx.t('check')}</PrimaryButton>
          </form>
        )}
        {state.answered && !isCheck(step) && <WordChips words={state.result.words} />}
      </RaisedCard>
      {state.answered && (isCheck(step) ? <CheckNext ctx={ctx} /> : (
        <TeachingFeedback
          t={ctx.t}
          profile={ctx.profile}
          language={ctx.language}
          line={ctx.line}
          isCorrect={state.result.isCorrect}
          tipText={state.result.tip}
          acceptLabel={ctx.t('the_sentence')}
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
      <RaisedCard className={`text-navy ${ctx.sizeClass}`}>
        <Eyebrow className="mb-2">{ctx.t('read_out_loud')}</Eyebrow>
        <p className="text-[1.375em] font-extrabold leading-snug">{step.sentence}</p>
        {!state.answered && (speech.supported ? <MicButton speech={speech} idleLabel={ctx.t('tap_read')} t={ctx.t} /> : (
          <p className="mt-4 text-muted" dir="auto">{ctx.t('reading_needs')}</p>
        ))}
        {state.answered && !isCheck(step) && <WordChips words={state.result.words} />}
      </RaisedCard>
      {state.answered && (isCheck(step) ? <CheckNext ctx={ctx} /> : (
        <TeachingFeedback
          t={ctx.t}
          profile={ctx.profile}
          language={ctx.language}
          line={ctx.line}
          isCorrect={state.result.isCorrect}
          tipText={state.result.tip}
          acceptLabel={ctx.t('the_sentence')}
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
    // Asking the officer to repeat is not an answer: ask again, score nothing.
    if (isRepeatRequest(transcript)) {
      speech.reset(); setFailed(false); setState({ askedAgain: true });
      speakText(step.question.question, 'en');
      return;
    }
    setChecking(true);
    setFailed(false);
    try {
      // step.understand: say what the question is asking, never answer it
      // (N-400 questions); only understanding is checked.
      const r = step.understand
        ? await evaluateUnderstanding(step.question, transcript, { meaning: step.meaning })
        : await evaluateInterviewAnswer(step.question, transcript);
      const score = Number(r?.overall_score) || 0;
      setState({ answered: true, heard: transcript, outcome: { score }, result: { isCorrect: !!r.is_acceptable, better: r.corrected_version, tip: r.improvement_tips } });
    } catch {
      setFailed(true);
    } finally {
      setChecking(false);
    }
  };
  const speech = useSpeechCapture(onDone);

  return (
    <div className="space-y-4">
      <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui(step.understand ? 'understandPrompt' : 'interviewPrompt')} expression="listening" />
      {state.askedAgain && !state.answered && <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('askedAgain')} />}
      <QuestionCard ctx={ctx} text={step.question.question}>
        {!state.answered && (speech.supported ? <MicButton speech={speech} busy={checking} /> : (
          <p className="mt-4 text-muted" dir="auto">{ctx.t('speaking_needs')}</p>
        ))}
        {state.heard && <p className="mt-4 text-muted"><span dir="auto">{ctx.t('you_said')}</span> <span className="font-medium" lang="en" dir="ltr">“{state.heard}”</span></p>}
      </QuestionCard>
      {failed && <TutorMessage profile={ctx.profile} language={ctx.language} {...ctx.ui('checkFailed')} />}
      {state.answered && (isCheck(step) ? <CheckNext ctx={ctx} /> : (
        <TeachingFeedback
          t={ctx.t}
          profile={ctx.profile}
          language={ctx.language}
          line={ctx.line}
          isCorrect={state.result.isCorrect}
          tipText={{ en: state.result.tip }}
          acceptLabel={step.understand ? ctx.t('what_asking') : ctx.t('good_answer')}
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
      <div className={`grid gap-2 ${ctx.sizeClass}`} role="group" aria-label={ctx.t('choose_one')}>
        {step.options.map((o) => {
          const isRight = state.answered && o === step.correct;
          const isWrongChoice = state.answered && o === state.choice && o !== step.correct;
          return (
            <button
              key={o}
              type="button"
              onClick={() => choose(o)}
              aria-pressed={state.choice === o}
              className={`min-h-[52px] rounded-card border-2 px-4 py-2 text-start font-bold inline-flex items-center justify-between gap-2 text-navy transition-colors ${
                isRight ? 'border-correct bg-correct-bg' : isWrongChoice ? 'border-not-yet bg-not-yet-bg' : 'border-line bg-white hover:border-navy'
              }`}
            >
              {o} {isRight && <Check className="w-5 h-5 text-correct shrink-0" aria-label={ctx.t('correct_answer')} />}
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
