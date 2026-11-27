import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Check, ChevronLeft, HelpCircle, Pause, Play, RotateCcw, Volume2, X } from 'lucide-react';
import { Button } from '@/components/pathways/ui';
import { DRAWINGS, DRAWING_PARTS } from '@/components/course/drawings';
import { Amio } from '@/components/pathways/Amio';
import { LessonPicture } from '@/components/course/LessonPictures';
import { hasVoice, speakText, stopSpeaking } from '@/components/utils/textToSpeech';
import { resolvePicture } from '@/lib/lessonPictures';
import { storyPicture, wordsInLine } from '@/lib/story';
import { senatorsFor } from '@/lib/senatorPhotos';
import { getOfficialsFor } from '@/lib/officeholders';
import useLearnerLocation from '@/components/civics/useLearnerLocation';

// The story player (Listen as a short "video", src/lib/story.js): one idea
// per scene, read aloud in the learner's language with captions, moving on
// by itself when the voice finishes (Pause stops that), and a quick check
// every few scenes (practice only: no stars, nothing saved). Phones without
// a voice for the language show captions only ("Read it in English" still
// reads the English line). Every scene has "Read it to me" (and "Slower")
// and "I don't understand" (StoryHelpSheet: reviewed help lines, the new
// words in the line, Talk to a person). A tap check asks the learner to tap
// a part of a drawing (DRAWING_PARTS). `mine` = the translated lines (keys
// s{i}, h{i}_{kind}, k{i}, k{i}_{j}, m{i} for new words), from
// useLessonTranslation().

const NEXT_DELAY = 900; // ms after the voice ends

// Loaded only when opened (they need the browser).
const StoryHelpSheet = lazy(() => import('@/components/lesson/StoryHelpSheet'));
const TalkToPerson = lazy(() => import('@/components/ai/TalkToPerson'));

// The learner's two senators (state from Who Represents Me?; names from the
// official list; a photo only while its name matches).
export function YourSenators({ t }) {
  const { location, loaded } = useLearnerLocation();
  if (!loaded) return <div className="min-h-[120px] rounded-card bg-white border border-line" />;
  const senators = senatorsFor(location);
  if (!senators.length) {
    return (
      <section className="rounded-card bg-white border border-line p-5 flex flex-col gap-2">
        <p className="text-base text-navy">{t('story_pick_state')}</p>
        <a href="/learn#find-representative" className="self-start min-h-tap inline-flex items-center text-base font-semibold text-denim underline underline-offset-4">{t('story_find_state')}</a>
      </section>
    );
  }
  return (
    <section className="rounded-card bg-white border border-line p-4 flex flex-col gap-3">
      <p className="text-small font-semibold text-muted">{t('story_your_senators')}</p>
      <ul className="list-none m-0 p-0 grid grid-cols-2 gap-3">
        {senators.map((s) => (
          <li key={s.name} className="flex flex-col items-center gap-2 text-center">
            {s.src
              ? <img src={s.src} alt={t('story_portrait_of', { name: s.name })} loading="lazy" className="w-28 h-36 rounded-2xl object-cover bg-tint" />
              : <span className="w-28 h-36 rounded-2xl bg-tint" aria-hidden="true" />}
            <span className="text-base font-bold text-navy break-words" lang="en">{s.name}</span>
          </li>
        ))}
      </ul>
      {senators.some((s) => s.credit) && (
        <p className="text-small text-muted">{senators.find((s) => s.credit).credit} · <a href={senators.find((s) => s.source).source} target="_blank" rel="noreferrer" className="underline underline-offset-2">Public domain</a></p>
      )}
    </section>
  );
}

// The capital and governor (D.C.: mayor) of the state saved in Who
// Represents Me?; names from the official list, on the device. Nothing saved.
export function YourState({ t }) {
  const { location, loaded } = useLearnerLocation();
  if (!loaded) return <div className="min-h-[120px] rounded-card bg-white border border-line" />;
  const o = location?.state ? getOfficialsFor({ state: location.state }) : null;
  if (!o) {
    return (
      <section className="rounded-card bg-white border border-line p-5 flex flex-col gap-2">
        <p className="text-base text-navy">{t('story_pick_state_capital')}</p>
        <a href="/learn#find-representative" className="self-start min-h-tap inline-flex items-center text-base font-semibold text-denim underline underline-offset-4">{t('story_find_state')}</a>
      </section>
    );
  }
  const leader = o.governor ? { label: t('story_governor'), name: o.governor.name } : o.mayor ? { label: t('story_mayor'), name: o.mayor.name } : null;
  return (
    <section className="rounded-card bg-sky-soft border-2 border-sky p-4 flex flex-col gap-3">
      <p className="text-small font-semibold text-navy">{t('story_your_state', { state: o.place })}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-card bg-white p-3 flex flex-col gap-1">
          <span className="text-small font-semibold text-muted">{t('story_capital')}</span>
          <span className="text-lg font-bold text-navy break-words" lang="en">{o.capital?.name}</span>
        </div>
        {leader && (
          <div className="rounded-card bg-gold-soft p-3 flex flex-col gap-1">
            <span className="text-small font-semibold text-muted">{leader.label}</span>
            <span className="text-lg font-bold text-navy break-words" lang="en">{leader.name}</span>
          </div>
        )}
      </div>
      {!o.governor && o.mayor && <p className="text-small text-navy">{t('story_dc_no_governor')}</p>}
      <p className="text-small text-navy">{t('story_names_change')}</p>
    </section>
  );
}

