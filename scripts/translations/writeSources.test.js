// Writes content/translations/_sources.json from src/lib/translationSources.js.
// Run with: npm run translations:sources
import { it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

import { installFakeWindow } from './fakeWindow.js';

installFakeWindow();
vi.mock('@/lib/app-params', () => ({ appParams: {} }));
vi.mock('@/api/base44Client', () => ({ base44: { entities: {}, auth: {}, functions: {}, integrations: { Core: {} } } }));

it('writes _sources.json', async () => {
  const { collectSources } = await import('../../src/lib/translationSources');
  const sources = collectSources();
  const file = path.resolve(__dirname, '../../content/translations/_sources.json');
  fs.writeFileSync(file, `${JSON.stringify(sources, null, 1)}\n`);
  console.log(`Wrote ${sources.texts.length} texts for ${sources.languages.length} languages to content/translations/_sources.json`);
}, 120000);
