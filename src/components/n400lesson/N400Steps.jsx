import React, { useEffect, useMemo, useState } from 'react';
import { Check, Volume2, X } from 'lucide-react';
import { AmioSays } from '@/components/pathways/Amio';
import MicButton from '@/components/pathways/MicButton';
import { NotYetBanner, SuccessBanner } from '@/components/pathways/ResultBanner';
import { Button } from '@/components/pathways/ui';
import Officer from '@/components/interview/Officer';
import useSpeechCapture from '@/components/persona/useSpeechCapture';
import { speakText } from '@/components/utils/textToSpeech';
import { evaluateUnderstanding } from '@/components/practice/evaluateInterviewAnswer';
import { translateStrings } from '@/lib/translateStrings';
import { packText } from '@/lib/translationPack';
import { LANGUAGES } from '@/lib/languages';
import { isRepeatRequest } from '@/lib/repeatRequest';
import { helpRequestKind } from '@/lib/helpRequest';
import { HELP_PHRASES, guideQuestion, helpPhrase, questionName } from '@/lib/n400Lessons';

// The five steps of an N-400 lesson (src/lib/n400Lessons.js). Each step
// teaches understanding the question, never an answer. What the learner says
// stays in memory only. onDone(result): 'right' | 'missed' | 'skipped'.

const chip = 'min-h-tap rounded-full border border-line bg-white px-4 text-base font-semibold text-navy hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim';

