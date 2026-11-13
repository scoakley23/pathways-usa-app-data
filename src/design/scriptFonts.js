// Noto fonts for scripts Lexend doesn't cover, loaded only when the learner
// picks a language that needs one (self-hosted from @fontsource: no
// third-party requests). Weights 400 and 700 only; the browser uses the
// nearest for 500/600/800. Big scripts (Chinese, Japanese, Korean) come in
// small slices, so only the characters on screen are downloaded.

const LOADERS = {
  'noto-sans': () => Promise.all([import('@fontsource/noto-sans/400.css'), import('@fontsource/noto-sans/700.css')]),
  arabic: () => Promise.all([import('@fontsource/noto-sans-arabic/400.css'), import('@fontsource/noto-sans-arabic/700.css')]),
  sc: () => Promise.all([import('@fontsource/noto-sans-sc/400.css'), import('@fontsource/noto-sans-sc/700.css')]),
  jp: () => Promise.all([import('@fontsource/noto-sans-jp/400.css'), import('@fontsource/noto-sans-jp/700.css')]),
  kr: () => Promise.all([import('@fontsource/noto-sans-kr/400.css'), import('@fontsource/noto-sans-kr/700.css')]),
  devanagari: () => Promise.all([import('@fontsource/noto-sans-devanagari/400.css'), import('@fontsource/noto-sans-devanagari/700.css')]),
  bengali: () => Promise.all([import('@fontsource/noto-sans-bengali/400.css'), import('@fontsource/noto-sans-bengali/700.css')]),
  gurmukhi: () => Promise.all([import('@fontsource/noto-sans-gurmukhi/400.css'), import('@fontsource/noto-sans-gurmukhi/700.css')]),
  gujarati: () => Promise.all([import('@fontsource/noto-sans-gujarati/400.css'), import('@fontsource/noto-sans-gujarati/700.css')]),
  tamil: () => Promise.all([import('@fontsource/noto-sans-tamil/400.css'), import('@fontsource/noto-sans-tamil/700.css')]),
  telugu: () => Promise.all([import('@fontsource/noto-sans-telugu/400.css'), import('@fontsource/noto-sans-telugu/700.css')]),
  kannada: () => Promise.all([import('@fontsource/noto-sans-kannada/400.css'), import('@fontsource/noto-sans-kannada/700.css')]),
  malayalam: () => Promise.all([import('@fontsource/noto-sans-malayalam/400.css'), import('@fontsource/noto-sans-malayalam/700.css')]),
  thai: () => Promise.all([import('@fontsource/noto-sans-thai/400.css'), import('@fontsource/noto-sans-thai/700.css')]),
  myanmar: () => Promise.all([import('@fontsource/noto-sans-myanmar/400.css'), import('@fontsource/noto-sans-myanmar/700.css')]),
  khmer: () => Promise.all([import('@fontsource/noto-sans-khmer/400.css'), import('@fontsource/noto-sans-khmer/700.css')]),
  ethiopic: () => Promise.all([import('@fontsource/noto-sans-ethiopic/400.css'), import('@fontsource/noto-sans-ethiopic/700.css')]),
  sinhala: () => Promise.all([import('@fontsource/noto-sans-sinhala/400.css'), import('@fontsource/noto-sans-sinhala/700.css')]),
  lao: () => Promise.all([import('@fontsource/noto-sans-lao/400.css'), import('@fontsource/noto-sans-lao/700.css')]),
  hebrew: () => Promise.all([import('@fontsource/noto-sans-hebrew/400.css'), import('@fontsource/noto-sans-hebrew/700.css')]),
  armenian: () => Promise.all([import('@fontsource/noto-sans-armenian/400.css'), import('@fontsource/noto-sans-armenian/700.css')]),
  georgian: () => Promise.all([import('@fontsource/noto-sans-georgian/400.css'), import('@fontsource/noto-sans-georgian/700.css')]),
};

// App language (LANGUAGES in useLessonTranslation.js) -> the font it needs.
// Latin-script languages (Spanish, Vietnamese, Haitian Creole, Yoruba, Hausa,
// Igbo, Wolof, Azerbaijani, ...) need none: Lexend's latin, latin-ext and
// Vietnamese sets cover them. Noto Sans covers Cyrillic and Greek.
export const SCRIPT_FONT = {
  ar: 'arabic', fa: 'arabic', ur: 'arabic', prs: 'arabic', ps: 'arabic',
  zh: 'sc',
  ja: 'jp',
  ko: 'kr',
  hi: 'devanagari', ne: 'devanagari',
  bn: 'bengali',
  pa: 'gurmukhi',
  gu: 'gujarati',
  ta: 'tamil',
  te: 'telugu',
  kn: 'kannada',
  ml: 'malayalam',
  th: 'thai',
  my: 'myanmar',
  km: 'khmer',
  am: 'ethiopic', ti: 'ethiopic',
  si: 'sinhala',
  lo: 'lao',
  he: 'hebrew',
  hy: 'armenian',
  ka: 'georgian',
  ru: 'noto-sans', uk: 'noto-sans', kk: 'noto-sans', el: 'noto-sans',
};

export function scriptFontFor(lang) {
  const code = (lang || '').toLowerCase();
  return SCRIPT_FONT[code] || SCRIPT_FONT[code.split('-')[0]] || null;
}

const loaded = new Set();

// Loads the font for this language once. Safe to call on every change.
export function loadScriptFont(lang) {
  const font = scriptFontFor(lang);
  if (!font || loaded.has(font)) return Promise.resolve(false);
  loaded.add(font);
  return LOADERS[font]().then(() => true).catch(() => {
    loaded.delete(font); // try again next time (e.g. offline)
    return false;
  });
}

export const SCRIPT_FONTS = Object.keys(LOADERS);
