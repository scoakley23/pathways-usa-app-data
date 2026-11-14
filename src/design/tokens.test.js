import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { COLORS, HOVER, ALIASES, PW_ALIASES, TEXT_PAIRS, PIN_COLORS, FONT_STACK, hex } from './tokens';
import { SCRIPT_FONT, SCRIPT_FONTS, scriptFontFor } from './scriptFonts';
import { COLORS as THEME } from '@/lib/theme';

// The Pathways + Amio style guide, word for word (docs/redesign/amio-style-guide.md).
const GUIDE = {
  navy: '#1E2B45',
  denim: '#3B5B92',
  red: '#F0503C',
  'red-text': '#C8352B',
  gold: '#FFC23D',
  page: '#F5F7FA',
  tint: '#E7ECF4',
  mid: '#C7D1E2',
  line: '#DCE2EC',
  'chip-navy': '#33415E',
  muted: '#4E5A70',
  'on-navy': '#C9D1DF',
  correct: '#1F7A4D',
  'correct-bg': '#E3F3EA',
  'correct-title': '#165C3A',
  'not-yet': '#A8460E',
  'not-yet-bg': '#FFF4EC',
  sky: '#EAF1FA',
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
  it('has every style-guide color with its exact value', () => {
    for (const [name, value] of Object.entries(GUIDE)) expect(COLORS[name], name).toBe(value);
  });

  it('keeps every text pair at 4.5:1 or more', () => {
    for (const [fg, bg] of TEXT_PAIRS) {
      expect(contrast(hex(fg), hex(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('never pairs white text with red or gold', () => {
    expect(contrast(COLORS.white, COLORS.red)).toBeLessThan(4.5);
    expect(TEXT_PAIRS).not.toContainEqual(['white', 'red']);
    expect(TEXT_PAIRS).not.toContainEqual(['white', 'gold']);
  });

  it('points every old name at a real token', () => {
    const names = new Set([...Object.keys(COLORS), ...Object.keys(HOVER)]);
    for (const [alias, target] of [...Object.entries(ALIASES), ...Object.entries(PW_ALIASES)]) {
      expect(names.has(target), `${alias} -> ${target}`).toBe(true);
    }
  });

  it('builds theme.js and the map pins from the tokens only', () => {
    const values = new Set([...Object.values(COLORS), ...Object.values(HOVER)]);
    for (const [name, value] of Object.entries(THEME)) expect(values.has(value), `theme ${name}`).toBe(true);
    for (const [name, value] of Object.entries(PIN_COLORS)) expect(values.has(value), `pin ${name}`).toBe(true);
  });

  it('uses Lexend first and no other Latin fonts', () => {
    expect(FONT_STACK[0]).toBe('Lexend');
    expect(FONT_STACK.filter((f) => !/^(Lexend|Noto Sans.*|system-ui|sans-serif)$/.test(f))).toEqual([]);
  });
});

// The app's languages (LANGUAGES in useLessonTranslation.js), read as text:
// importing that file would load the Base44 client.
const LANGUAGES = [...fs.readFileSync(path.resolve(__dirname, '../hooks/useLessonTranslation.js'), 'utf8')
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
  // Hex colors live only in src/design/tokens.js. VisualEditAgent.jsx is
  // Base44's editor overlay and goes away at cutover;
  // ui/chart.jsx matches recharts' own default colors in CSS selectors.
  const ALLOWED = ['design/tokens.js', 'lib/VisualEditAgent.jsx', 'components/ui/chart.jsx'];
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
