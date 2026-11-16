// Pure parts of the civics grading eval: the models compared, prices, reading
// a verdict, and the summary math. No network; tested in
// src/lib/civicsEval.test.js.

// Per million tokens (input, output), standard API rates as of Nov 2026.
// An OpenAI model's price is given on the command line (--openai-price).
export const CLAUDE_MODELS = {
  haiku: { model: 'claude-haiku-5-5', price: [0.1, 0.5] },
  sonnet: { model: 'claude-sonnet-5-5', price: [2, 10] },
  opus: { model: 'claude-opus-5-5', price: [4, 20] },
};

// The same fields the app asks for, made strict for structured outputs.
export const VERDICT_SCHEMA = {
  type: 'object',
  properties: { is_correct: { type: 'boolean' }, feedback: { type: 'string' } },
  required: ['is_correct', 'feedback'],
  additionalProperties: false,
};

export function costUsd(usage, price) {
  if (!usage || !price) return null;
  const [inP, outP] = price;
  return ((usage.input_tokens || 0) * inP + (usage.output_tokens || 0) * outP) / 1e6;
}

// Text of a model's reply → { is_correct, feedback } or null if unreadable.
export function readVerdict(text) {
  try {
    const v = JSON.parse(String(text || ''));
    return typeof v?.is_correct === 'boolean' ? { is_correct: v.is_correct, feedback: String(v.feedback || '') } : null;
  } catch (e) {
    return null;
  }
}

// 95% Wilson interval for k successes of n, as [low, high].
export function wilson(k, n, z = 1.96) {
  if (!n) return [0, 0];
  const p = k / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

const median = (xs) => {
  const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

// rows: results.jsonl rows of one model ({ expected, verdict, status, tags,
// latency_s, cost_usd }); errors: errors.jsonl rows.
export function summarize(rows, errors = []) {
  const graded = rows.filter((r) => r.status === 'ok' && typeof r.verdict === 'boolean');
  const right = graded.filter((r) => r.verdict === r.expected).length;
  const wrongAnswers = graded.filter((r) => r.expected === false);
  const rightAnswers = graded.filter((r) => r.expected === true);
  const falsePass = wrongAnswers.filter((r) => r.verdict === true).length;
  const falseFail = rightAnswers.filter((r) => r.verdict === false).length;
  const costs = rows.map((r) => r.cost_usd).filter((c) => typeof c === 'number');
  const byTag = {};
  for (const r of graded) {
    const t = r.tags?.[0] || 'other';
    byTag[t] ||= { n: 0, right: 0 };
    byTag[t].n += 1;
    if (r.verdict === r.expected) byTag[t].right += 1;
  }
  return {
    n: graded.length,
    accuracy: graded.length ? right / graded.length : null,
    accuracyCi: wilson(right, graded.length),
    falsePassRate: wrongAnswers.length ? falsePass / wrongAnswers.length : null,
    falsePass,
    wrongAnswers: wrongAnswers.length,
    falseFailRate: rightAnswers.length ? falseFail / rightAnswers.length : null,
    falseFail,
    rightAnswers: rightAnswers.length,
    unreadable: rows.filter((r) => r.status !== 'ok').length,
    errors: errors.length,
    medianLatencyS: median(rows.map((r) => r.latency_s)),
    costPer1000: costs.length ? (costs.reduce((a, b) => a + b, 0) / costs.length) * 1000 : null,
    spend: costs.reduce((a, b) => a + b, 0),
    byTag,
  };
}

const pct = (x) => (x == null ? '-' : `${Math.round(x * 100)}%`);

// Markdown table of the summaries, one row per model.
export function summaryTable(byModel) {
  const lines = [
    '| Model | Accuracy (95% range) | Passes a wrong answer | Fails a right answer | Errors | Median wait | Cost / 1,000 answers |',
    '| --- | --- | --- | --- | --- | --- | --- |',
  ];
  for (const [model, s] of Object.entries(byModel)) {
    lines.push(`| ${model} | ${pct(s.accuracy)} (${pct(s.accuracyCi[0])}–${pct(s.accuracyCi[1])}) | ${pct(s.falsePassRate)} (${s.falsePass}/${s.wrongAnswers}) | ${pct(s.falseFailRate)} (${s.falseFail}/${s.rightAnswers}) | ${s.errors + s.unreadable} | ${s.medianLatencyS == null ? '-' : `${s.medianLatencyS.toFixed(1)} s`} | ${s.costPer1000 == null ? '-' : `$${s.costPer1000.toFixed(2)}`} |`);
  }
  return lines.join('\n');
}

// cases.md: every case as a table for review (kept in sync by a test).
export function casesMarkdown(cases, questions) {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const tags = [...new Set(cases.map((c) => c.tags[0]))];
  const out = [
    '# Civics grading eval: test cases',
    '',
    `${cases.length} fake learner answers, each one the phone can't settle on its own, so the AI decides. "Should count?" is the label the models are scored against. Generated from cases.json; edit that file, then run \`npm run evals:civics:cases\`.`,
    '',
    `Right answers: ${cases.filter((c) => c.expected).length} · wrong or not an answer: ${cases.filter((c) => !c.expected).length} · reviewed: ${cases.filter((c) => c.status === 'reviewed').length} of ${cases.length}`,
  ];
  for (const t of tags) {
    out.push('', `## ${t}`, '', '| Id | Question | Learner said | Should count? | Why | Official answer |', '| --- | --- | --- | --- | --- | --- |');
    for (const c of cases.filter((x) => x.tags[0] === t)) {
      out.push(`| ${c.id} | ${cell(c.question)} | ${cell(c.answer)} | ${c.expected ? 'Yes' : 'No'} | ${cell(c.why)} | ${cell(byId.get(c.questionId)?.answer || '?')} |`);
    }
  }
  return `${out.join('\n')}\n`;
}
