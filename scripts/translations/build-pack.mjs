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
// Every rejected line of the last run, with the reason (for checking; not committed).
const REJECTED = path.join(ROOT, '.claude/translations/rejected.json');

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
// The "0" of each script's own digits our languages may use (Arabic, Persian
// and Urdu, the Indian scripts, Sinhala, Thai, Lao, Tibetan, Myanmar, Khmer,
// full-width). A digit counts by its value, so Persian ۱۳ is 13.
const DIGIT_ZEROS = [0x660, 0x6f0, 0x966, 0x9e6, 0xa66, 0xae6, 0xb66, 0xbe6, 0xc66, 0xce6, 0xd66, 0xde6, 0xe50, 0xed0, 0xf20, 0x1040, 0x17e0, 0xff10];
const asciiDigits = (s) => String(s).replace(/\p{Nd}/gu, (c) => {
  const cp = c.codePointAt(0);
  const zero = DIGIT_ZEROS.find((z) => cp >= z && cp <= z + 9);
  return zero === undefined ? c : String(cp - zero);
});

// Thousands separators between digit groups ("1,500", "1.500", "1 500")
// are dropped first, so 1,500 counts as 1500 in any language.
const joinThousands = (s) => String(s).replace(/(\d)[,.   ](?=\d{3}(?!\d))/g, '$1');
export const numbers = (s) => (asciiDigits(joinThousands(s)).match(/[0-9]+/g) || []).sort();

