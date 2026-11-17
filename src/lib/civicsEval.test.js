// The civics grading eval (scripts/evals/civics-grading/): its cases, its
// scoring math, and that it sends exactly the app's prompt. No API calls.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import FILE from '../../scripts/evals/civics-grading/cases.json';
import QUESTIONS from '../../content/base44-export/civics-questions-2025.json';
import { matchCivicsAnswer } from './answerVariants';
import { gradeCivicsOfficeholder } from './officeholderQuestions';
import { buildCivicsCheckPrompt } from './civicsCheckPrompt';
import { buildRequest } from './aiRequests';
import { summarize, wilson, readVerdict, costUsd, casesMarkdown, CLAUDE_MODELS, VERDICT_SCHEMA } from '../../scripts/evals/civics-grading/lib.mjs';

const ROOT = path.resolve(__dirname, '../..');
const byId = new Map(QUESTIONS.map((q) => [q.id, q]));

describe('cases.json', () => {
  it('every case has a real 2025 question, a label, a reason and a type; ids are unique', () => {
    expect(new Set(FILE.cases.map((c) => c.id)).size).toBe(FILE.cases.length);
    for (const c of FILE.cases) {
      const q = byId.get(c.questionId);
      expect(q, c.id).toBeTruthy();
      expect(c.question).toBe(q.question);
      expect(typeof c.expected, c.id).toBe('boolean');
      expect(c.why && c.answer && c.tags?.length, c.id).toBeTruthy();
      expect(['draft', 'reviewed']).toContain(c.status);
    }
  });

  it('every case reaches the AI: the phone would not settle it, and none are officeholder questions', () => {
    const settled = FILE.cases.filter((c) => {
      const q = byId.get(c.questionId);
      return matchCivicsAnswer(c.answer, q).sure || gradeCivicsOfficeholder(q, c.answer, null);
    }).map((c) => c.id);
    expect(settled).toEqual([]);
  });

  it('a balanced set: at least 25 right and 25 wrong answers', () => {
    expect(FILE.cases.filter((c) => c.expected).length).toBeGreaterThanOrEqual(25);
    expect(FILE.cases.filter((c) => !c.expected).length).toBeGreaterThanOrEqual(25);
  });

  it('cases.md is up to date (npm run evals:civics:cases)', () => {
    const md = fs.readFileSync(path.join(ROOT, 'scripts/evals/civics-grading/cases.md'), 'utf8');
    expect(md).toBe(casesMarkdown(FILE.cases, QUESTIONS));
  });
});

describe('the eval sends the app\'s own prompt', () => {
  it('the app\'s civics check (src/lib/aiRequests.js) sends the same words and schema as the eval', () => {
    const c = FILE.cases[0];
    const q = byId.get(c.questionId);
    const app = buildRequest('civics_check', { question: q.question, answer: q.answer, said: c.answer });
    expect(app.prompt).toBe(buildCivicsCheckPrompt(q, c.answer).prompt);
    expect(app.schema).toEqual(VERDICT_SCHEMA);
    const run = fs.readFileSync(path.join(ROOT, 'scripts/evals/civics-grading/run.mjs'), 'utf8');
    expect(run).toMatch(/buildCivicsCheckPrompt\(q, c\.answer\)/);
  });

  it('personal details are removed before anything is sent', () => {
    const q = byId.get(FILE.cases.find((c) => c.tags[0] === 'personal-info').questionId);
    const { prompt } = buildCivicsCheckPrompt(q, 'citizens call me at 617 555 0199 or maria.fake@example.com A123456789');
    expect(prompt).not.toMatch(/617 555|maria\.fake|A123456789/);
  });
});

describe('scoring', () => {
  const row = (expected, verdict, extra = {}) => ({ status: 'ok', expected, verdict, tags: ['t'], cost_usd: 0.001, latency_s: 1, ...extra });

  it('counts passing a wrong answer and failing a right one separately', () => {
    const s = summarize([row(true, true), row(true, false), row(false, false), row(false, true), row(false, false), row(true, null, { status: 'refusal' })], [{ kind: 'timeout' }]);
    expect(s).toMatchObject({ n: 5, falsePass: 1, wrongAnswers: 3, falseFail: 1, rightAnswers: 2, unreadable: 1, errors: 1 });
    expect(s.accuracy).toBeCloseTo(3 / 5);
    expect(s.costPer1000).toBeCloseTo(1);
  });

  it('wilson interval and helpers', () => {
    const [lo, hi] = wilson(50, 100);
    expect(lo).toBeCloseTo(0.404, 2);
    expect(hi).toBeCloseTo(0.596, 2);
    expect(readVerdict('{"is_correct":true,"feedback":"ok"}')).toEqual({ is_correct: true, feedback: 'ok' });
    expect(readVerdict('not json')).toBeNull();
    expect(costUsd({ input_tokens: 1e6, output_tokens: 1e6 }, CLAUDE_MODELS.opus.price)).toBe(24);
  });
});
