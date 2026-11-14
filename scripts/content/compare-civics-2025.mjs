#!/usr/bin/env node
// Compares the Base44 export of the 2025 civics questions
// (content/base44-export/civics-questions-2025.json) with the curated copy
// (content/civics/questions-2025.json), character for character, and writes
// docs/content-import/civics-2025-differences.md. It reports differences;
// it never picks a winner or changes either file.
//
//   node scripts/content/compare-civics-2025.mjs

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const load = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const exported = load('content/base44-export/civics-questions-2025.json');
const curated = load('content/civics/questions-2025.json');
const FIELDS = ['answer', 'category'];

const loose = (s) => s.toLowerCase().replace(/[\W_]+/g, ' ').trim();
const byQuestion = (rows) => new Map(rows.map((r) => [r.question, r]));
const ex = byQuestion(exported);
const cu = byQuestion(curated);

const lines = [];
const both = [...ex.keys()].filter((q) => cu.has(q));
const onlyExport = [...ex.keys()].filter((q) => !cu.has(q));
const onlyCurated = [...cu.keys()].filter((q) => !ex.has(q));

const fieldDiffs = [];
for (const q of both) {
  for (const f of FIELDS) if (ex.get(q)[f] !== cu.get(q)[f]) fieldDiffs.push({ q, f, a: ex.get(q)[f], b: cu.get(q)[f] });
}

lines.push('# 2025 civics questions: Base44 export vs `content/civics/questions-2025.json`', '');
lines.push(`Made by \`scripts/content/compare-civics-2025.mjs\`. Exact comparison (case, spaces and punctuation count). Nothing was changed in either file.`, '');
lines.push('| | Count |', '|---|---|');
lines.push(`| Questions in the export | ${exported.length} |`);
lines.push(`| Questions in the curated file | ${curated.length} |`);
lines.push(`| Same question text in both | ${both.length} |`);
lines.push(`| Only in the export | ${onlyExport.length} |`);
lines.push(`| Only in the curated file | ${onlyCurated.length} |`);
lines.push(`| Answer or category differs (same question) | ${fieldDiffs.length} |`, '');

if (!onlyExport.length && !onlyCurated.length && !fieldDiffs.length) {
  lines.push('**No differences.** Every question, answer and category is identical, character for character.', '');
}
if (onlyExport.length || onlyCurated.length) {
  lines.push('## Questions in only one file', '');
  for (const [label, list, other] of [['Only in the export', onlyExport, cu], ['Only in the curated file', onlyCurated, ex]]) {
    for (const q of list) {
      const near = [...other.keys()].find((o) => loose(o) === loose(q));
      lines.push(`- ${label}: "${q}"${near ? ` (closest in the other file: "${near}")` : ''}`);
    }
  }
  lines.push('');
}
if (fieldDiffs.length) {
  lines.push('## Different answers or categories', '');
  for (const d of fieldDiffs) {
    lines.push(`### ${d.q}`, '', `- **${d.f}** in the export: \`${d.a}\``, `- **${d.f}** in the curated file: \`${d.b}\``, '');
  }
}
const extra = [...new Set(exported.flatMap((r) => Object.keys(r)))].filter((k) => !['question', ...FIELDS].includes(k));
lines.push(`The export also has these fields, which the curated file doesn't: ${extra.map((k) => `\`${k}\``).join(', ')}.`, '');

const out = path.join(ROOT, 'docs/content-import/civics-2025-differences.md');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${lines.join('\n')}`);
console.log(lines.slice(4, 11).join('\n'));
