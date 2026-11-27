#!/usr/bin/env node
// Applies the result of the owner's "copy N-400 times" helper to
// content/uscis/n400-processing-times.json.
//
//   npm run uscis:apply -- path/to/result.json
//   npm run uscis:apply -- path/to/result.json --remove-missing
//   npm run uscis:apply -- path/to/result.json --dry-run
//
// Prints what changed, then writes the file (unless --dry-run or something
// blocks it). Then run `npm test` and open a pull request into standalone.
// Never fetches anything: it only reads the file you give it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { planTimesUpdate, formatTimesFile } from '../../src/lib/processingTimesImport.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.resolve(HERE, '../../content/uscis/n400-processing-times.json');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('Usage: npm run uscis:apply -- <result.json> [--remove-missing] [--dry-run]');
  process.exit(2);
}
const current = JSON.parse(fs.readFileSync(DATA, 'utf8'));
let result;
try { result = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
  console.error(`Could not read ${file} as JSON: ${e.message}`);
  process.exit(2);
}

const plan = planTimesUpdate(current, result, { removeMissing: args.includes('--remove-missing') });
console.log(`Read on ${result.read_on}: ${result.offices?.length ?? 0} offices.`);
console.log(`Unchanged: ${plan.unchanged}`);
console.log(`Changed: ${plan.changed.length}${plan.changed.map((c) => `\n  ${c.id}: ${c.from} → ${c.to} months`).join('')}`);
console.log(`New: ${plan.added.length}${plan.added.map((a) => `\n  ${a.id} (${a.name} ${a.state}): ${a.months} months`).join('')}`);
console.log(`No longer listed by USCIS: ${plan.missing.length}${plan.missing.map((m) => `\n  ${m.id}`).join('')}`);

if (!plan.ok) {
  console.error(`\nNot written. Fix these first:\n${plan.blockers.map((b) => `  - ${b}`).join('\n')}`);
  process.exit(1);
}
if (args.includes('--dry-run')) {
  console.log('\nDry run: nothing written.');
} else {
  fs.writeFileSync(DATA, formatTimesFile(plan.data));
  console.log(`\nWrote ${path.relative(process.cwd(), DATA)} (checked_on ${plan.data.checked_on}). Now run npm test.`);
}
