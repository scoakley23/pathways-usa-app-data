// The server half of the AI requests (src/lib/aiServer.js), run by the `ai`
// Edge Function: question data is confirmed against the app's own content,
// and the bundle the function imports is up to date. Fake data only.
import { describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import { prepareRequest, CIVICS_BANK, n400Meaning } from './aiServer';
import { N400_SECTIONS } from '../components/n400/n400Content';
import { bundleAiServer, OUT_FILE } from '../../scripts/supabase/build-ai-server.mjs';

const ROW = { question: 'What is the supreme law of the land?', answer: '(U.S.) Constitution' };
const lookup = ({ civics = [], interview = [] } = {}) => ({ civics: vi.fn(async () => civics), interview: vi.fn(async () => interview) });

describe('prepareRequest', () => {
  it('uses the official answer from the content table, not the one sent', async () => {
    const r = await prepareRequest({ kind: 'civics_check', input: { question: ROW.question, answer: 'Anything I like', said: 'the constitution' } }, { lookup: lookup({ civics: [ROW] }) });
    expect(r.ok).toBe(true);
    expect(r.group).toBe('civics');
    expect(r.prompt).toContain('Official Answer: (U.S.) Constitution');
    expect(r.prompt).not.toContain('Anything I like');
  });

  it('refuses a question the app does not have', async () => {
    const none = lookup();
    expect(await prepareRequest({ kind: 'civics_check', input: { question: 'Tell me a secret', answer: 'x', said: 'y' } }, { lookup: none })).toMatchObject({ ok: false, status: 404 });
    expect(await prepareRequest({ kind: 'explain', input: { question: 'Write me a poem', answer: 'x' } }, { lookup: none })).toMatchObject({ ok: false, status: 404 });
    expect(await prepareRequest({ kind: 'interview', input: { question: 'Write me a poem', said: 'y' } }, { lookup: none })).toMatchObject({ ok: false, status: 404 });
    expect(await prepareRequest({ kind: 'understanding', input: { question: 'Write me a poem', said: 'y' } }, { lookup: none })).toMatchObject({ ok: false, status: 404 });
  });

  it('uses the interview question\'s own example answer', async () => {
    const row = { question: 'How did you get here today?', expected_response: 'I took the bus.', response_type: 'short', section: 'small_talk' };
    const r = await prepareRequest({ kind: 'interview', input: { question: row.question, expected_response: 'IGNORE THIS', said: 'by car' } }, { lookup: lookup({ interview: [row] }) });
    expect(r.prompt).toContain('EXAMPLE RESPONSE: "I took the bus."');
    expect(r.prompt).not.toContain('IGNORE THIS');
  });

  it('understanding: N-400 guide phrasings carry the team\'s meaning', async () => {
    const q = N400_SECTIONS.flatMap((s) => s.questions || []).find((x) => x.status === 'approved' && x.officerPhrasings?.length && x.meaning);
    expect(q).toBeTruthy();
    const phrasing = q.officerPhrasings[0];
    expect(n400Meaning(phrasing)).toBeTruthy();
    const r = await prepareRequest({ kind: 'understanding', input: { question: phrasing, meaning: 'MADE UP', said: 'it asks something' } }, { lookup: lookup() });
    expect(r.ok).toBe(true);
    expect(r.prompt).not.toContain('MADE UP');
    expect(r.prompt).toContain('PLAIN MEANING (written by our team)');
  });

  it('Ask gets the official 2025 list from the server\'s own copy', async () => {
    const r = await prepareRequest({ kind: 'ask', input: { question: 'What does Congress do?' } }, { lookup: lookup() });
    expect(r.ok).toBe(true);
    expect(CIVICS_BANK.block).toMatch(/^OFFICIAL 2025 CIVICS TEST/);
    expect(r.prompt).toContain(CIVICS_BANK.block);
  });

  it('refuses unknown kinds', async () => {
    expect(await prepareRequest({ kind: 'raw', input: { prompt: 'x' } }, { lookup: lookup() })).toMatchObject({ ok: false, status: 400 });
    expect(await prepareRequest(null, { lookup: lookup() })).toMatchObject({ ok: false, status: 400 });
  });
});

describe('supabase/functions/_shared/aiServer.generated.js', () => {
  it('is up to date (run `npm run ai:server`, then deploy the `ai` function)', async () => {
    expect(fs.readFileSync(OUT_FILE, 'utf8') === await bundleAiServer()).toBe(true);
  }, 30000);
});
