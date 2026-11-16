#!/usr/bin/env node
// Builds the translation pack (content/translations/{lang}.json) from
// content/translations/_sources.json, with Claude through Anthropic's batch
// mode (half price). You run this on your computer with your own key; the
// app never sees the key. See scripts/translations/README.md.
//
//   node scripts/translations/build-pack.mjs --check                 what's missing (free)
//   node scripts/translations/build-pack.mjs --translate             all languages
//   node scripts/translations/build-pack.mjs --translate --languages es,ar,zh
//   node scripts/translations/build-pack.mjs --resume                finish the last batch
//
// Options: --model claude-opus-5-5 (default) · --effort low|medium|high
// (default medium) · --prune (drop pack lines whose English is gone).
//
// Every translation must keep the English text's placeholders ({name}, {n}…)
// and its numbers; anything else is rejected and stays English (re-run to
// retry). Lines in content/translations/reviewed/{lang}.json (human-checked)
// are never re-translated.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const DIR = path.join(ROOT, 'content/translations');
const SOURCES = path.join(DIR, '_sources.json');
const STATE = path.join(HERE, '.last-batch.json');

export const DEFAULT_MODEL = 'claude-opus-5-5';
// Per million tokens, batch mode (half the normal price), for the estimate only.
const PRICES = { 'claude-opus-5-5': [2, 10], 'claude-sonnet-5-5': [1, 5], 'claude-haiku-5-5': [0.05, 0.25] };
const MAX_CHARS = 6000; // English per request
const MAX_ITEMS = 40;

// ---------------------------------------------------------------- pure parts

// App feature names that stay in English in every language.
export const FEATURE_NAMES = ['Speak it!', 'Read it', 'Write it', 'Teach it back', 'Read and write'];
// Whole-phrase match, so "Read it out loud" (an instruction) isn't a feature name.
const featuresIn = (s) => FEATURE_NAMES.filter((f) => new RegExp(`(^|[^\\w])${f.replace(/[!]/g, '\\!')}(?![\\w ]*\\w*out loud)($|[^\\w])`).test(String(s)));

export const placeholders = (s) => (String(s).match(/\{[A-Za-z_][\w]*\}/g) || []).sort();
export const numbers = (s) => (String(s).match(/\d+/g) || []).sort();

// Why a translation can't be used, or null when it's fine.
export function problem(english, translated) {
  if (typeof translated !== 'string' || !translated.trim()) return 'empty';
  if (placeholders(english).join() !== placeholders(translated).join()) return 'placeholders changed';
  if (numbers(english).join() !== numbers(translated).join()) return 'numbers changed';
  if (featuresIn(english).some((f) => !String(translated).includes(f))) return 'feature name translated';
  return null;
}

// Texts this language still needs: not in the machine pack or the reviewed file.
export function missingTexts(sources, machine = {}, reviewed = {}) {
  return sources.texts.map((t) => t.text).filter((text) => !machine[text] && !reviewed[text]);
}

// Splits texts into requests of at most MAX_ITEMS and about MAX_CHARS.
export function chunk(texts, { maxChars = MAX_CHARS, maxItems = MAX_ITEMS } = {}) {
  const out = [];
  let cur = [];
  let size = 0;
  for (const t of texts) {
    if (cur.length && (cur.length >= maxItems || size + t.length > maxChars)) { out.push(cur); cur = []; size = 0; }
    cur.push(t);
    size += t.length;
  }
  if (cur.length) out.push(cur);
  return out;
}

export function systemPrompt(languageLabel) {
  return `You translate the fixed text of Pathways USA, a free app that helps adults prepare for the U.S. citizenship test (civics, reading, writing, the interview and the N-400 form), into ${languageLabel}.

Rules:
- Translate each item faithfully. Do not add, remove, explain or give advice. Keep the meaning and the length close to the English.
- Keep placeholders in curly braces exactly as written, for example {name}, {n}, {language}.
- Keep every number exactly as written.
- Keep these names in English: Pathways, Pathways USA, Amio, USCIS, N-400. For "A-number" you may add the local term in parentheses.
- Keep the app's feature names in English, exactly as written: Speak it!, Read it, Write it, Teach it back, Read and write. Translate the words around them.
- Translate a repeated form term the same way every time. On the N-400 form, "Item Number" is always the word for "question" in your language followed by the number.
- Keep markdown, line breaks and bullet characters as they are.
- Use plain, respectful language for adults. Use the formal "you" where the language has one.
- Official civics questions and answers: translate them faithfully, keeping names, dates and numbers exactly.

Return JSON: {"translations": [{"id": "...", "text": "..."}]} with one entry for every id you were given.`;
}

