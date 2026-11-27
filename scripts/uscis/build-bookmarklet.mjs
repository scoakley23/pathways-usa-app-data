#!/usr/bin/env node
// Builds the owner's "Pathways: copy N-400 times" helper from
// src/lib/uscisTimesParse.js + scripts/uscis/copy-n400-times.js:
//   scripts/uscis/bookmarklet.txt          the bookmark's address (javascript:…)
//   scripts/uscis/copy-n400-times.console.js  the same code, to paste in the browser console
// Run with `npm run uscis:bookmarklet` after changing either file;
// src/lib/uscisTimesParse.test.js fails when the built files are stale.
// See content/uscis/README.md ("Every month").
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
export const OUT_BOOKMARK = path.join(HERE, 'bookmarklet.txt');
export const OUT_CONSOLE = path.join(HERE, 'copy-n400-times.console.js');

/** The helper as one self-contained script (no imports, no exports). */
export function buildBundle() {
  const parse = fs.readFileSync(path.join(ROOT, 'src/lib/uscisTimesParse.js'), 'utf8').replace(/^export /gm, '');
  const helper = fs.readFileSync(path.join(HERE, 'copy-n400-times.js'), 'utf8');
  return `// Built by scripts/uscis/build-bookmarklet.mjs. Do not edit; edit the sources and rebuild.\n(function () {\n${parse}\n${helper}\ncopyN400Times();\n})();\n`;
}

// Comment-only lines are dropped to keep the bookmark short (code lines never start with //).
export const bookmarkFor = (bundle) => `javascript:${encodeURIComponent(bundle.split('\n').filter((l) => !/^\s*\/\//.test(l)).join('\n'))}`;

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const bundle = buildBundle();
  fs.writeFileSync(OUT_CONSOLE, bundle);
  fs.writeFileSync(OUT_BOOKMARK, `${bookmarkFor(bundle)}\n`);
  console.log(`Wrote ${path.relative(ROOT, OUT_CONSOLE)} and ${path.relative(ROOT, OUT_BOOKMARK)} (${bookmarkFor(bundle).length} characters).`);
}
