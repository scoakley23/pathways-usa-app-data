import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import * as TOKENS from './tokens';
import {
  COLORS, HOVER, TEXT_PAIRS, PIN_COLORS, FONT_STACK, DISPLAY_STACK, DISPLAY_FONT, RADIUS, SIZES, hex,
} from './tokens';
import { SCRIPT_FONT, SCRIPT_FONTS, scriptFontFor } from './scriptFonts';
import { COLORS as THEME } from '@/lib/theme';

// Amio look v2: every color in docs/design-v2/tokens.css, read from the file
// itself, must be in the tokens with the same value (tokens.css name → ours).
const V2_FILE = fs.readFileSync(path.resolve(__dirname, '../../docs/design-v2/tokens.css'), 'utf8');
const V2 = Object.fromEntries([...V2_FILE.matchAll(/--([a-z0-9-]+):\s*(#[0-9A-Fa-f]{6})\b/g)].map((m) => [m[1], m[2].toUpperCase()]));
const V2_NAMES = { card: 'white' };

// Names not in tokens.css, kept from the older style guide
// (docs/redesign/amio-style-guide.md), with the values decided for v2.
const KEPT = {
  red: '#F0503C',
  'red-text': '#C8352B',
  tint: '#EFE7D6', // = line-soft
  mid: '#E2D8C3', // = line
  'chip-navy': '#33415E',
  'on-navy': '#C9D1DF',
  correct: '#1F7A4D',
  'correct-bg': '#E3F3EA',
  'correct-title': '#165C3A',
  'not-yet': '#A8460E',
  'not-yet-bg': '#FFF4EC',
  'scene-sky': '#EAF1FA',
  grass: '#DCEBDD',
  tree: '#7FA88A',
  'stop-lesson': '#3B5B92',
  'stop-read-write': '#5B7FB8',
  'stop-speak': '#FFC23D',
  'stop-n400': '#6B5FA8',
  'stop-chest': '#FFF3CC',
  'stop-chest-border': '#FFC23D',
  'stop-interview': '#1E2B45',
};

// Borders and icons that carry meaning need 3:1 against what they sit on.
const NON_TEXT_PAIRS = [
  ['navy-deep', 'paper'], // the main button's outline and lip
  ['amio-red', 'white'], // Amio's speech-bubble outline
  ['amio-red', 'paper'], // Amio himself on the page
  ['denim', 'paper'],
  ['muted', 'paper'],
];

function luminance(h) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

describe('design tokens', () => {
  it('has every docs/design-v2/tokens.css color with its exact value', () => {
    expect(Object.keys(V2).length).toBeGreaterThanOrEqual(12);
    for (const [cssName, value] of Object.entries(V2)) {
      const name = V2_NAMES[cssName] || cssName;
      expect(hex(name)?.toUpperCase(), `--${cssName}`).toBe(value);
    }
  });

  it('keeps the older names at their decided values', () => {
    for (const [name, value] of Object.entries(KEPT)) expect(COLORS[name], name).toBe(value);
    expect(COLORS.tint).toBe(COLORS['line-soft']);
    expect(COLORS.mid).toBe(COLORS.line);
    expect(COLORS.red).toBe(COLORS['amio-red']);
  });

  it('uses the v2 shapes: 12px corners, 20px sheets, a 5px lip and a 2.5px outline', () => {
    const px = (v) => Number(V2_FILE.match(new RegExp(`--${v}:\\s*([0-9.]+)px`))[1]);
    expect(RADIUS.card).toBe(px('radius'));
    expect(RADIUS.button).toBe(px('radius'));
    expect(RADIUS.sheet).toBe(px('radius-sheet'));
    expect(SIZES.tap).toBe(px('tap'));
    expect(SIZES.lip).toBe(5);
    expect(SIZES.outline).toBe(2.5);
  });

  it('keeps meaningful borders and icons at 3:1 or more', () => {
    for (const [fg, bg] of NON_TEXT_PAIRS) {
      expect(contrast(hex(fg), hex(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(3);
    }
  });

  it('keeps every text pair at 4.5:1 or more', () => {
    for (const [fg, bg] of TEXT_PAIRS) {
      expect(contrast(hex(fg), hex(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('never uses Amio red for text, and never white text on red or gold', () => {
    expect(contrast(COLORS.white, COLORS['amio-red'])).toBeLessThan(4.5);
    for (const red of ['red', 'amio-red']) {
      expect(TEXT_PAIRS.filter(([fg, bg]) => fg === red || bg === red), red).toEqual([]);
    }
    expect(TEXT_PAIRS).not.toContainEqual(['white', 'gold']);
  });

  it('has no old color names left (Prompt 13)', () => {
    expect(TOKENS.ALIASES).toBeUndefined();
    expect(TOKENS.PW_ALIASES).toBeUndefined();
    const OLD = /(?<![\w-])(?:bg|text|border(?:-[trblxyse])?|ring(?:-offset)?|fill|stroke|from|to|via|decoration|outline|shadow|divide(?:-[xy])?|placeholder|accent|caret)-(?:pw-[a-z]|cream\b|card-line\b|sand\b|sand-hover\b|ink\b|ink-2\b|ink-label\b|page\b|road\b|star\b|star-deep\b|not-correct)/;
    const found = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jsx?|css)$/.test(e.name) && !e.name.endsWith('.test.js')) {
          const m = fs.readFileSync(p, 'utf8').match(OLD);
          if (m) found.push(`${p}: ${m[0]}`);
        }
      }
    };
    walk(path.resolve(__dirname, '..'));
    expect(found).toEqual([]);
  });

  it('builds theme.js and the map pins from the tokens only', () => {
    const values = new Set([...Object.values(COLORS), ...Object.values(HOVER)]);
    for (const [name, value] of Object.entries(THEME)) expect(values.has(value), `theme ${name}`).toBe(true);
    for (const [name, value] of Object.entries(PIN_COLORS)) expect(values.has(value), `pin ${name}`).toBe(true);
  });

  it('uses Lexend for body text and no other Latin fonts', () => {
    expect(FONT_STACK[0]).toBe('Lexend');
    expect(FONT_STACK.filter((f) => !/^(Lexend|Noto Sans.*|system-ui|sans-serif)$/.test(f))).toEqual([]);
  });

  it('uses Bricolage Grotesque for headlines only, then the body stack', () => {
    expect(DISPLAY_FONT).toBe('Bricolage Grotesque');
    expect(DISPLAY_STACK).toEqual([DISPLAY_FONT, ...FONT_STACK]);
  });

  it('self-hosts Bricolage Grotesque 800 only, and never asks Google Fonts', () => {
    const dir = path.resolve(__dirname, 'fonts');
    const files = fs.readdirSync(dir).filter((f) => f.endsWith('.woff2'));
    expect(files.length).toBe(3);
    for (const f of files) expect(f, f).toMatch(/^bricolage-grotesque-(latin|latin-ext|vietnamese)-800-normal\.woff2$/);
    const css = fs.readFileSync(path.join(dir, 'bricolage.css'), 'utf8');
    expect([...css.matchAll(/font-weight:\s*(\d+)/g)].map((m) => m[1])).toEqual(['800', '800', '800']);
    for (const m of css.matchAll(/url\(\.\/([^)]+)\)/g)) expect(files, m[1]).toContain(m[1]);
    const main = fs.readFileSync(path.resolve(__dirname, '../main.jsx'), 'utf8');
    expect(main).toContain("import '@/design/fonts/bricolage.css'");
    const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
    expect(`${html}${main}${css}`).not.toMatch(/fonts\.(googleapis|gstatic)\.com/);
  });
});

// The app's languages (LANGUAGES in src/lib/languages.js), read as text:
// (kept as text so the test needs no imports).
const LANGUAGES = [...fs.readFileSync(path.resolve(__dirname, '../lib/languages.js'), 'utf8')
  .slice(0, 4000).matchAll(/value: ?'([a-z-]+)'/g)].map((m) => ({ value: m[1] }));

describe('script fonts', () => {
  // Languages written in Latin letters, which Lexend covers.
  const LATIN = [
    'en', 'es', 'vi', 'tl', 'fr', 'pt', 'ht', 'so', 'sw', 'pl', 'de', 'it', 'hmn', 'yo', 'id', 'ceb', 'ilo',
    'om', 'ig', 'ha', 'wo', 'ak', 'ff', 'uz', 'az', 'ro', 'sq', 'bs', 'nl', 'cs', 'hu',
  ];

  it('has a font for every app language not written in Latin letters', () => {
    expect(LANGUAGES.length).toBeGreaterThan(60);
    for (const { value } of LANGUAGES) {
      if (LATIN.includes(value)) expect(scriptFontFor(value), value).toBeNull();
      else expect(SCRIPT_FONTS, value).toContain(scriptFontFor(value));
    }
  });

  it('maps every script to a family in the font stack', () => {
    const family = { 'noto-sans': 'Noto Sans', sc: 'Noto Sans SC', jp: 'Noto Sans JP', kr: 'Noto Sans KR' };
    for (const font of new Set(Object.values(SCRIPT_FONT))) {
      const name = family[font] || `Noto Sans ${font[0].toUpperCase()}${font.slice(1)}`;
      expect(FONT_STACK, font).toContain(name);
    }
  });

  it('handles regional codes and right-to-left languages', () => {
    expect(scriptFontFor('fa-AF')).toBe('arabic');
    expect(scriptFontFor('prs')).toBe('arabic');
    expect(scriptFontFor('zh')).toBe('sc');
    expect(scriptFontFor('')).toBeNull();
  });
});

describe('no one-off colors', () => {
  // Hex colors live only in src/design/tokens.js.
  // ui/chart.jsx matches recharts' own default colors in CSS selectors.
  const ALLOWED = ['design/tokens.js', 'components/ui/chart.jsx'];
  const SRC = path.resolve(__dirname, '..');

  function files(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) return e.name === 'data' ? [] : files(p);
      return /\.(js|jsx|css)$/.test(e.name) && !/\.test\.js$/.test(e.name) ? [p] : [];
    });
  }

  it('has no hex colors outside the tokens file', () => {
    const found = [];
    for (const file of files(SRC)) {
      const rel = path.relative(SRC, file).split(path.sep).join('/');
      if (ALLOWED.includes(rel)) continue;
      const text = fs.readFileSync(file, 'utf8');
      for (const m of text.matchAll(/#[0-9A-Fa-f]{6}\b|#[0-9A-Fa-f]{3}\b(?![0-9A-Za-z])/g)) {
        // Skip URL fragments and ids like "#ready-to-file" (not colors).
        if (/^#[0-9]+$/.test(m[0]) && m[0].length !== 4 && m[0].length !== 7) continue;
        found.push(`${rel}: ${m[0]}`);
      }
    }
    expect(found).toEqual([]);
  });
});