// Web addresses in reviewed lines (https://…) become links that open in a new tab.
export function linkify(text) {
  const parts = String(text || '').split(/(https:\/\/[^\s]+?)(?=[.,;:)]?(?:\s|$))/);
  return parts.map((p, i) => (i % 2
    ? <a key={i} href={p} target="_blank" rel="noreferrer" className="font-semibold text-denim underline underline-offset-2 break-all" dir="ltr">{p.replace(/^https:\/\//, '')}</a>
    : <React.Fragment key={i}>{p}</React.Fragment>));
}

function Footer({ children }) {
  return <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto">{children}</div>;
}

// The section's meanings and words in the learner's language: the
// translation pack, or (switch off, no pack) the existing on-demand translation.
function useSectionTranslation(section, context, notes, language) {
  const strings = useMemo(() => {
    const s = {};
    context.forEach((line, i) => { s[`c${i}`] = line; });
    section.questions.forEach((q, i) => { if (notes[q.id]) s[`q${i}`] = notes[q.id]; });
    section.questions.forEach((q, i) => {
      s[`n${i}`] = questionName(q.id);
      s[`m${i}`] = q.meaning;
      (q.words || []).forEach((w, k) => { s[`w${i}_${k}`] = w.definition; });
    });
    return s;
  }, [section, context, notes]);
  const [mine, setMine] = useState(null);
  useEffect(() => {
    setMine(null);
    if (!language || language === 'en') return undefined;
    let active = true;
    const langName = LANGUAGES.find((l) => l.value === language)?.label || language;
    translateStrings({
      language,
      storageKey: `pathways_n400_lesson_${section.id}_${language}`,
      strings,
      buildPrompt: (part) => `Translate every value in this JSON into ${langName}, in short, plain sentences for adults preparing for the U.S. citizenship interview. These explain questions on Form N-400; never add advice about how to answer. Keep the keys. Return a JSON object with the same keys.\n\n${JSON.stringify(part, null, 2)}`,
      onPartial: (sofar) => { if (active) setMine(sofar); },
    }).then((done) => { if (active) setMine(done); }).catch(() => {});
    return () => { active = false; };
  }, [section.id, language, strings]);
  return mine;
}

/** Step 1 · Listen: what each question means, and the words to know. */
export function ListenN400({ lesson, section, language, t, onDone }) {
  const context = useMemo(() => lesson.context || [], [lesson]);
  const notes = useMemo(() => lesson.questionNotes || {}, [lesson]);
  const mine = useSectionTranslation(section, context, notes, language);
  const [english, setEnglish] = useState(false);
  const has = language !== 'en' && mine && section.questions.every((_, i) => mine[`m${i}`]);
  const show = (key, en) => (has && !english && mine[key]) || en;
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <AmioSays mood="happy" size={56}>{t('amio_listen')}</AmioSays>
        <div className="flex items-center justify-between gap-3">
          {has && !english ? <span className="rounded-full bg-tint px-3 py-1 text-small font-semibold uppercase tracking-wide text-navy">{t('said_in_language')}</span> : <span />}
          {has && (
            <button type="button" onClick={() => setEnglish((v) => !v)} aria-pressed={english} className="min-h-tap text-base font-semibold text-denim underline underline-offset-4">
              {english ? t('in_my_language') : t('in_english')}
            </button>
          )}
        </div>
        {context.length > 0 && (
          <section className="rounded-card bg-white border-2 border-denim p-5 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-navy">{t('before_you_start')}</h2>
            <ul className="list-disc ps-5 flex flex-col gap-2 m-0" lang={has && !english ? language : 'en'}>
              {context.map((line, i) => <li key={i} className="text-base text-navy leading-relaxed" dir="auto">{linkify(show(`c${i}`, line))}</li>)}
            </ul>
          </section>
        )}
        {section.questions.map((q, i) => (
          <section key={q.id} className="rounded-card bg-white border border-line p-5 flex flex-col gap-3">
            <h2 className="text-lg font-bold text-navy" dir="auto">{show(`n${i}`, questionName(q.id))}</h2>
            {notes[q.id] && <span className="self-start rounded-full bg-tint px-3 py-1 text-small font-semibold text-navy" dir="auto">{show(`q${i}`, notes[q.id])}</span>}
            <p className="text-base text-navy leading-relaxed" dir="auto" lang={has && !english ? language : 'en'}>{show(`m${i}`, q.meaning)}</p>
            {(q.words || []).length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-small font-semibold uppercase tracking-wide text-muted">{t('words_to_know')}</p>
                {q.words.map((w, k) => (
                  <button
                    key={w.word}
                    type="button"
                    onClick={() => speakText(w.word, 'en')}
                    aria-label={t('hear_word', { word: w.word })}
                    className="flex items-center justify-between gap-3 rounded-2xl bg-tint px-4 py-3 text-start hover:bg-mid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim"
                  >
                    <span className="min-w-0">
                      <span className="block text-base font-bold text-navy" lang="en" dir="ltr">{w.word}</span>
                      <span className="block text-base text-muted" dir="auto">{show(`w${i}_${k}`, w.definition)}</span>
                    </span>
                    <Volume2 className="w-5 h-5 shrink-0 text-denim" aria-hidden="true" />
                  </button>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
      <Footer><Button variant="main" className="w-full" onClick={() => onDone('right')}>{t('continue')}</Button></Footer>
    </div>
  );
}

// One tap question (Same question? and Spot the word): the item on top, three
// choices, then right or "Not yet" with the right one. A miss costs the star.
function TapItems({ items, t, amioLine, renderTop, choiceLabel, isRight, rightIndex, onDone }) {
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState(null);
  const [misses, setMisses] = useState(0);
  const item = items[i];
  const answered = picked !== null;
  const ok = answered && isRight(item, picked);
  const last = i + 1 >= items.length;
  const pick = (k) => {
    if (answered) return;
    setPicked(k);
    if (!isRight(item, k)) setMisses((m) => m + 1);
  };
  const next = () => {
    if (last) { onDone(misses === 0 ? 'right' : 'missed'); return; }
    setI(i + 1); setPicked(null); window.scrollTo?.(0, 0);
  };
  const lastLine = last ? (misses === 0 ? t('plus_star') : t('no_star')) : null;
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <p className="text-small font-semibold text-muted">{t('item_of', { n: i + 1, total: items.length })}</p>
        <AmioSays mood="curious" size={56}>{amioLine}</AmioSays>
        {renderTop(item)}
        <ul className="list-none m-0 p-0 flex flex-col gap-3" role="list">
          {item.choices.map((c, k) => {
            const correct = k === rightIndex(item);
            const mark = answered && (correct || k === picked);
            const tone = !answered ? 'border-line bg-white hover:border-denim'
              : correct ? 'border-correct bg-correct-bg' : k === picked ? 'border-not-yet bg-not-yet-bg' : 'border-line bg-white opacity-70';
            return (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => pick(k)}
                  disabled={answered}
                  aria-pressed={k === picked}
                  className={`w-full min-h-[56px] flex items-center gap-3 rounded-card border-2 px-4 py-3 text-start text-lg font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${tone}`}
                >
                  <span className="flex-1 min-w-0" lang="en" dir="ltr">{choiceLabel(c)}</span>
                  {mark && (correct
                    ? <Check className="w-6 h-6 shrink-0 text-correct" strokeWidth={3} aria-label={t('right')} />
                    : <X className="w-6 h-6 shrink-0 text-not-yet" strokeWidth={3} aria-label={t('not_yet')} />)}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      {answered && ok && (
        <SuccessBanner title={t('right')} actionLabel={t('next')} onAction={next} className="sticky bottom-0">{lastLine}</SuccessBanner>
      )}
      {answered && !ok && (
        <NotYetBanner title={t('not_yet')} actionLabel={t('next')} onAction={next} className="sticky bottom-0">
          <span lang="en" dir="ltr">{choiceLabel(item.choices[rightIndex(item)])}</span>
          {lastLine && <span className="block">{lastLine}</span>}
        </NotYetBanner>
      )}
    </div>
  );
}

function OfficerCard({ phrasing, t }) {
  useEffect(() => { speakText(phrasing, 'en'); }, [phrasing]);
  return (
    <section className="rounded-card bg-navy px-5 py-6 text-center text-white flex flex-col items-center gap-3">
      <Officer size={96} />
      <p className="text-small text-on-navy">{t('officer_label')}</p>
      <p className="text-question font-bold leading-snug" lang="en" dir="ltr">{phrasing}</p>
      <button type="button" onClick={() => speakText(phrasing, 'en')} className="min-h-tap rounded-full bg-chip-navy px-4 text-base font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        {t('hear_again')}
      </button>
    </section>
  );
}

/** Step 2 · Same question?: the officer's words → which form question. */
export function SameQuestion({ lesson, t, onDone }) {
  return (
    <TapItems
      items={lesson.same}
      t={t}
      amioLine={t('amio_same')}
      renderTop={(item) => <OfficerCard key={item.phrasing} phrasing={item.phrasing} t={t} />}
      choiceLabel={(id) => questionName(id)}
      isRight={(item, k) => item.choices[k] === item.answer}
      rightIndex={(item) => item.choices.indexOf(item.answer)}
      onDone={onDone}
    />
  );
}

/** Step 3 · Spot the word: what a small word means in this question. */
export function SpotWord({ lesson, t, onDone }) {
  const mark = (text, word) => {
    const at = text.toLowerCase().indexOf(word.toLowerCase());
    if (at < 0) return text;
    return <>{text.slice(0, at)}<mark className="rounded bg-gold px-1 text-navy">{text.slice(at, at + word.length)}</mark>{text.slice(at + word.length)}</>;
  };
  return (
    <TapItems
      items={lesson.spot}
      t={t}
      amioLine={t('amio_spot')}
      renderTop={(item) => (
        <section className="rounded-card bg-white border border-line p-5">
          <p className="text-small text-muted">{t('in_this_question')} · {questionName(item.questionId)}</p>
          <p className="mt-2 text-[20px] font-bold text-navy leading-snug" lang="en" dir="ltr">“{mark(item.text, item.word)}”</p>
          <button type="button" onClick={() => speakText(item.text, 'en')} className={`mt-3 ${chip}`}>{t('hear_again')}</button>
        </section>
      )}
      choiceLabel={(c) => c}
      isRight={(item, k) => k === item.answer}
      rightIndex={(item) => item.answer}
      onDone={onDone}
    />
  );
}

/** Step 4 · Say what it asks: understanding only, checked by the AI. */
export function SayWhatItAsks({ lesson, t, onDone }) {
  const items = lesson.understand;
  const [i, setI] = useState(0);
  const [mode, setMode] = useState('ask'); // ask | checking | right | wrong | error
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const [said, setSaid] = useState('');
  const [explain, setExplain] = useState('');
  const [askedAgain, setAskedAgain] = useState(false);
  const [misses, setMisses] = useState(0);
  const item = items[i];
  const meaning = guideQuestion(item.questionId)?.meaning || '';
  const last = i + 1 >= items.length;

  const check = async (answer) => {
    const text = String(answer || '').trim();
    if (!text) return;
    if (isRepeatRequest(text)) {
      setTyped(''); speech.reset(); setAskedAgain(true);
      speakText(item.phrasing, 'en');
      return;
    }
    setAskedAgain(false); setSaid(text); setMode('checking');
    try {
      const r = await evaluateUnderstanding({ question: item.phrasing }, text, { meaning });
      setExplain(r?.corrected_version || '');
      if (r?.is_acceptable) setMode('right');
      else { setMode('wrong'); setMisses((m) => m + 1); }
    } catch (e) {
      setMode('error');
    }
  };
  const speech = useSpeechCapture((transcript) => check(transcript));
  const reset = () => { setMode('ask'); setSaid(''); setTyped(''); setExplain(''); speech.reset(); };
  const next = (result) => {
    if (last) { onDone(result === 'skipped' ? 'skipped' : misses === 0 && result === 'right' ? 'right' : 'missed'); return; }
    setI(i + 1); reset(); setAskedAgain(false); window.scrollTo?.(0, 0);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <p className="text-small font-semibold text-muted">{t('item_of', { n: i + 1, total: items.length })}</p>
        <AmioSays mood="listen" size={56}>{t('amio_say')}</AmioSays>
        <OfficerCard key={item.phrasing} phrasing={item.phrasing} t={t} />
        {said && mode !== 'ask' && (
          <section className="rounded-card bg-white border border-line p-4">
            <p className="text-small text-muted">{t('you_said')}</p>
            <p className="mt-1 text-lg text-navy" lang="en" dir="ltr">“{said}”</p>
          </section>
        )}
        {(mode === 'right' || mode === 'wrong') && explain && (
          <section className="rounded-card bg-tint p-4">
            <p className="text-small font-semibold uppercase tracking-wide text-muted">{t('the_officer_is_asking')}</p>
            <p className="mt-1 text-base text-navy" lang="en" dir="ltr">{explain}</p>
          </section>
        )}
        <div className="mt-auto w-full flex flex-col items-center gap-3 pt-2">
          {mode === 'checking' && <p className="text-base text-muted" role="status">{t('checking')}</p>}
          {mode === 'ask' && askedAgain && <p className="text-base text-navy text-center" role="status">{t('asked_again')}</p>}
          {mode === 'ask' && !typing && (
            <>
              {speech.listening && speech.transcript && <p className="text-base text-navy text-center" lang="en" dir="ltr">“{speech.transcript}”</p>}
              <MicButton listening={speech.listening} onStart={speech.start} onStop={speech.stop} label={t('say_in_english')} listeningLabel={t('listening')} onTypeInstead={() => setTyping(true)} typeInsteadLabel={t('type_instead')} disabled={!speech.supported} />
            </>
          )}
          {mode === 'ask' && typing && (
            <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); check(typed); }}>
              <label htmlFor="n400-typed" className="text-base font-semibold text-navy">{t('type_label')}</label>
              <input id="n400-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
              <Button variant="main" type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
            </form>
          )}
          {mode === 'error' && (
            <div className="w-full flex flex-col gap-3">
              <p className="rounded-card bg-tint px-4 py-3 text-base text-navy">{t('cant_check')}</p>
              <Button variant="main" className="w-full" onClick={reset}>{t('try_again')}</Button>
              <Button variant="second" className="w-full" onClick={() => next('skipped')}>{t('skip_for_now')}</Button>
            </div>
          )}
          {mode === 'wrong' && (
            <button type="button" onClick={() => next('missed')} className="min-h-tap px-3 text-base font-semibold text-muted underline underline-offset-4 hover:text-navy">{t('skip_for_now')}</button>
          )}
        </div>
      </div>
      {mode === 'right' && (
        <SuccessBanner title={t('understood')} actionLabel={t('next')} onAction={() => next('right')} className="sticky bottom-0">
          {last && misses === 0 ? t('plus_star') : null}
        </SuccessBanner>
      )}
      {mode === 'wrong' && (
        <NotYetBanner title={t('not_understood')} actionLabel={t('try_again')} onAction={reset} className="sticky bottom-0">
          {t('answered_instead')}
        </NotYetBanner>
      )}
    </div>
  );
}

/** Step 5 · Ask for help: say each phrase out loud (checked on the device). */
export function AskForHelp({ lesson, language, t, onDone }) {
  const [i, setI] = useState(0);
  const [mode, setMode] = useState('ask'); // ask | right | wrong
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const phrase = HELP_PHRASES[i];
  const say = helpPhrase(phrase, lesson.helpWord);
  const [mine, setMine] = useState(null); // what the phrase is for, from the pack only
  useEffect(() => {
    let active = true;
    setMine(null);
    if (language && language !== 'en') packText(language, phrase.meaning).then((v) => { if (active) setMine(v || null); }).catch(() => {});
    return () => { active = false; };
  }, [language, phrase.meaning]);
  const last = i + 1 >= HELP_PHRASES.length;
  const check = (text) => {
    if (!String(text || '').trim()) return;
    setMode(helpRequestKind(text) === phrase.id ? 'right' : 'wrong');
  };
  const speech = useSpeechCapture((transcript) => check(transcript));
  const reset = () => { setMode('ask'); setTyped(''); speech.reset(); };
  const next = () => {
    if (last) { onDone('right'); return; }
    setI(i + 1); reset(); window.scrollTo?.(0, 0);
  };
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <p className="text-small font-semibold text-muted">{t('item_of', { n: i + 1, total: HELP_PHRASES.length })}</p>
        <AmioSays mood="wave" size={56}>{t('amio_help')}</AmioSays>
        <section className="rounded-card bg-white border-2 border-denim p-5">
          <p className="text-small font-semibold uppercase tracking-wide text-muted">{t('say_this')}</p>
          <p className="mt-1 text-base text-muted" dir="auto">{mine || phrase.meaning}</p>
          <p className="mt-2 text-question font-bold text-navy leading-snug" lang="en" dir="ltr">“{say}”</p>
          <button type="button" onClick={() => speakText(say, 'en')} className={`mt-3 ${chip}`}>{t('hear_again')}</button>
        </section>
        <div className="mt-auto w-full flex flex-col items-center gap-3 pt-2">
          {mode === 'ask' && !typing && (
            <>
              {speech.listening && speech.transcript && <p className="text-base text-navy text-center" lang="en" dir="ltr">“{speech.transcript}”</p>}
              <MicButton listening={speech.listening} onStart={speech.start} onStop={speech.stop} label={t('say_in_english')} listeningLabel={t('listening')} onTypeInstead={() => setTyping(true)} typeInsteadLabel={t('type_instead')} disabled={!speech.supported} />
            </>
          )}
          {mode === 'ask' && typing && (
            <form className="w-full flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); check(typed); }}>
              <label htmlFor="n400-help-typed" className="text-base font-semibold text-navy">{t('say_this')}</label>
              <input id="n400-help-typed" lang="en" dir="ltr" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} className="min-h-[52px] rounded-2xl border border-line bg-white px-4 text-lg text-navy focus:outline-none focus:ring-2 focus:ring-denim" />
              <Button variant="main" type="submit" className="w-full" disabled={!typed.trim()}>{t('check')}</Button>
            </form>
          )}
          {mode !== 'right' && (
            <button type="button" onClick={next} className="min-h-tap px-3 text-base font-semibold text-muted underline underline-offset-4 hover:text-navy">{t('skip_for_now')}</button>
          )}
        </div>
      </div>
      {mode === 'right' && <SuccessBanner title={t('said_it')} actionLabel={t('next')} onAction={next} className="sticky bottom-0" />}
      {mode === 'wrong' && <NotYetBanner title={t('not_understood')} actionLabel={t('try_again')} onAction={reset} className="sticky bottom-0">{t('not_that_phrase')}</NotYetBanner>}
    </div>
  );
}

