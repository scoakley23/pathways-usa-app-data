import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getAvailableVoices, speakText, stopSpeaking } from '@/components/utils/textToSpeech';
import { spokenTutorName } from '@/lib/tutorPersona';
import { canSpeakNow, getAutoRead, readingParts, saveAutoRead } from '@/lib/autoRead';

// True on screens where the tutor reads each message aloud as it appears
// (onboarding, the quick check, lessons). Layout sets it for those routes.
export const AutoReadContext = createContext(false);

const SETTING_EVENT = 'pathways-auto-read';
const SPEAKING_EVENT = 'pathways-tutor-speaking';
let speakingId = null; // which message is being read aloud right now
let pending = null; // waits for the learner's first tap
let turn = 0; // only the newest message speaks

function setSpeaking(id) {
  speakingId = id;
  window.dispatchEvent(new Event(SPEAKING_EVENT));
}

export function stopReading() {
  turn += 1;
  pending = null;
  stopSpeaking();
  setSpeaking(null);
}

// Browsers allow speech only after a tap, so the first message is held until
// then (one listener for the whole app).
function runAfterFirstTap(fn) {
  if (canSpeakNow()) { fn(); return; }
  const first = !pending;
  pending = fn;
  if (!first) return;
  const go = () => {
    window.removeEventListener('click', go, true);
    window.removeEventListener('keydown', go, true);
    const next = pending;
    pending = null;
    if (next) next();
  };
  window.addEventListener('click', go, true);
  window.addEventListener('keydown', go, true);
}

const hasVoice = async (language) => language === 'en' || (await getAvailableVoices(language)).length > 0;

// Reads { mine, en } aloud: the learner's language, then English. Skips a
// language the device has no voice for rather than mispronouncing it.
export function readAloud(id, { mine, en, language, tutorName }) {
  const parts = readingParts({ mine, en, language });
  if (!parts.length) return;
  const myTurn = ++turn;
  runAfterFirstTap(async () => {
    const usable = [];
    for (const p of parts) if (await hasVoice(p.language)) usable.push(p);
    if (myTurn !== turn) return; // a newer message started meanwhile
    const say = (i) => {
      if (myTurn !== turn) return;
      if (i >= usable.length) { if (speakingId === id) setSpeaking(null); return; }
      const { text, language: lang } = usable[i];
      const spoken = tutorName ? text.split(tutorName).join(spokenTutorName(tutorName, lang)) : text;
      speakText(spoken, lang, { onEnd: () => say(i + 1) });
    };
    setSpeaking(id);
    say(0);
  });
}

export const currentSpeakingId = () => speakingId;

// Which message is speaking, for the Stop button and the pulsing Listen.
export function useSpeakingId() {
  const [id, setId] = useState(speakingId);
  useEffect(() => {
    const update = () => setId(speakingId);
    window.addEventListener(SPEAKING_EVENT, update);
    return () => window.removeEventListener(SPEAKING_EVENT, update);
  }, []);
  return id;
}

// The learner's "Read out loud for me" setting (device only).
export function useAutoReadSetting() {
  const [on, setOn] = useState(getAutoRead);
  useEffect(() => {
    const update = () => setOn(getAutoRead());
    window.addEventListener(SETTING_EVENT, update);
    return () => window.removeEventListener(SETTING_EVENT, update);
  }, []);
  const change = useCallback((next) => {
    saveAutoRead(next);
    if (!next) stopReading();
    window.dispatchEvent(new Event(SETTING_EVENT));
  }, []);
  return [on, change];
}

// Auto-read is active when the screen allows it and the learner hasn't
// turned it off.
export default function useAutoRead() {
  const screen = useContext(AutoReadContext);
  const [on] = useAutoReadSetting();
  return screen && on;
}
