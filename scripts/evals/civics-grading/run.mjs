// Civics grading eval: sends each test answer in cases.json to each model with
// the app's own prompt (src/lib/civicsCheckPrompt.js) and compares the verdict
// with the label. You run it on your computer with your own keys; see README.md.
//
//   npm run evals:civics -- --check                       cost estimate, no calls
//   npm run evals:civics                                  Haiku, Sonnet, Opus 5.5
//   npm run evals:civics -- --openai-model <id> --openai-price 1.25,10
//   npm run evals:civics -- --models haiku --reps 3 --effort low
//
// Results: .claude/hillclimb/civics-grading/<model>/results.jsonl (one row per
// answer, written as it finishes; a rerun skips what's done), traces/, and
// errors.jsonl; summary.md compares the models.
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { buildCivicsCheckPrompt } from '../../../src/lib/civicsCheckPrompt.js';
import { CLAUDE_MODELS, VERDICT_SCHEMA, costUsd, readVerdict, summarize, summaryTable } from './lib.mjs';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const ROOT = path.resolve(HERE, '../../..');
const QUESTIONS = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/base44-export/civics-questions-2025.json'), 'utf8'));
const CASES = JSON.parse(fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8')).cases;
const CASE_TIMEOUT_MS = 120_000;
const MAX_ATTEMPTS = 4;

function parseArgs(argv) {
  const a = { models: ['haiku', 'sonnet', 'opus'], reps: 2, concurrency: 4, effort: null, check: false, allowDrafts: false, openaiModel: null, openaiPrice: null, out: path.join(ROOT, '.claude/hillclimb/civics-grading') };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '--models') a.models = v().split(',').map((s) => s.trim()).filter(Boolean);
    else if (k === '--reps') a.reps = Number(v());
    else if (k === '--concurrency') a.concurrency = Number(v());
    else if (k === '--effort') a.effort = v();
    else if (k === '--check') a.check = true;
    else if (k === '--allow-drafts') a.allowDrafts = true;
    else if (k === '--openai-model') a.openaiModel = v();
    else if (k === '--openai-price') a.openaiPrice = v().split(',').map(Number);
    else if (k === '--out') a.out = path.resolve(v());
    else throw new Error(`Unknown option: ${k}`);
  }
  return a;
}

// The models to compare: { id (folder name), provider, model, price, effort }.
function variantsFor(args) {
  const out = args.models.map((m) => {
    const c = CLAUDE_MODELS[m];
    if (!c) throw new Error(`Unknown model "${m}". Use haiku, sonnet, opus.`);
    return { id: args.effort ? `${c.model}-${args.effort}` : c.model, provider: 'anthropic', model: c.model, price: c.price, effort: args.effort };
  });
  if (args.openaiModel) {
    if (!args.openaiPrice || args.openaiPrice.length !== 2 || args.openaiPrice.some((x) => !(x >= 0))) {
      throw new Error('Give the OpenAI model\'s price per million tokens: --openai-price <input>,<output> (from openai.com/api/pricing).');
    }
    out.push({ id: `openai-${args.openaiModel}`, provider: 'openai', model: args.openaiModel, price: args.openaiPrice });
  }
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const retryable = (err) => {
  const s = err?.status;
  return s === 408 || s === 409 || s === 429 || s === 529 || (s >= 500 && s < 600) || !s;
};

let anthropic = null;
let openai = null;

// One call → { text, model, usage: { input_tokens, output_tokens }, stop_reason }.
async function callModel(v, prompt) {
  if (v.provider === 'anthropic') {
    anthropic ||= new Anthropic({ maxRetries: 0 });
    const res = await anthropic.messages.create({
      model: v.model,
      max_tokens: 8000,
      output_config: { format: { type: 'json_schema', schema: VERDICT_SCHEMA }, ...(v.effort ? { effort: v.effort } : {}) },
      messages: [{ role: 'user', content: prompt }],
    });
    const text = res.content.find((b) => b.type === 'text')?.text || '';
    return { text, model: res.model, usage: { input_tokens: res.usage.input_tokens, output_tokens: res.usage.output_tokens }, stop_reason: res.stop_reason };
  }
  if (!openai) {
    const { default: OpenAI } = await import('openai');
    openai = new OpenAI({ maxRetries: 0 });
  }
  const res = await openai.chat.completions.create({
    model: v.model,
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: 'json_schema', json_schema: { name: 'civics_check', schema: VERDICT_SCHEMA, strict: true } },
  });
  const choice = res.choices[0];
  return {
    text: choice?.message?.content || '',
    model: res.model,
    usage: { input_tokens: res.usage?.prompt_tokens || 0, output_tokens: res.usage?.completion_tokens || 0 },
    stop_reason: choice?.message?.refusal ? 'refusal' : choice?.finish_reason === 'length' ? 'max_tokens' : choice?.finish_reason,
  };
}

// The call with jittered backoff and a hard time limit.
async function callWithRetries(v, prompt) {
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const started = Date.now();
      const res = await Promise.race([
        callModel(v, prompt),
        sleep(CASE_TIMEOUT_MS).then(() => { throw Object.assign(new Error('timeout'), { timeout: true }); }),
      ]);
      return { ...res, latency_s: (Date.now() - started) / 1000, retries: attempt - 1 };
    } catch (err) {
      lastErr = err;
      if (err.timeout || !retryable(err) || attempt === MAX_ATTEMPTS) break;
      await sleep(Math.min(30_000, 1000 * 2 ** attempt) * (0.5 + Math.random()));
    }
  }
  throw Object.assign(lastErr || new Error('failed'), { attempts: MAX_ATTEMPTS });
}

