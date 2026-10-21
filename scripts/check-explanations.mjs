#!/usr/bin/env node
// Prints every lesson explanation whose question or answers differ from the
// official list (content/civics/questions-2025.json). Same rules as the test
// src/lib/explanations.test.js, without needing Vitest:
//   node scripts/check-explanations.mjs
// Exit code 1 if anything is wrong.
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));

// Copy of splitOfficialAnswers in src/lib/practiceChecks.js (keep in sync).
const splitOfficialAnswers = (answer) => (answer || '').split(/\n|;|•|\s\/\s/).map((a) => a.trim()).filter(Boolean);

const official = new Map(readJson('content/civics/questions-2025.json').map((q) => [q.question, q]));
const dir = 'content/explanations';
let problems = 0;
const report = (msg) => { problems += 1; console.log(`  ✗ ${msg}`); };

for (const file of readdirSync(join(root, dir)).filter((f) => f.endsWith('.json')).sort()) {
  const table = readJson(`${dir}/${file}`);
  const entries = Object.entries(table);
  const reviewed = entries.filter(([, e]) => e?.status === 'reviewed').length;
  console.log(`${file}: ${entries.length} entries, ${reviewed} reviewed`);
  for (const [key, e] of entries) {
    const where = `"${key}"`;
    if (e?.question !== key) report(`${where}: key does not equal the "question" field`);
    if (!['draft', 'reviewed'].includes(e?.status)) report(`${where}: status must be "draft" or "reviewed"`);
    const q = official.get(e?.question);
    if (!q) { report(`${where}: not in content/civics/questions-2025.json`); continue; }
    const expected = splitOfficialAnswers(q.answer);
    if (JSON.stringify(e.answers) !== JSON.stringify(expected)) {
      report(`${where}: answers ${JSON.stringify(e.answers)} differ from official ${JSON.stringify(expected)}`);
    }
    if (e.link !== undefined) {
      let ok = false;
      try { const u = new URL(e.link?.url); ok = u.protocol === 'https:' && /(\.gov|\.mil|\.si\.edu)$/.test(u.hostname); } catch (err) { ok = false; }
      if (!ok) report(`${where}: link.url must be an https link to a .gov, .mil or .si.edu site`);
      if (!e.link?.label) report(`${where}: link.label is missing`);
    }
    const source = `${q.question} ${expected.join(' ')}`.toLowerCase();
    for (const k of e.keyWords || []) {
      if (!k?.en || !source.includes(String(k.en).toLowerCase())) report(`${where}: key word "${k?.en}" is not in the official text`);
    }
  }
}

console.log(problems ? `\n${problems} problem(s) found.` : '\nAll explanations match the official questions and answers.');
process.exit(problems ? 1 : 0);