function ScenePicture({ picture, t, pick }) {
  const p = storyPicture(picture);
  if (!p) return null;
  if (p.kind === 'senators') return <YourSenators t={t} />;
  if (p.kind === 'yourState') return <YourState t={t} />;
  if (p.kind === 'drawing') {
    const Drawing = DRAWINGS[p.drawing];
    return Drawing ? <div className="rounded-card bg-sky-soft border-2 border-sky p-3"><div className="rounded-card bg-white p-3"><Drawing focus={p.focus} pick={pick} /></div></div> : null;
  }
  return <LessonPicture p={resolvePicture(p)} caption="" />;
}

export default function StoryListen({ story, language, mine, words = [], userEmail = null, t, onEnd }) {
  const items = story.items;
  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [english, setEnglish] = useState(false);
  const [voice, setVoice] = useState(null); // null = checking, true/false
  const [enVoice, setEnVoice] = useState(null);
  const [picked, setPicked] = useState(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [talkOpen, setTalkOpen] = useState(false);
  const timer = useRef(null);
  const item = items[i];
  const isCheck = !!item.check;
  const lang = language || 'en';

  const say = (k, en) => (lang !== 'en' && !english && mine?.[k]) || en;
  const sceneText = isCheck ? '' : say(`s${i}`, item.say);
  const sceneLang = lang !== 'en' && !english && mine?.[`s${i}`] ? lang : 'en';

  useEffect(() => {
    let active = true;
    hasVoice(lang).then((v) => { if (active) setVoice(v); }).catch(() => { if (active) setVoice(false); });
    hasVoice('en').then((v) => { if (active) setEnVoice(v); }).catch(() => { if (active) setEnVoice(false); });
    return () => { active = false; };
  }, [lang]);

  const go = (n) => {
    clearTimeout(timer.current);
    stopSpeaking();
    setPicked(null);
    setHelpOpen(false);
    if (n >= items.length) { onEnd(); return; }
    setI(Math.max(0, n));
    window.scrollTo?.(0, 0);
  };

  // Read the scene aloud; move on when the voice ends (unless paused).
  useEffect(() => {
    clearTimeout(timer.current);
    if (isCheck || !playing || voice !== true) return undefined;
    speakText(sceneText, sceneLang, {
      onEnd: () => { timer.current = setTimeout(() => go(i + 1), NEXT_DELAY); },
    });
    return () => { clearTimeout(timer.current); };
  }, [i, playing, voice, sceneText, sceneLang, isCheck]);

  useEffect(() => () => { clearTimeout(timer.current); stopSpeaking(); }, []);

  const togglePlay = () => {
    if (playing) { clearTimeout(timer.current); stopSpeaking(); }
    setPlaying((v) => !v);
  };
  const replay = () => {
    clearTimeout(timer.current);
    speakText(sceneText, sceneLang, playing ? { onEnd: () => { timer.current = setTimeout(() => go(i + 1), NEXT_DELAY); } } : {});
  };

  // "Read it to me": the line in the learner's language when the phone has
  // that voice, else the English line. Slower reads at a slower rate. Never
  // moves on by itself.
  const readLang = sceneLang !== 'en' && voice === true ? sceneLang : 'en';
  const readText = (text, textLang, rate) => {
    clearTimeout(timer.current);
    stopSpeaking();
    setPlaying(false);
    speakText(text, textLang, rate ? { rate } : {});
  };
  const canRead = readLang === 'en' ? enVoice === true : voice === true;
  const readLabel = sceneLang !== 'en' && readLang === 'en' ? t('story_read_english') : t('story_read_aloud');
  const chipBtn = 'min-h-tap inline-flex items-center gap-2 rounded-button border-2 px-4 text-base font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim';
  // A quick check is in English: read it in English.
  const readButtons = (text) => enVoice === true && (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" onClick={() => readText(text, 'en')} className={`${chipBtn} border-denim bg-white hover:bg-sky-soft`}>
        <Volume2 className="w-5 h-5 text-denim" aria-hidden="true" />{lang === 'en' ? t('story_read_aloud') : t('story_read_english')}
      </button>
      <button type="button" onClick={() => readText(text, 'en', 0.7)} className="min-h-tap px-2 text-base font-semibold text-denim underline underline-offset-4">{t('story_slower')}</button>
    </div>
  );

  const iconBtn = 'w-12 h-12 grid place-items-center rounded-full border border-line bg-white text-navy hover:border-denim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim disabled:opacity-40';
  const hasMine = lang !== 'en' && mine && Object.keys(mine).some((k) => k.startsWith('s'));

  let body;
  if (isCheck) {
    const c = item.check;
    const tap = c.kind === 'tap';
    const choices = c.kind === 'tf' ? [t('story_true'), t('story_false')] : (c.choices || []);
    const right = tap ? c.answer : c.kind === 'tf' ? (c.answer ? 0 : 1) : c.answer;
    const question = c.kind === 'tf' ? c.statement : c.prompt;
    const qMine = mine?.[`k${i}`];
    const answered = picked !== null;
    const partName = (key) => DRAWING_PARTS[c.picture?.drawing]?.[key] || key;
    body = (
      <>
        <section className="rounded-card bg-gold-soft border-2 border-gold p-5 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Amio mood="thinking" size={40} />
            <p className="rounded-button bg-gold px-3 py-1 text-small font-semibold text-navy">{t('story_quick_check')}{c.kind === 'tf' ? ` · ${t('story_true_or_false')}` : ''}</p>
          </div>
          <p className="text-question font-bold text-navy leading-snug" lang="en" dir="ltr">{question}</p>
          {tap && <p className="text-base text-navy">{t('story_tap_picture')}</p>}
          {lang !== 'en' && qMine && english && <p className="text-base text-navy" dir="auto" lang={lang}>{qMine}</p>}
          {lang !== 'en' && qMine && (
            <button type="button" onClick={() => setEnglish((v) => !v)} aria-pressed={english} className="self-start min-h-tap text-base font-semibold text-denim underline underline-offset-4">{t('in_my_language')}</button>
          )}
          {readButtons(tap ? question : [question, ...choices].join('. '))}
        </section>
        {tap && (
          <ScenePicture
            picture={{ drawing: c.picture?.drawing, focus: answered ? right : undefined }}
            t={t}
            pick={{ onPick: setPicked, disabled: answered }}
          />
        )}
        {!tap && (
        <ul className="list-none m-0 p-0 flex flex-col gap-3">
          {choices.map((ch, k) => {
            const isRight = k === right;
            const tone = !answered ? 'border-line bg-white hover:border-denim'
              : isRight ? 'border-correct bg-correct-bg' : k === picked ? 'border-not-yet bg-not-yet-bg' : 'border-line bg-white opacity-70';
            return (
              <li key={k}>
                <button type="button" disabled={answered} aria-pressed={k === picked} onClick={() => setPicked(k)} className={`w-full min-h-[56px] flex items-center gap-3 rounded-card border-2 px-4 py-3 text-start text-lg font-semibold text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-denim ${tone}`}>
                  <span className="flex-1 min-w-0" lang="en" dir="ltr">{ch}</span>
                  {answered && (isRight || k === picked) && (isRight
                    ? <Check className="w-6 h-6 shrink-0 text-correct" strokeWidth={3} aria-label={t('story_right')} />
                    : <X className="w-6 h-6 shrink-0 text-not-yet" strokeWidth={3} aria-label={t('story_not_yet')} />)}
                </button>
              </li>
            );
          })}
        </ul>
        )}
        {answered && (
          <p role="status" className={`flex items-start gap-2 rounded-card px-4 py-3 text-base font-semibold ${picked === right ? 'bg-correct-bg text-correct-title' : 'bg-not-yet-bg text-not-yet'}`}>
            {picked === right
              ? <Check className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={3} aria-hidden="true" />
              : <X className="w-5 h-5 shrink-0 mt-0.5" strokeWidth={3} aria-hidden="true" />}
            <span>
              {picked === right ? t('story_right') : `${t('story_not_yet')} `}
              {picked !== right && <span lang="en" dir="ltr">{tap ? partName(right) : choices[right]}</span>}
            </span>
          </p>
        )}
      </>
    );
  } else {
    body = (
      <>
        <ScenePicture picture={item.picture} t={t} />
        <section className="rounded-card bg-white border border-line p-5 flex flex-col gap-2">
          {sceneLang !== 'en' && <span className="self-start rounded-button bg-tint px-3 py-1 text-small font-semibold text-navy">{t('said_in_language')}</span>}
          <p className="text-[1.375rem] font-bold text-navy leading-snug" dir="auto" lang={sceneLang} aria-live="polite">{sceneText}</p>
          {hasMine && (
            <button type="button" onClick={() => setEnglish((v) => !v)} aria-pressed={english} className="self-start min-h-tap text-base font-semibold text-denim underline underline-offset-4">
              {english ? t('in_my_language') : t('in_english')}
            </button>
          )}
          {voice === false && <p className="text-small text-muted">{t('story_no_voice')}</p>}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {canRead && (
              <>
                <button type="button" onClick={() => readText(readLang === sceneLang ? sceneText : item.say, readLang)} className={`${chipBtn} border-denim bg-white hover:bg-sky-soft`}>
                  <Volume2 className="w-5 h-5 text-denim" aria-hidden="true" />{readLabel}
                </button>
                <button type="button" onClick={() => readText(readLang === sceneLang ? sceneText : item.say, readLang, 0.7)} className="min-h-tap px-2 text-base font-semibold text-denim underline underline-offset-4">{t('story_slower')}</button>
              </>
            )}
            <button type="button" onClick={() => { clearTimeout(timer.current); stopSpeaking(); setPlaying(false); setHelpOpen(true); }} className={`${chipBtn} border-gold bg-gold-soft hover:bg-gold`}>
              <HelpCircle className="w-5 h-5 text-navy" aria-hidden="true" />{t('story_help')}
            </button>
          </div>
        </section>
        {helpOpen && (
        <Suspense fallback={null}>
        <StoryHelpSheet
          open={helpOpen}
          onOpenChange={setHelpOpen}
          line={sceneText}
          help={item.help || {}}
          mine={(k) => mine?.[`h${i}_${k}`] || null}
          language={lang}
          words={wordsInLine(item.say, words).map((w) => ({ ...w, mine: mine?.[`m${words.indexOf(w)}`] }))}
          t={t}
          onTalk={userEmail ? () => { setHelpOpen(false); setTalkOpen(true); } : null}
        />
        </Suspense>
        )}
      </>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1 px-4 py-5 flex flex-col gap-4 max-w-lg w-full mx-auto">
        <div className="flex items-center justify-between gap-3">
          <ol className="flex flex-wrap gap-1.5 list-none m-0 p-0" aria-label={t('story_scene_of', { n: i + 1, total: items.length })}>
            {items.map((x, k) => (
              <li key={k} className={`h-2 rounded-full ${x.check ? 'w-4' : 'w-2'} ${k < i ? 'bg-denim' : k === i ? 'bg-gold' : 'bg-mid'}`} aria-hidden="true" />
            ))}
          </ol>
          {story.draft && <span className="rounded-button bg-tint px-3 py-1 text-small font-semibold text-navy">{t('story_draft')}</span>}
        </div>
        {body}
      </div>
      {userEmail && talkOpen && <Suspense fallback={null}><TalkToPerson open={talkOpen} onOpenChange={setTalkOpen} userEmail={userEmail} language={lang} /></Suspense>}
      <div className="sticky bottom-0 bg-paper px-4 pt-2 pb-6 max-w-lg w-full mx-auto flex items-center gap-3">
        <button type="button" className={iconBtn} onClick={() => go(i - 1)} disabled={i === 0} aria-label={t('story_back')}>
          <ChevronLeft className="w-6 h-6 rtl:rotate-180" aria-hidden="true" />
        </button>
        {!isCheck && voice === true && (
          <>
            <button type="button" className={iconBtn} onClick={replay} aria-label={t('story_replay')}><RotateCcw className="w-5 h-5" aria-hidden="true" /></button>
            <button type="button" className={iconBtn} onClick={togglePlay} aria-pressed={!playing} aria-label={playing ? t('story_pause') : t('story_play')}>
              {playing ? <Pause className="w-5 h-5" aria-hidden="true" /> : <Play className="w-5 h-5" aria-hidden="true" />}
            </button>
          </>
        )}
        <Button variant="main" className="flex-1" onClick={() => go(i + 1)} disabled={isCheck && picked === null}>
          {i + 1 >= items.length ? t('continue') : t('next')}
        </Button>
      </div>
    </div>
  );
}