// Numbers the English says without digits, which a translation may write as
// digits: month names and their short forms (Chinese, Japanese and Korean
// write "November" as 11月, Vietnamese "Sept. 11" as 11/9), and number words
// and ordinals ("five wars", "First Amendment", "Twenty-sixth"). "May" at the
// start of a sentence is the verb, not the month.
const MONTHS = [
  ['January', 'Jan'], ['February', 'Feb'], ['March', 'Mar'], ['April', 'Apr'], ['May'], ['June', 'Jun'],
  ['July', 'Jul'], ['August', 'Aug'], ['September', 'Sept', 'Sep'], ['October', 'Oct'], ['November', 'Nov'], ['December', 'Dec'],
];
const monthNumbers = (s) => MONTHS.flatMap((names, i) => names.flatMap((m, k) => {
  const word = k === 0 ? `\\b${m}\\b` : `\\b${m}\\.`;
  const re = m === 'May' ? /(?<!^|[.!?:]\s*|["“]\s*)\bMay\b/g : new RegExp(word, 'g');
  return (String(s).match(re) || []).map(() => String(i + 1));
}));

const ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const ONES_TH = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth',
  'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const TENS_TH = ['', '', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth', 'seventieth', 'eightieth', 'ninetieth'];
const WORD_VALUES = new Map();
for (let n = 1; n < 100; n++) {
  const t = Math.floor(n / 10);
  const o = n % 10;
  if (n < 20) {
    WORD_VALUES.set(ONES[n], n);
    WORD_VALUES.set(ONES_TH[n], n);
  } else if (o === 0) {
    WORD_VALUES.set(TENS[t], n);
    WORD_VALUES.set(TENS_TH[t], n);
  } else {
    WORD_VALUES.set(`${TENS[t]}-${ONES[o]}`, n);
    WORD_VALUES.set(`${TENS[t]}-${ONES_TH[o]}`, n);
  }
}
// "twenty-sixth" is one number; "four-year" is "four" plus "year".
const wordNumbers = (s) => (String(s).toLowerCase().match(/[a-z]+(?:-[a-z]+)*/g) || [])
  .flatMap((w) => (WORD_VALUES.has(w) ? [w] : w.split('-').filter((part) => WORD_VALUES.has(part))))
  .map((w) => String(WORD_VALUES.get(w)));

// Other ways a translation may write one of the English numbers:
// "the 1800s" as the 19th century, "the 1950s" as the 20th century's 50s
// (Chinese 20世纪50年代), "$15 million" as 1500万 or 15000000, "2 billion"
// as 20亿. Each option is a list of numbers that replace it.
function otherWays(english, n) {
  const text = joinThousands(english);
  const v = Number(n);
  const ways = [];
  if (new RegExp(`\\b${n}s\\b`).test(text) && v % 10 === 0 && v >= 1000) {
    const century = String(Math.floor(v / 100) + 1);
    if (v % 100 === 0) ways.push([century]);
    else ways.push([century, String(v % 100)], [String(v % 100)], [century]);
  }
  if (new RegExp(`\\b${n} million\\b`, 'i').test(text)) ways.push([String(v * 100)], [String(v * 1e6)]);
  if (new RegExp(`\\b${n} billion\\b`, 'i').test(text)) ways.push([String(v * 10)], [String(v * 1e9)]);
  return ways;
}

// The translation's numbers must be the English ones (or another way of
// writing one of them, above), plus at most numbers the English says in words.
export function numbersMatch(english, translated) {
  const want = numbers(english);
  const got = numbers(translated);
  if (want.join() === got.join()) return true;
  const extra = [...got];
  const take = (list, n) => {
    const at = list.indexOf(n);
    if (at === -1) return false;
    list.splice(at, 1);
    return true;
  };
  const missing = want.filter((n) => !take(extra, n));
  for (const n of missing) {
    const way = otherWays(english, n).find((option) => option.every((m) => extra.filter((x) => x === m).length >= option.filter((y) => y === m).length));
    if (!way) return false;
    way.forEach((m) => take(extra, m));
  }
  const allowed = [...monthNumbers(english), ...wordNumbers(english)];
  return extra.every((n) => take(allowed, n));
}

// Why a translation can't be used, or null when it's fine.
export function problem(english, translated) {
  if (typeof translated !== 'string' || !translated.trim()) return 'empty';
  if (placeholders(english).join() !== placeholders(translated).join()) return 'placeholders changed';
  if (!numbersMatch(english, translated)) return 'numbers changed';
  if (featuresIn(english).some((f) => !String(translated).includes(f))) return 'feature name translated';
  return null;
}

// Texts this language still needs: not in the reviewed file, and not in the
// machine pack, or in it with a line that breaks today's checks (for example
// a feature name translated before that rule existed), which is sent again.
// Reviewed lines are never re-translated.
export function missingTexts(sources, machine = {}, reviewed = {}) {
  return sources.texts.map((t) => t.text).filter((text) => !reviewed[text] && (!machine[text] || problem(text, machine[text])));
}

// Machine lines that break today's checks (sent again by missingTexts).
export const failingLines = (machine = {}) => Object.entries(machine).filter(([en, tr]) => problem(en, tr)).length;

// The pack after a run: the new lines added, and old lines that still break
// today's checks dropped (they show in English until a run gets them right).
export function mergePack(machine = {}, added = {}) {
  const out = { ...machine, ...added };
  for (const [en, tr] of Object.entries(out)) if (problem(en, tr)) delete out[en];
  return out;
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
- Keep every number exactly as written, with the digits 0-9 (not your script's own digits, and not spelled out). Keep "10th", "1800s" and similar as numbers too.
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
      max_tokens: 32000,
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
      const redo = failingLines(readJson(packFile(l.value), {}).strings || {});
      console.log(`${l.value.padEnd(8)} ${String(total - miss).padStart(5)} of ${total} translated${miss ? `, ${miss} missing` : ''}${redo ? ` (incl. ${redo} to redo)` : ''}`);
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
    writePack(lang, mergePack(machine, strings), state.model);
    console.log(`${lang}: +${Object.keys(strings).length}`);
  }
  if (rejected.length) {
    fs.mkdirSync(path.dirname(REJECTED), { recursive: true });
    fs.writeFileSync(REJECTED, JSON.stringify(rejected, null, 2));
    console.log(`\n${rejected.length} translations were rejected and stay English (run again to retry):`);
    rejected.slice(0, 20).forEach((r) => console.log(`  ${r.lang} · ${r.why} · ${r.text.slice(0, 60)}`));
    console.log(`The full list is in ${path.relative(ROOT, REJECTED)} (not committed).`);
  }
  fs.rmSync(STATE, { force: true });
  console.log('\nDone. Check the files in content/translations/, then commit them.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => { console.error(err.message || err); process.exit(1); });
}