const readJsonl = (file) => (fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);

async function runVariant(v, jobs, args) {
  const dir = path.join(args.out, v.id);
  fs.mkdirSync(path.join(dir, 'traces'), { recursive: true });
  const resultsFile = path.join(dir, 'results.jsonl');
  const errorsFile = path.join(dir, 'errors.jsonl');
  const done = new Set(readJsonl(resultsFile).map((r) => `${r.prompt_id}#${r.rep}`));
  const todo = jobs.filter((j) => !done.has(`${j.c.id}#${j.rep}`));
  console.log(`${v.id}: ${todo.length} to run (${done.size} already done)`);

  let next = 0;
  const worker = async () => {
    while (next < todo.length) {
      const { c, q, rep } = todo[next++];
      const { prompt } = buildCivicsCheckPrompt(q, c.answer);
      try {
        const res = await callWithRetries(v, prompt);
        if (!String(res.model).startsWith(v.model)) throw Object.assign(new Error(`served by ${res.model}, not ${v.model}`), { mismatch: true, res });
        const verdict = readVerdict(res.text);
        const status = res.stop_reason === 'max_tokens' ? 'truncated' : res.stop_reason === 'refusal' ? 'refusal' : verdict ? 'ok' : 'unreadable';
        const row = {
          prompt_id: c.id, rep, prompt: c.answer, question: q.question, tags: c.tags, expected: c.expected,
          verdict: verdict?.is_correct ?? null, feedback: verdict?.feedback ?? null,
          grade: { correct: verdict ? Number(verdict.is_correct === c.expected) : 0 },
          status, stop_reason: res.stop_reason, model: res.model, usage: res.usage, latency_s: res.latency_s,
          retries: res.retries, cost_usd: costUsd(res.usage, v.price),
        };
        fs.appendFileSync(resultsFile, `${JSON.stringify(row)}\n`);
        fs.writeFileSync(path.join(dir, 'traces', `${c.id}_rep${rep}.json`), JSON.stringify([
          { role: 'user', content: prompt },
          { role: 'assistant', content: res.text },
        ], null, 2));
      } catch (err) {
        const kind = err.timeout ? 'timeout' : err.mismatch ? 'served-model-mismatch' : `api-error-${err.status || 'network'}`;
        fs.appendFileSync(errorsFile, `${JSON.stringify({ prompt_id: c.id, rep, kind, message: String(err.message).slice(0, 300), model: err.res?.model, usage: err.res?.usage })}\n`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, args.concurrency) }, worker));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const byId = new Map(QUESTIONS.map((q) => [q.id, q]));
  const drafts = CASES.filter((c) => c.status !== 'reviewed');
  if (drafts.length && !args.allowDrafts && !args.check) {
    throw new Error(`${drafts.length} cases are still drafts. Review cases.md, mark them "reviewed" in cases.json, or add --allow-drafts.`);
  }
  const variants = variantsFor(args);
  const jobs = CASES.flatMap((c) => {
    const q = byId.get(c.questionId);
    if (!q) throw new Error(`Case ${c.id}: unknown question ${c.questionId}`);
    return Array.from({ length: args.reps }, (_, rep) => ({ c, q, rep }));
  });

  if (args.check) {
    // About 4 characters per token; ~150 output tokens a call, plus thinking.
    const promptTokens = jobs.reduce((n, j) => n + buildCivicsCheckPrompt(j.q, j.c.answer).prompt.length / 4, 0);
    console.log(`${CASES.length} cases × ${args.reps} runs = ${jobs.length} calls per model.`);
    for (const v of variants) {
      const usage = { input_tokens: promptTokens, output_tokens: jobs.length * (v.provider === 'anthropic' ? 600 : 300) };
      console.log(`  ${v.id.padEnd(28)} about $${costUsd(usage, v.price).toFixed(2)}`);
    }
    console.log('Estimates only; the real cost is in each results.jsonl.');
    return;
  }
  if (variants.some((v) => v.provider === 'anthropic') && !process.env.ANTHROPIC_API_KEY) console.warn('ANTHROPIC_API_KEY is not set in this terminal.');
  if (variants.some((v) => v.provider === 'openai') && !process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY is not set in this terminal.');

  for (const v of variants) await runVariant(v, jobs, args);

  const byModel = {};
  for (const v of variants) {
    const dir = path.join(args.out, v.id);
    byModel[v.id] = summarize(readJsonl(path.join(dir, 'results.jsonl')), readJsonl(path.join(dir, 'errors.jsonl')));
  }
  const table = summaryTable(byModel);
  const tags = [...new Set(CASES.map((c) => c.tags[0]))];
  const tagTable = [
    `| Case type | ${Object.keys(byModel).join(' | ')} |`,
    `| --- |${Object.keys(byModel).map(() => ' --- |').join('')}`,
    ...tags.map((t) => `| ${t} | ${Object.values(byModel).map((s) => (s.byTag[t] ? `${s.byTag[t].right}/${s.byTag[t].n}` : '-')).join(' | ')} |`),
  ].join('\n');
  const md = `# Civics grading eval\n\nRun on ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC · ${CASES.length} cases × ${args.reps} runs\n\n${table}\n\n## Right verdicts by case type\n\n${tagTable}\n`;
  fs.writeFileSync(path.join(args.out, 'summary.md'), md);
  console.log(`\n${table}\n\nSaved ${path.relative(ROOT, path.join(args.out, 'summary.md'))}`);
}

main().catch((err) => { console.error(err.message || err); process.exit(1); });
