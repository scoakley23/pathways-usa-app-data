// The translation pack's source list (src/lib/translationSources.js) must
// cover every list a screen translates, and content/translations/_sources.json
// must be up to date (run `npm run translations:sources` after changing text).
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { installFakeWindow } from '../../scripts/translations/fakeWindow.js';

installFakeWindow();
vi.mock('@/lib/app-params', () => ({ appParams: {} }));
vi.mock('@/api/base44Client', () => ({ base44: { entities: {}, auth: {}, functions: {}, integrations: { Core: {} } } }));

const { STRING_SETS, collectSources } = await import('./translationSources');

const ROOT = path.resolve(__dirname, '../..');

function sourceFiles(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) { sourceFiles(full, out); continue; }
    if (/\.(js|jsx)$/.test(name) && !/\.test\.js$/.test(name)) out.push(full);
  }
  return out;
}

describe('translation sources', () => {
  it('every list a screen translates is in STRING_SETS', () => {
    const registered = new Set(STRING_SETS.flatMap((s) => s.usedIn.map(([file, name]) => `${file}:${name}`)));
    const missing = [];
    for (const full of sourceFiles(path.join(ROOT, 'src'))) {
      const rel = path.relative(ROOT, full).split(path.sep).join('/');
      if (rel.endsWith('useTranslatedLines.js')) continue; // the hook itself
      const text = fs.readFileSync(full, 'utf8');
      for (const m of text.matchAll(/useTranslatedLines\(\s*([A-Za-z_$][\w$]*)/g)) {
        if (!registered.has(`${rel}:${m[1]}`)) missing.push(`${rel}: ${m[1]}`);
      }
      if (/\buseHomeTranslation\(/.test(text) && !registered.has('src/hooks/useHomeTranslation.js:HOME_STRINGS')) missing.push(`${rel}: HOME_STRINGS`);
    }
    expect(missing).toEqual([]);
  });

  it('collects every app language and only real texts', () => {
    const { languages, texts } = collectSources();
    expect(languages.length).toBeGreaterThan(50);
    expect(languages.some((l) => l.value === 'en')).toBe(false);
    expect(texts.length).toBeGreaterThan(500);
    expect(texts.every((t) => typeof t.text === 'string' && t.text.trim() && t.from.length)).toBe(true);
    const all = new Set(texts.map((t) => t.text));
    expect(all.has('What is the supreme law of the land?')).toBe(true);
  });

  it('content/translations/_sources.json is up to date (npm run translations:sources)', () => {
    const file = path.join(ROOT, 'content/translations/_sources.json');
    expect(fs.existsSync(file), 'run npm run translations:sources').toBe(true);
    expect(JSON.parse(fs.readFileSync(file, 'utf8'))).toEqual(collectSources());
  });
});
