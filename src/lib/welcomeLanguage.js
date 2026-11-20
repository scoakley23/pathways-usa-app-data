// Welcome follows the phone's language (Amio v2, amio-v2/finishing): the first
// of navigator.languages that the app has a translation pack for, else
// English. A language the learner already picked on this device always wins.
import { LANGUAGES } from '@/lib/languages';
import { hasPack } from '@/lib/translationPack';

const KNOWN = new Set(LANGUAGES.map((l) => l.value));

/** The app language for a list of browser languages (e.g. ['es-MX', 'en']). */
export function languageFromPhone(phone = [], { packFor = hasPack } = {}) {
  for (const raw of phone) {
    const code = String(raw || '').toLowerCase();
    if (!code) continue;
    const base = code.split('-')[0];
    if (base === 'en') return 'en';
    // Dari is written as fa-AF on most phones.
    const candidates = code === 'fa-af' ? ['prs', 'fa'] : [code, base];
    const hit = candidates.find((c) => KNOWN.has(c) && packFor(c));
    if (hit) return hit;
  }
  return 'en';
}

/** Whether this device already has a language the learner picked. */
export function hasPickedLanguage() {
  try { return Boolean(localStorage.getItem('pathways_language')); } catch { return false; }
}

export function phoneLanguages() {
  try {
    const list = navigator.languages?.length ? navigator.languages : [navigator.language];
    return list.filter(Boolean);
  } catch { return []; }
}
