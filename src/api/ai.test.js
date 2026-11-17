// src/api/ai.js: the one door for live AI. Fake data and fake backends only.
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('@/api/base44Client', () => ({ base44: { integrations: { Core: {} } } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null, supabaseConfigured: () => false }));

const { createAiApi, AiLimitError, isAiLimit } = await import('./ai');
const { AI_LIMIT_MESSAGE } = await import('@/lib/aiRequests');

const INPUT = { question: 'What is the supreme law of the land?', answer: '(U.S.) Constitution', said: 'the constitution' };

describe('switch on (Supabase)', () => {
  it('sends only { kind, input } to the `ai` function and returns the result', async () => {
    const invoke = vi.fn(async () => ({ data: { result: { is_correct: true, feedback: '' } }, error: null }));
    const api = createAiApi({ provider: 'supabase', supabase: { functions: { invoke } } });
    expect(await api.run('civics_check', INPUT, { civics: { block: 'x' } })).toEqual({ is_correct: true, feedback: '' });
    expect(invoke).toHaveBeenCalledWith('ai', { body: { kind: 'civics_check', input: INPUT } });
  });

  it('a 429 is the daily limit', async () => {
    const invoke = vi.fn(async () => ({ data: null, error: { context: { status: 429 } } }));
    const api = createAiApi({ provider: 'supabase', supabase: { functions: { invoke } } });
    const err = await api.run('ask', { question: 'Hi?' }).catch((e) => e);
    expect(err).toBeInstanceOf(AiLimitError);
    expect(isAiLimit(err)).toBe(true);
    expect(err.message).toBe(AI_LIMIT_MESSAGE);
    const other = await createAiApi({ provider: 'supabase', supabase: { functions: { invoke: async () => ({ error: { context: { status: 500 } } }) } } }).run('ask', { question: 'Hi?' }).catch((e) => e);
    expect(isAiLimit(other)).toBe(false);
  });

  it('never translates live', async () => {
    const api = createAiApi({ provider: 'supabase', supabase: {} });
    await expect(api.translate({ prompt: 'x' })).rejects.toThrow(/translation pack/);
  });
});

describe('switch off (Base44)', () => {
  it('builds the same instructions here and calls InvokeLLM with a strict schema', async () => {
    const InvokeLLM = vi.fn(async () => ({ is_correct: false, feedback: '' }));
    const api = createAiApi({ provider: 'base44', base44: { integrations: { Core: { InvokeLLM } } } });
    await api.run('civics_check', INPUT);
    const [{ prompt, response_json_schema: schema }] = InvokeLLM.mock.calls[0];
    expect(prompt).toContain('Official Answer: (U.S.) Constitution');
    expect(schema.additionalProperties).toBe(false);
  });

  it('loads the civics list only when asked to', async () => {
    const InvokeLLM = vi.fn(async () => ({}));
    const civics = vi.fn(async () => ({ block: 'OFFICIAL 2025 CIVICS TEST (fake)', numbered: false }));
    await createAiApi({ provider: 'base44', base44: { integrations: { Core: { InvokeLLM } } } }).run('ask', { question: 'Hi?' }, { civics });
    expect(civics).toHaveBeenCalledTimes(1);
    expect(InvokeLLM.mock.calls[0][0].prompt).toContain('OFFICIAL 2025 CIVICS TEST (fake)');
  });

  it('does not send a request that fails its checks', async () => {
    const InvokeLLM = vi.fn();
    const api = createAiApi({ provider: 'base44', base44: { integrations: { Core: { InvokeLLM } } } });
    await expect(api.run('civics_check', { question: 'Q?' })).rejects.toThrow(/not sent/);
    expect(InvokeLLM).not.toHaveBeenCalled();
  });
});

describe('the app', () => {
  it('calls InvokeLLM only from src/api', () => {
    const src = path.resolve(__dirname, '..');
    const offenders = [];
    const walk = (dir) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.(jsx?|tsx?)$/.test(e.name) && !/\.test\.js$/.test(e.name) && !p.startsWith(path.join(src, 'api') + path.sep)) {
          if (/InvokeLLM/.test(fs.readFileSync(p, 'utf8'))) offenders.push(path.relative(src, p));
        }
      }
    };
    walk(src);
    expect(offenders).toEqual([]);
  });
});
