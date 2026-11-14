import { describe, it, expect } from 'vitest';

// The tutor is Amio. The old default name "Vía" (and its read-aloud spelling
// "Vee-ah") must not appear anywhere in the app's code, text, data or
// backend: not on screens, not in translation sources, not in comments.
// Tests are not scanned (they check that an old saved "Vía" is ignored).
const appFiles = import.meta.glob(
  ['../**/*.{js,jsx,ts,tsx,json,css,html}', '!../**/*.test.js'],
  { query: '?raw', import: 'default', eager: true },
);
const backendFiles = import.meta.glob('../../base44/**/*.{js,ts,json,jsonc}', { query: '?raw', import: 'default', eager: true });
const pageFiles = import.meta.glob('../../index.html', { query: '?raw', import: 'default', eager: true });

// The one exception: src/data/officeholders.json is replaced each month from
// the official-sites check and never edited by hand (CLAUDE.md). One of its
// internal notes says "before Vía answers"; that note is never shown to
// learners and never sent to the AI. The next monthly update should say Amio.
const EXCEPTIONS = { '../data/officeholders.json': 1 };

// "Vía" with its accent (any case) as a whole word, or "Vee-ah". Plain "via"
// is a normal English word, and Spanish "todavía" is fine.
const OLD_NAME = /\bv[íÍ]a\b|vee-ah/gi;
const hits = (src) => (src.match(OLD_NAME) || []).length;

describe('the tutor is called Amio everywhere', () => {
  it('no app file says "Vía"', () => {
    const found = Object.entries(appFiles)
      .map(([file, src]) => [file, hits(src)])
      .filter(([file, n]) => n > (EXCEPTIONS[file] || 0));
    expect(found).toEqual([]);
  });

  it('no backend file or page shell says "Vía"', () => {
    const found = Object.entries({ ...backendFiles, ...pageFiles })
      .map(([file, src]) => [file, hits(src)])
      .filter(([, n]) => n > 0);
    expect(found).toEqual([]);
  });

  it('the officeholders exception is still just that one note', () => {
    expect(hits(appFiles['../data/officeholders.json'])).toBe(1);
  });

  it('the check would catch the old name', () => {
    expect(hits("Hi, I'm Vía")).toBe(1);
    expect(hits('Ask VÍA')).toBe(1);
    expect(hits('say Vee-ah')).toBe(1);
    expect(hits('“Vía” means “way”')).toBe(1);
    expect(hits('via the API, Via Rail')).toBe(0); // plain "via" is a normal English word
    expect(hits('Todavía no sé')).toBe(0); // Spanish "still / not yet"
  });
});
