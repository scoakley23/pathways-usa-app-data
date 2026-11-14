// Pathways + Amio design tokens: the ONE place for colors, fonts, radii and
// sizes (docs/redesign/amio-style-guide.md). tailwind.config.js, the shadcn
// CSS variables (generated from this file) and src/lib/theme.js all read
// from here. Plain JS with no imports, so Tailwind's config can load it too.

// Style-guide colors, exact names and values.
export const COLORS = {
  navy: '#1E2B45', // top banner, main text
  denim: '#3B5B92', // main actions, progress, current step, the learner's answers (white text)
  red: '#F0503C', // Amio, the "you are here" stop, the little flag. Never small text or errors
  'red-text': '#C8352B', // red that needs white text on it (e.g. "end call")
  gold: '#FFC23D', // stars, rewards, badges, Speak it! checkpoints (navy text)
  page: '#F5F7FA', // page background
  tint: '#E7ECF4', // scene backgrounds, step dots, progress tracks
  mid: '#C7D1E2', // illustration details, the road, locked-stop shadows
  line: '#DCE2EC', // borders
  'chip-navy': '#33415E', // pills on the navy banner
  muted: '#4E5A70', // secondary text
  'on-navy': '#C9D1DF', // secondary text on navy
  correct: '#1F7A4D', // success, always with a check icon
  'correct-bg': '#E3F3EA', // success banner background
  'correct-title': '#165C3A', // success banner title
  'not-yet': '#A8460E', // "not quite", always with words
  'not-yet-bg': '#FFF4EC', // not-yet banner background
  // Journey illustrations only.
  sky: '#EAF1FA',
  grass: '#DCEBDD',
  tree: '#7FA88A',
  // Stop types on the road.
  'stop-lesson': '#3B5B92',
  'stop-read-write': '#5B7FB8',
  'stop-speak': '#FFC23D',
  'stop-n400': '#6B5FA8',
  'stop-chest': '#FFF3CC',
  'stop-chest-border': '#FFC23D',
  'stop-interview': '#1E2B45',
  white: '#FFFFFF',
};

// Not in the style guide: hover shades for the two dark fills.
export const HOVER = {
  'denim-deep': '#2F4A78',
  'navy-deep': '#141E33',
};

// Old names ("The Road" and the older pw-* names), each pointing at a
// style-guide color so screens not yet redone follow the new palette.
// Later prompts replace them with the names above; Prompt 13 removes what's left.
export const ALIASES = {
  cream: 'page',
  'card-line': 'line',
  sand: 'tint',
  'sand-hover': 'line',
  ink: 'navy',
  'ink-2': 'muted',
  'ink-label': 'muted',
  'navy-2': 'chip-navy',
  'navy-line': 'chip-navy',
  road: 'chip-navy',
  star: 'red',
  'star-deep': 'red-text',
  'not-correct': 'not-yet',
  'not-correct-text': 'not-yet',
  'not-correct-soft': 'not-yet-bg',
  'correct-soft': 'correct-bg',
};

// The pw-* names, same idea.
export const PW_ALIASES = {
  navy: 'navy',
  'navy-deep': 'navy-deep',
  ink: 'navy',
  'ink-deep': 'navy-deep',
  red: 'red',
  page: 'page',
  line: 'line',
  muted: 'muted',
  linen: 'tint',
  slate: 'tint',
  manila: 'tint',
  sky: 'tint',
  plum: 'navy',
  go: 'correct',
  almost: 'gold',
  miss: 'not-yet',
  rule: 'line',
  margin: 'line',
  civics: 'navy',
  reading: 'navy',
  writing: 'navy',
  speaking: 'navy',
  soft: 'tint',
  'soft-hover': 'line',
  'red-soft': 'not-yet-bg',
  'red-ink': 'not-yet',
  'red-deep': 'not-yet',
  'blue-soft': 'tint',
  'blue-ink': 'navy',
  'teal-soft': 'tint',
  'teal-ink': 'navy',
  'green-soft': 'correct-bg',
  'green-ink': 'correct',
  highlight: 'stop-chest',
};

const ALL = { ...COLORS, ...HOVER };
export const hex = (name) => ALL[name];

// Map pins on the Resource Hub, by place category.
export const PIN_COLORS = {
  legal: COLORS.denim,
  esl: COLORS['stop-read-write'],
  citizenship_class: COLORS['stop-n400'],
  uscis: COLORS.navy,
  library: COLORS.muted,
  other: COLORS.muted,
};

// Lexend for everything. The Noto families load only when the learner picks
// a language that needs them (src/design/scriptFonts.js).
export const FONT_STACK = [
  'Lexend',
  'Noto Sans',
  'Noto Sans Arabic',
  'Noto Sans SC',
  'Noto Sans JP',
  'Noto Sans KR',
  'Noto Sans Devanagari',
  'Noto Sans Bengali',
  'Noto Sans Gurmukhi',
  'Noto Sans Gujarati',
  'Noto Sans Tamil',
  'Noto Sans Telugu',
  'Noto Sans Kannada',
  'Noto Sans Malayalam',
  'Noto Sans Thai',
  'Noto Sans Myanmar',
  'Noto Sans Khmer',
  'Noto Sans Ethiopic',
  'Noto Sans Sinhala',
  'Noto Sans Lao',
  'Noto Sans Hebrew',
  'Noto Sans Armenian',
  'Noto Sans Georgian',
  'system-ui',
  'sans-serif',
];

export const FONT_WEIGHTS = { body: 400, medium: 500, label: 600, heading: 700, celebrate: 800 };

// [size, line height] in px.
export const TYPE = {
  small: [13, 18], // small text, 12-13px
  body: [16, 24], // body, 15-16px
  title: [20, 26], // screen title
  question: [24, 31], // lesson question, 22-26px
  celebrate: [30, 36], // celebration title, 28-32px
};

export const RADIUS = { card: 20, button: 16, sheet: 28 };

export const SIZES = {
  tap: 44, // every tap target
  button: 56, // main button height
  lip: 5, // the main button's darker lip
  mic: 96, // the microphone on speaking screens (R33Teach)
};

// Text pairs that must reach 4.5:1 (checked by tokens.test.js).
export const TEXT_PAIRS = [
  ['white', 'denim'],
  ['white', 'red-text'],
  ['white', 'navy'],
  ['white', 'correct'],
  ['white', 'not-yet'],
  ['navy', 'gold'],
  ['navy', 'page'],
  ['navy', 'white'],
  ['navy', 'tint'],
  ['muted', 'page'],
  ['muted', 'white'],
  ['on-navy', 'navy'],
  ['white', 'chip-navy'],
  ['denim', 'white'],
  ['correct', 'correct-bg'],
  ['correct-title', 'correct-bg'],
  ['not-yet', 'not-yet-bg'],
  ['not-yet', 'page'],
];
