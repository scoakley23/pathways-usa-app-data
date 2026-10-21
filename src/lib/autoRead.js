// "Read out loud for me": the tutor speaks each message as it appears, in
// onboarding, the quick check, and lessons. On by default; the setting is
// saved only on this device. Browsers block speech until the learner has
// tapped the page once, so the first message waits for that tap.

export const AUTO_READ_KEY = 'pathways_auto_read'; // 'on' | 'off'

export function getAutoRead() {
  try {
    return localStorage.getItem(AUTO_READ_KEY) !== 'off';
  } catch (e) {
    return true;
  }
}

export function saveAutoRead(on) {
  try {
    localStorage.setItem(AUTO_READ_KEY, on ? 'on' : 'off');
  } catch (e) {
    // ignore
  }
}

// What to say, in order: the learner's language first (when the message has
// it), then English. Each part is { text, language }.
export function readingParts({ mine, en, language = 'en' }) {
  const parts = [];
  const clean = (s) => (typeof s === 'string' ? s.trim() : '');
  if (language !== 'en' && clean(mine)) parts.push({ text: clean(mine), language });
  if (clean(en)) parts.push({ text: clean(en), language: 'en' });
  return parts;
}

// True once the learner has tapped or typed on this page (speech allowed).
// Browsers without the userActivation API are assumed to allow it.
export function canSpeakNow(nav = typeof navigator !== 'undefined' ? navigator : undefined) {
  const ua = nav && nav.userActivation;
  return ua ? !!ua.hasBeenActive : true;
}