export const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    translations: {
      type: 'array',
      items: {
        type: 'object',
        properties: { id: { type: 'string' }, text: { type: 'string' } },
        required: ['id', 'text'],
        additionalProperties: false,
      },
    },
  },
  required: ['translations'],
  additionalProperties: false,
};

export function buildRequests({ language, texts, model = DEFAULT_MODEL, effort = 'medium' }) {
  return chunk(texts).map((part, n) => ({
    custom_id: `${language.value}__${n}`,
    texts: part,
    params: {
      model,
      max_tokens: 16000,
      output_config: { effort, format: { type: 'json_schema', schema: OUTPUT_SCHEMA } },
      system: systemPrompt(language.label),
      messages: [{ role: 'user', content: JSON.stringify({ items: part.map((text, i) => ({ id: `t${i}`, text })) }) }],
    },
  }));
}

// A batch result message → { english: translated } for the texts that passed,
// plus the rejected ones with the reason.
export function readResult(message, texts) {
  const ok = {};
  const rejected = [];
  if (!message || message.stop_reason === 'refusal' || message.stop_reason === 'max_tokens') {
    return { ok, rejected: texts.map((text) => ({ text, why: message ? message.stop_reason : 'no result' })) };
  }
  const block = (message.content || []).find((b) => b.type === 'text');
  let parsed = null;
  try { parsed = JSON.parse(block?.text || ''); } catch (e) { parsed = null; }
  const byId = new Map((parsed?.translations || []).map((t) => [t.id, t.text]));
  texts.forEach((text, i) => {
    const translated = byId.get(`t${i}`);
    const why = problem(text, translated);
    if (why) rejected.push({ text, why });
    else ok[text] = translated.trim();
  });
  return { ok, rejected };
}

export function estimate(textsByLang, model = DEFAULT_MODEL) {
  const [inPrice, outPrice] = PRICES[model] || PRICES[DEFAULT_MODEL];
  let chars = 0;
  for (const texts of Object.values(textsByLang)) chars += texts.reduce((a, t) => a + t.length, 0);
  const inTokens = chars / 4 + Object.values(textsByLang).reduce((a, t) => a + chunk(t).length, 0) * 400;
  const outTokens = (chars / 4) * 2.5; // translation (often longer) plus thinking
  return { chars, dollars: (inTokens * inPrice + outTokens * outPrice) / 1e6 };
}

// ------------------------------------------------------------------- files

const readJson = (file, fallback) => { try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return fallback; } };
const packFile = (lang) => path.join(DIR, `${lang}.json`);
const reviewedFile = (lang) => path.join(DIR, 'reviewed', `${lang}.json`);

