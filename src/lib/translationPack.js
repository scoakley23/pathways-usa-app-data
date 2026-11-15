// The translation pack (Step 4): the app's fixed text, translated ahead of
// time into every app language and kept in the repo as content, so learners
// don't wait for (or pay for) live AI translation.
//
//   content/translations/{lang}.json           machine translation (made by
//                                              scripts/translations/build-pack.mjs)
//   content/translations/reviewed/{lang}.json  human-checked lines; these win
//
// Each file: { language, source, model, generated, strings: { English: translated } }.
// Only the chosen language's files are loaded, when that language is picked.
//
// Order everywhere: hand-written lines (a screen's own) → reviewed pack →
// machine pack → (missing) live AI while the switch is off, English when it
// is on (PACK_ONLY: no live AI translation at all on Supabase).
import { PROVIDER } from '@/api/provider';

export const PACK_ONLY = PROVIDER === 'supabase';

const MACHINE = import.meta.glob(['../../content/translations/*.json', '!../../content/translations/_sources.json'], { import: 'default' });
const REVIEWED = import.meta.glob('../../content/translations/reviewed/*.json', { import: 'default' });
const fileOf = (files, lang) => Object.entries(files).find(([p]) => p.endsWith(`/${lang}.json`))?.[1] || null;

const loaded = new Map(); // lang -> Map(English -> translated) | null
const loading = new Map(); // lang -> Promise

// Is there a pack for this language at all (machine or reviewed)?
export function hasPack(lang) {
  return Boolean(lang && lang !== 'en' && (fileOf(MACHINE, lang) || fileOf(REVIEWED, lang)));
}

// The pack if it has finished loading: Map, null (no pack), or undefined
// (not loaded yet).
export function getLoadedPack(lang) {
  return loaded.get(lang);
}

// Loads the language's pack once (reviewed lines over machine ones).
export function loadPack(lang) {
  if (!lang || lang === 'en') return Promise.resolve(null);
  if (loaded.has(lang)) return Promise.resolve(loaded.get(lang));
  if (!loading.has(lang)) {
    const read = async (files) => {
      const load = fileOf(files, lang);
      if (!load) return {};
      try { return (await load())?.strings || {}; } catch (e) { return {}; }
    };
    loading.set(lang, Promise.all([read(MACHINE), read(REVIEWED)]).then(([machine, reviewed]) => {
      const map = new Map([...Object.entries(machine), ...Object.entries(reviewed)].filter(([, v]) => typeof v === 'string' && v.trim()));
      const pack = map.size ? map : null;
      loaded.set(lang, pack);
      loading.delete(lang);
      return pack;
    }));
  }
  return loading.get(lang);
}

// { key: English } → { found: { key: translated }, missing: [key] }.
export function fromPack(pack, strings) {
  const found = {};
  const missing = [];
  for (const [key, english] of Object.entries(strings || {})) {
    const t = typeof english === 'string' && english.trim() ? pack?.get(english) : null;
    if (t) found[key] = t;
    else if (typeof english === 'string' && english.trim()) missing.push(key);
  }
  return { found, missing };
}

// One text, or null when the pack doesn't have it.
export async function packText(lang, english) {
  if (!english) return null;
  const pack = await loadPack(lang);
  return pack?.get(english) || null;
}

// Translates every string inside `value` (objects and arrays, any depth) that
// the pack has; the others stay English. `complete` = nothing was missing.
// Keys in `skip` (e.g. image_url) are copied as they are.
export async function packTree(lang, value, { skip = [] } = {}) {
  const pack = await loadPack(lang);
  let complete = true;
  const walk = (v, key) => {
    if (skip.includes(key)) return v;
    if (typeof v === 'string') {
      if (!v.trim()) return v;
      const t = pack?.get(v);
      if (!t) complete = false;
      return t || v;
    }
    if (Array.isArray(v)) return v.map((x) => walk(x));
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, walk(x, k)]));
    return v;
  };
  return { value: walk(value), complete };
}

// For tests: use this pack for `lang` (null = no pack).
export function setPackForTests(lang, entries) {
  loaded.set(lang, entries ? new Map(Object.entries(entries)) : null);
}
export function resetPacks() {
  loaded.clear();
  loading.clear();
}
