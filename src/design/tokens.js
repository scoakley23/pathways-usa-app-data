// Pathways + Amio design tokens: the ONE place for colors, fonts, radii and
// sizes. Values follow docs/design-v2/tokens.css (Amio look v2, Nov 18, 2026);
// names not in that file keep the older style guide's names
// (docs/redesign/amio-style-guide.md). tailwind.config.js, the shadcn CSS
// variables (generated from this file) and src/lib/theme.js all read from
// here. Plain JS with no imports, so Tailwind's config can load it too.

// Colors. The first block is docs/design-v2/tokens.css word for word.
export const COLORS = {
  'amio-red': '#F0503C', // Amio ONLY: the character and its speech-bubble outline. Never errors, never text
  navy: '#1E2B45', // main text, dark blocks, speaking screens
  'navy-2': '#2A3A5C', // "You said" box on navy
  'navy-line': '#3A4A6B', // empty progress on navy
  denim: '#3B5B92', // main actions today; the Reading color in v2
  gold: '#FFC23D', // stars, rewards, "done" marks; the Writing color in v2 (navy text)
  sky: '#A9CBEC', // the Civics color; highlighted / current block
  paper: '#FBF7EE', // page background
  line: '#E2D8C3', // borders and dividers on paper
  'line-soft': '#EFE7D6', // empty progress on paper; dividers inside cards
  muted: '#6B6555', // secondary text on paper
  white: '#FFFFFF', // cards (tokens.css: --card)
  // Amio's cheeks in the "proud" mood (docs/design-v2/amio/Amio.tsx). Amio only.
  'amio-blush': '#FFB3A6',

  // Older names, kept until the screens that use them are redone.
  red: '#F0503C', // = amio-red. The non-Amio uses are listed in the amio-v2/base PR; later prompts remove them
  'red-text': '#C8352B', // red that needs white text on it (e.g. "end call")
  tint: '#EFE7D6', // = line-soft: soft fills, step dots, progress tracks
  mid: '#E2D8C3', // = line: illustration details, the road, locked-stop outlines
  'chip-navy': '#33415E', // pills on the navy banner
  'on-navy': '#C9D1DF', // secondary text on navy
  correct: '#1F7A4D', // success, always with a check icon
  'correct-bg': '#E3F3EA', // success banner background
  'correct-title': '#165C3A', // success banner title
  'not-yet': '#A8460E', // "not quite", always with words
  'not-yet-bg': '#FFF4EC', // not-yet banner background
  // Journey illustrations only.
  'scene-sky': '#EAF1FA', // the pale sky behind the journey and Today's lesson scene
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
};

// navy-deep is in tokens.css (the main button's outline and lip, and the navy
// hover). denim-deep is not: the hover shade for denim fills.
export const HOVER = {
  'denim-deep': '#2F4A78',
  'navy-deep': '#0B1222',
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

// Lexend for everything except headlines. The Noto families load only when the learner picks
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

// Headlines and big numbers only: Bricolage Grotesque 800 (self-hosted from
// src/design/fonts/, latin, latin-ext and Vietnamese), then the body stack for
// every other script.
export const DISPLAY_FONT = 'Bricolage Grotesque';
export const DISPLAY_STACK = [DISPLAY_FONT, ...FONT_STACK];

export const FONT_WEIGHTS = { body: 400, medium: 500, label: 600, heading: 700, celebrate: 800, display: 800 };

// [size, line height] in px.
export const TYPE = {
  small: [13, 18], // small text, 12-13px
  body: [16, 24], // body, 15-16px
  title: [20, 26], // screen title
  question: [24, 31], // lesson question, 22-26px
  celebrate: [30, 36], // celebration title, 28-32px
};

// tokens.css: 12px for blocks, cards and buttons; 20px for bottom panels
// (top corners only).
export const RADIUS = { card: 12, button: 12, sheet: 20 };

export const SIZES = {
  tap: 44, // every tap target
  button: 56, // main button height
  lip: 5, // the main button's navy-deep lip
  outline: 2.5, // the main button's navy-deep outline
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
  ['navy', 'paper'],
  ['navy', 'white'],
  ['navy', 'tint'],
  ['muted', 'tint'],
  ['denim', 'tint'],
  ['navy', 'sky'],
  ['navy', 'line-soft'],
  ['white', 'navy-2'],
  ['muted', 'line-soft'],
  ['muted', 'paper'],
  ['muted', 'white'],
  ['on-navy', 'navy'],
  ['white', 'chip-navy'],
  ['denim', 'white'],
  ['correct', 'correct-bg'],
  ['correct-title', 'correct-bg'],
  ['not-yet', 'not-yet-bg'],
  ['not-yet', 'paper'],
];
