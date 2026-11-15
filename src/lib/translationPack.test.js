// The translation pack lookups and the build script's checks. Fake packs only.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/api/provider', () => ({ PROVIDER: 'base44', WANTS_SUPABASE: false }));

const { fromPack, packText, packTree, setPackForTests, resetPacks, loadPack, getLoadedPack } = await import('./translationPack');
const { problem, chunk, missingTexts, buildRequests, readResult } = await import('../../scripts/translations/build-pack.mjs');

beforeEach(() => {
  resetPacks();
  setPackForTests('es', { Hello: 'Hola', 'Start here': 'Empiece aquí', 'Hi, {name}.': 'Hola, {name}.' });
});

describe('looking up the pack', () => {
  it('fromPack splits found and missing keys', () => {
    const { found, missing } = fromPack(getLoadedPack('es'), { a: 'Hello', b: 'Goodbye', c: '' });
    expect(found).toEqual({ a: 'Hola' });
    expect(missing).toEqual(['b']);
  });

  it('packText returns the translation or null', async () => {
    expect(await packText('es', 'Start here')).toBe('Empiece aquí');
    expect(await packText('es', 'Not in the pack')).toBeNull();
    expect(await packText('en', 'Hello')).toBeNull();
  });

  it('packTree translates nested strings, skips keys, and reports gaps', async () => {
    const lesson = { title: 'Hello', key_points: [{ text: 'Start here', image_url: 'Hello' }], n: 3 };
    const full = await packTree('es', lesson, { skip: ['image_url'] });
    expect(full).toEqual({ value: { title: 'Hola', key_points: [{ text: 'Empiece aquí', image_url: 'Hello' }], n: 3 }, complete: true });
    const part = await packTree('es', { title: 'Hello', body: 'Untranslated' });
    expect(part).toEqual({ value: { title: 'Hola', body: 'Untranslated' }, complete: false });
  });

  it('a language without a pack loads as null, and English never loads', async () => {
    expect(await loadPack('xx')).toBeNull();
    expect(await loadPack('en')).toBeNull();
  });
});

describe('build-pack checks', () => {
  it('rejects translations that drop placeholders or change numbers', () => {
    expect(problem('Hi, {name}.', 'Hola, {name}.')).toBeNull();
    expect(problem('Hi, {name}.', 'Hola.')).toBe('placeholders changed');
    expect(problem('12 of 20', '12 de 21')).toBe('numbers changed');
    expect(problem('Hello', '  ')).toBe('empty');
  });

  it('only missing texts are sent; reviewed lines are never re-translated', () => {
    const sources = { texts: [{ text: 'A' }, { text: 'B' }, { text: 'C' }] };
    expect(missingTexts(sources, { A: 'a' }, { B: 'b' })).toEqual(['C']);
  });

  it('chunks by item count and size', () => {
    expect(chunk(['aa', 'bb', 'cc'], { maxItems: 2 })).toEqual([['aa', 'bb'], ['cc']]);
    expect(chunk(['aaaa', 'bbbb'], { maxChars: 5 })).toEqual([['aaaa'], ['bbbb']]);
  });

  it('builds batch requests and reads results, keeping only valid lines', () => {
    const [req] = buildRequests({ language: { value: 'es', label: 'Español' }, texts: ['Hi, {name}.', 'Bye'] });
    expect(req.custom_id).toBe('es__0');
    expect(req.params.model).toBe('claude-opus-5-5');
    expect(JSON.parse(req.params.messages[0].content).items).toEqual([{ id: 't0', text: 'Hi, {name}.' }, { id: 't1', text: 'Bye' }]);
    const message = {
      stop_reason: 'end_turn',
      content: [{ type: 'thinking', thinking: '…' }, { type: 'text', text: JSON.stringify({ translations: [{ id: 't0', text: 'Hola.' }, { id: 't1', text: 'Adiós' }] }) }],
    };
    const { ok, rejected } = readResult(message, req.texts);
    expect(ok).toEqual({ Bye: 'Adiós' });
    expect(rejected).toEqual([{ text: 'Hi, {name}.', why: 'placeholders changed' }]);
    expect(readResult({ stop_reason: 'refusal', content: [] }, ['Bye']).rejected[0].why).toBe('refusal');
  });
});
