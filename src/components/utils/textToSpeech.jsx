// Browser-only text-to-speech helpers (window.speechSynthesis).
// No paid APIs or backend calls — everything plays through the device's built-in voices.

const SETTINGS_KEY = 'pathways_voice_settings';
const QUALITY_TERMS = ['natural', 'neural', 'online', 'premium', 'enhanced'];
const MAX_CHUNK_LENGTH = 200;
const VOICES_LOAD_TIMEOUT = 2000;

// ---- Voice ranking & discovery -------------------------------------------

// Scores a voice by quality: 4 = Neural/Natural-class, 3 = Google, 2 = remote
// (non-local) voices, 1 = everything else.
export function rankVoice(voice) {
  if (!voice) return 0;
  const name = (voice.name || '').toLowerCase();
  if (QUALITY_TERMS.some((term) => name.includes(term))) return 4;
  if ((voice.name || '').startsWith('Google')) return 3;
  if (voice.localService === false) return 2;
  return 1;
}

const loadVoices = () => new Promise((resolve) => {
  if (!window.speechSynthesis) { resolve([]); return; }
  const immediate = window.speechSynthesis.getVoices();
  if (immediate.length > 0) { resolve(immediate); return; }
  let settled = false;
  const finish = () => {
    if (settled) return;
    settled = true;
    try { window.speechSynthesis.removeEventListener('voiceschanged', handleChanged); } catch (e) { /* ignore */ }
    resolve(window.speechSynthesis.getVoices());
  };
  const handleChanged = () => finish();
  window.speechSynthesis.addEventListener('voiceschanged', handleChanged);
  setTimeout(finish, VOICES_LOAD_TIMEOUT);
});

// Voices for the given language, best first. Waits (up to 2s) for voices
// that load late on Chrome/Edge.
export async function getAvailableVoices(language = 'en') {
  const all = await loadVoices();
  const base = (language || 'en').split('-')[0].toLowerCase();
  const wanted = (language || 'en').toLowerCase().replace('_', '-');
  return all
    .filter((v) => ((v.lang || '').toLowerCase().replace('_', '-')).startsWith(base))
    .sort((a, b) =>
      rankVoice(b) - rankVoice(a) ||
      Number(((b.lang || '').toLowerCase().replace('_', '-')) === wanted) - Number(((a.lang || '').toLowerCase().replace('_', '-')) === wanted) ||
      (a.name || '').localeCompare(b.name || '')
    );
}

// A random voice name from the top-ranked voices for that language.
export async function getRandomVoice(language = 'en') {
  const voices = await getAvailableVoices(language);
  const top = voices.filter((v) => rankVoice(v) >= 3);
  const pool = top.length > 0 ? top : voices;
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)].name;
}

// ---- Saved settings (localStorage only — voices differ between devices) ---

export function getVoiceSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        voiceName: typeof parsed.voiceName === 'string' ? parsed.voiceName : null,
        rate: typeof parsed.rate === 'number' ? parsed.rate : 0.9,
      };
    }
  } catch (e) { /* ignore */ }
  return { voiceName: null, rate: 0.9 };
}

export function saveVoiceSettings(settings = {}) {
  const next = { ...getVoiceSettings(), ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  } catch (e) { /* ignore */ }
  return next;
}

// ---- Speaking --------------------------------------------------------------

let currentUtterance = null; // keep a reference so Chrome doesn't GC it mid-speech
let chunkQueue = [];
let cancelled = false;
let sequenceId = 0;

export function stopSpeaking() {
  cancelled = true;
  sequenceId += 1;
  chunkQueue = [];
  currentUtterance = null;
  if (window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
  }
}

// Split long text into sentence-sized chunks (Chrome cuts off long speech
// with its Google voices after ~15 seconds).
function chunkText(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) return [];
  if (trimmed.length <= MAX_CHUNK_LENGTH) return [trimmed];
  const sentences = trimmed.match(/[^.!?]+[.!?]*\s*/g) || [trimmed];
  const chunks = [];
  let buffer = '';
  for (const sentence of sentences) {
    if (buffer && (buffer + sentence).length > MAX_CHUNK_LENGTH) {
      chunks.push(buffer.trim());
      buffer = sentence;
    } else {
      buffer += sentence;
    }
  }
  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}

export async function speakText(text, language = 'en', { onStart, onEnd, voiceName } = {}) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();
  cancelled = false;
  chunkQueue = [];
  const id = ++sequenceId;
  const isStale = () => cancelled || id !== sequenceId;

  const lang = language || 'en';
  const isEnglish = lang === 'en' || lang.toLowerCase().startsWith('en');
  const settings = getVoiceSettings();

  let voice = null;
  if (voiceName) {
    const voices = await loadVoices();
    voice = voices.find((v) => v.name === voiceName) || null;
  } else if (isEnglish) {
    if (settings.voiceName) {
      const voices = await loadVoices();
      voice = voices.find((v) => v.name === settings.voiceName) || null;
    }
    if (!voice) {
      const englishVoices = await getAvailableVoices('en');
      voice = englishVoices.find((v) => (v.lang || '').toLowerCase() === 'en-us') || englishVoices[0] || null;
    }
  } else {
    // Other languages (e.g. Study Buddy) ignore the saved voice.
    const languageVoices = await getAvailableVoices(lang);
    voice = languageVoices[0] || null;
  }

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    if (onEnd) onEnd();
    return;
  }

  const rate = typeof settings.rate === 'number' ? settings.rate : 0.9;

  const speakChunk = (chunk, isFirst) => {
    if (isStale()) return;
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = lang === 'en' ? 'en-US' : lang;
    utterance.rate = rate;
    utterance.pitch = 1.0;
    if (voice) utterance.voice = voice;

    if (isFirst && onStart) {
      utterance.onstart = () => { if (!isStale()) onStart(); };
    }
    const advance = () => {
      if (isStale()) return;
      const next = chunkQueue.shift();
      if (next) { speakChunk(next, false); return; }
      currentUtterance = null;
      if (onEnd) onEnd();
    };
    utterance.onend = advance;
    utterance.onerror = advance;

    currentUtterance = utterance; // prevents garbage collection that stops onend in Chrome
    window.speechSynthesis.speak(utterance);
  };

  chunks.forEach((chunk, i) => {
    if (i > 0) chunkQueue.push(chunk);
  });
  speakChunk(chunks[0], true);
}