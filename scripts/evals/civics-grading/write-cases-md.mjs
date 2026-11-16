// Writes cases.md from cases.json: npm run evals:civics:cases
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { casesMarkdown } from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const cases = JSON.parse(fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8')).cases;
const questions = JSON.parse(fs.readFileSync(path.resolve(HERE, '../../../content/base44-export/civics-questions-2025.json'), 'utf8'));
fs.writeFileSync(path.join(HERE, 'cases.md'), casesMarkdown(cases, questions));
console.log(`Wrote cases.md (${cases.length} cases).`);
