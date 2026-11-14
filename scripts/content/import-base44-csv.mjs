#!/usr/bin/env node
// Converts the Base44 content exports (CSV, one per entity) into JSON in
// content/base44-export/, for the move off Base44 (Standalone App Plan).
//
//   node scripts/content/import-base44-csv.mjs <folder with the *_export.csv files>
//
// - Types come from the entity definitions in base44/entities/*.jsonc:
//   numbers, booleans, and nested arrays/objects (written as JSON text in the
//   CSV) become real values. A nested cell that isn't valid JSON stops the run.
// - Text is copied exactly (not trimmed), so official questions and answers
//   never change.
// - Each row keeps its Base44 `id` (lesson_id links keep working). Base44's
//   own columns are dropped: created_by (an email), created_by_id,
//   created_date, updated_date, is_sample.
// - Content entities only. No learner tables are read or written.
// - The raw CSVs are not committed (they carry the creator's email);
//   manifest.json records each CSV's row count and SHA-256 instead.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(ROOT, 'content/base44-export');

// entity -> output file(s). CivicsQuestion splits by version.
export const ENTITIES = {
  CivicsQuestion: { split: 'version', files: { 2008: 'civics-questions-2008.json', 2025: 'civics-questions-2025.json' } },
  InterviewQuestion: { file: 'interview-questions.json' },
  ReadingSentence: { file: 'reading-sentences.json' },
  Sentence: { file: 'writing-sentences.json' },
  VocabularyWord: { file: 'vocabulary-words.json' },
  Lesson: { file: 'lessons.json' },
  // Rows whose lesson was deleted in Base44 get the lesson named for them in
  // content/base44-export/lesson-reassignments.json (their old id is kept as
  // original_lesson_id). A row with a missing lesson and no assignment stops
  // the run, so no quiz or flashcard is ever left without a lesson.
  LessonQuiz: { file: 'lesson-quizzes.json', linkTo: 'Lesson' },
  LessonFlashcard: { file: 'lesson-flashcards.json', linkTo: 'Lesson' },
  CommunityResource: { file: 'community-resources.json' },
};

const REASSIGNMENTS_FILE = path.join(OUT, 'lesson-reassignments.json');
const REASSIGNMENTS = fs.existsSync(REASSIGNMENTS_FILE) ? JSON.parse(fs.readFileSync(REASSIGNMENTS_FILE, 'utf8')) : {};

// Base44's own columns, dropped from every row (created_by is an email).
export const DROPPED = ['created_by', 'created_by_id', 'created_date', 'updated_date', 'is_sample'];

// RFC 4180 CSV: quoted fields, "" escapes, commas and newlines inside quotes.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i += 1; } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { row.push(field); field = ''; } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i += 1;
      row.push(field); rows.push(row); row = []; field = '';
    } else field += c;
  }
  if (quoted) throw new Error('CSV ends inside a quoted field');
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ''));
  return body.map((r, n) => {
    if (r.length !== header.length) throw new Error(`row ${n + 2}: ${r.length} fields, header has ${header.length}`);
    return Object.fromEntries(header.map((h, k) => [h, r[k]]));
  });
}

// The entity's field types from base44/entities/<Name>.jsonc.
export function loadSchema(entity) {
  const raw = fs.readFileSync(path.join(ROOT, 'base44/entities', `${entity}.jsonc`), 'utf8')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1');
  const props = JSON.parse(raw).properties || {};
  return Object.fromEntries(Object.entries(props).map(([k, v]) => [k, [].concat(v.type || 'string')]));
}

// One CSV cell -> its typed value. Empty cells of non-text fields are null.
export function convert(value, types, where) {
  const main = types.find((t) => t !== 'null') || 'string';
  if (main === 'string') return value;
  if (value === '') return null;
  if (main === 'number' || main === 'integer') {
    const n = Number(value);
    if (!Number.isFinite(n)) throw new Error(`${where}: not a number: ${value}`);
    return n;
  }
  if (main === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
    throw new Error(`${where}: not true/false: ${value}`);
  }
  if (main === 'array' || main === 'object') {
    let parsed;
    try { parsed = JSON.parse(value); } catch (e) { throw new Error(`${where}: not valid JSON: ${value.slice(0, 80)}`); }
    if (main === 'array' && !Array.isArray(parsed)) throw new Error(`${where}: expected a list`);
    return parsed;
  }
  throw new Error(`${where}: unknown type ${main}`);
}

export function convertRows(entity, rows) {
  const schema = loadSchema(entity);
  return rows.map((row, n) => {
    const out = { id: row.id };
    for (const [key, value] of Object.entries(row)) {
      if (key === 'id' || DROPPED.includes(key)) continue;
      if (!schema[key]) throw new Error(`${entity} row ${n + 2}: column "${key}" isn't in base44/entities/${entity}.jsonc`);
      out[key] = convert(value, schema[key], `${entity} row ${n + 2}, ${key}`);
    }
    if (!out.id) throw new Error(`${entity} row ${n + 2}: no id`);
    return out;
  });
}

function main(dir) {
  if (!dir) {
    console.error('usage: node scripts/content/import-base44-csv.mjs <folder with the *_export.csv files>');
    process.exit(1);
  }
  fs.mkdirSync(OUT, { recursive: true });
  const converted = {};
  const manifest = { source: 'Base44 data export (CSV), converted by scripts/content/import-base44-csv.mjs', dropped_columns: DROPPED, entities: {} };
  for (const [entity, spec] of Object.entries(ENTITIES)) {
    const file = path.join(dir, `${entity}_export.csv`);
    const bytes = fs.readFileSync(file);
    const rows = convertRows(entity, parseCsv(bytes.toString('utf8')));
    converted[entity] = rows;
    const outputs = {};
    const write = (name, part) => {
      fs.writeFileSync(path.join(OUT, name), `${JSON.stringify(part, null, 2)}\n`);
      outputs[name] = part.length;
    };
    if (spec.linkTo) {
      const ids = new Set((converted[spec.linkTo] || []).map((r) => r.id));
      if (!ids.size) throw new Error(`${entity}: convert ${spec.linkTo} first`);
      const moves = new Map((REASSIGNMENTS[entity] || []).map((m) => [m.id, m]));
      write(spec.file, rows.map((r) => {
        if (ids.has(r.lesson_id)) return r;
        const move = moves.get(r.id);
        if (!move || move.deleted_lesson_id !== r.lesson_id || !ids.has(move.lesson_id)) {
          throw new Error(`${entity} ${r.id}: lesson ${r.lesson_id} doesn't exist and lesson-reassignments.json gives it no lesson`);
        }
        return { ...r, lesson_id: move.lesson_id, original_lesson_id: r.lesson_id };
      }));
    } else if (spec.split) {
      for (const [value, name] of Object.entries(spec.files)) write(name, rows.filter((r) => String(r[spec.split]) === value));
      const placed = Object.values(outputs).reduce((a, b) => a + b, 0);
      if (placed !== rows.length) throw new Error(`${entity}: ${rows.length - placed} rows have another ${spec.split}`);
    } else {
      write(spec.file, rows);
    }
    manifest.entities[entity] = {
      csv: `${entity}_export.csv`,
      csv_rows: rows.length,
      csv_sha256: crypto.createHash('sha256').update(bytes).digest('hex'),
      outputs,
    };
    console.log(`${entity}: ${rows.length} rows -> ${Object.entries(outputs).map(([f, n]) => `${f} (${n})`).join(', ')}`);
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) {
  main(process.argv[2]);
}