function writePack(lang, strings, model) {
  const sorted = Object.fromEntries(Object.entries(strings).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
  const pack = {
    language: lang,
    source: 'machine',
    model,
    generated: new Date().toISOString().slice(0, 10),
    note: 'Machine translation made by scripts/translations/build-pack.mjs. Human-checked lines go in reviewed/.',
    strings: sorted,
  };
  fs.writeFileSync(packFile(lang), `${JSON.stringify(pack, null, 1)}\n`);
}

// -------------------------------------------------------------------- main

function parseArgs(argv) {
  const args = { check: false, translate: false, resume: false, prune: false, languages: null, model: DEFAULT_MODEL, effort: 'medium' };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') args.check = true;
    else if (a === '--translate') args.translate = true;
    else if (a === '--resume') args.resume = true;
    else if (a === '--prune') args.prune = true;
    else if (a === '--languages') args.languages = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--model') args.model = argv[++i];
    else if (a === '--effort') args.effort = argv[++i];
    else throw new Error(`Unknown option: ${a}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = readJson(SOURCES, null);
  if (!sources) throw new Error('content/translations/_sources.json is missing. Run: npm run translations:sources');
  const languages = sources.languages.filter((l) => !args.languages || args.languages.includes(l.value));
  if (args.languages) {
    const unknown = args.languages.filter((v) => !sources.languages.some((l) => l.value === v));
    if (unknown.length) throw new Error(`Not app languages: ${unknown.join(', ')}`);
  }

  const missingByLang = {};
  for (const l of languages) {
    const machine = readJson(packFile(l.value), {}).strings || {};
    const reviewed = readJson(reviewedFile(l.value), {}).strings || {};
    missingByLang[l.value] = missingTexts(sources, machine, reviewed);
    if (args.prune && Object.keys(machine).length) {
      const keep = new Set(sources.texts.map((t) => t.text));
      const pruned = Object.fromEntries(Object.entries(machine).filter(([en]) => keep.has(en)));
      if (Object.keys(pruned).length !== Object.keys(machine).length) writePack(l.value, pruned, readJson(packFile(l.value), {}).model || args.model);
    }
  }

  if (args.check || (!args.translate && !args.resume)) {
    const total = sources.texts.length;
    for (const l of languages) {
      const miss = missingByLang[l.value].length;
      console.log(`${l.value.padEnd(8)} ${String(total - miss).padStart(5)} of ${total} translated${miss ? `, ${miss} missing` : ''}`);
    }
    const { dollars } = estimate(missingByLang, args.model);
    console.log(`\nTo translate what's missing with ${args.model} (batch mode): about $${dollars.toFixed(2)}.`);
    if (!args.check) console.log('Add --translate to do it.');
    return;
  }

  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic(); // ANTHROPIC_API_KEY from your environment

  let state;
  if (args.resume) {
    state = readJson(STATE, null);
    if (!state) throw new Error('Nothing to resume.');
    console.log(`Resuming batch ${state.batchId}…`);
  } else {
    const requests = languages.flatMap((l) => buildRequests({ language: l, texts: missingByLang[l.value], model: args.model, effort: args.effort }));
    if (!requests.length) { console.log('Nothing to translate: every language is complete.'); return; }
    const { dollars } = estimate(missingByLang, args.model);
    console.log(`Sending ${requests.length} requests for ${languages.length} languages (about $${dollars.toFixed(2)})…`);
    const batch = await client.messages.batches.create({ requests: requests.map(({ custom_id, params }) => ({ custom_id, params })) });
    state = { batchId: batch.id, model: args.model, texts: Object.fromEntries(requests.map((r) => [r.custom_id, r.texts])) };
    fs.writeFileSync(STATE, JSON.stringify(state));
    console.log(`Batch ${batch.id} started. If this window closes, run again with --resume.`);
  }

  for (;;) {
    const batch = await client.messages.batches.retrieve(state.batchId);
    if (batch.processing_status === 'ended') break;
    const c = batch.request_counts;
    console.log(`  waiting: ${c.processing} in progress, ${c.succeeded} done, ${c.errored} errors…`);
    await new Promise((resolve) => setTimeout(resolve, 60_000));
  }

  const results = {};
  const rejected = [];
  for await (const r of await client.messages.batches.results(state.batchId)) {
    const lang = r.custom_id.split('__')[0];
    const texts = state.texts[r.custom_id] || [];
    const message = r.result.type === 'succeeded' ? r.result.message : null;
    const { ok, rejected: bad } = readResult(message, texts);
    results[lang] = { ...(results[lang] || {}), ...ok };
    bad.forEach((b) => rejected.push({ lang, ...b }));
  }
  for (const [lang, strings] of Object.entries(results)) {
    const machine = readJson(packFile(lang), {}).strings || {};
    writePack(lang, { ...machine, ...strings }, state.model);
    console.log(`${lang}: +${Object.keys(strings).length}`);
  }
  if (rejected.length) {
    console.log(`\n${rejected.length} translations were rejected and stay English (run again to retry):`);
    rejected.slice(0, 20).forEach((r) => console.log(`  ${r.lang} · ${r.why} · ${r.text.slice(0, 60)}`));
  }
  fs.rmSync(STATE, { force: true });
  console.log('\nDone. Check the files in content/translations/, then commit them.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err.message || err); process.exit(1); });
}
