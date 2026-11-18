// The translation pack lookups and the build script's checks. Fake packs only.
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/api/provider', () => ({ PROVIDER: 'base44', WANTS_SUPABASE: false }));

const { fromPack, packText, packTree, setPackForTests, resetPacks, loadPack, getLoadedPack } = await import('./translationPack');
const { problem, chunk, missingTexts, buildRequests, readResult } = await import('../../scripts/translations/build-pack.mjs');
const SOURCES = (await import('../../content/translations/_sources.json')).default;

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

  it("counts a script's own digits by their value", () => {
    expect(problem('There were 13 original states.', '۱۳ ایالت اولیه وجود داشت.')).toBeNull(); // Persian
    expect(problem('Each state has 2 senators.', 'แต่ละรัฐมีวุฒิสมาชิก ๒ คน')).toBeNull(); // Thai
    expect(problem('The Constitution has 27 amendments.', 'ਸੰਵਿਧਾਨ ਵਿੱਚ ੨੭ ਸੋਧਾਂ ਹਨ।')).toBeNull(); // Gurmukhi
    expect(problem('There were 13 original states.', '۱۴ ایالت')).toBe('numbers changed');
  });

  it('allows a month written as a number, and nothing else extra', () => {
    expect(problem('We vote for president in November.', '我们在11月投票选举总统。')).toBeNull();
    expect(problem('We vote for president in November.', '我们在12月投票选举总统。')).toBe('numbers changed');
    expect(problem('We vote for president in November.', '我们在11月3日投票。')).toBe('numbers changed');
    expect(problem('The Constitution was signed on September 17, 1787.', '憲法は1787年9月17日に署名されました。')).toBeNull();
    expect(problem('May I see your passport?', '5 여권을 보여 주시겠어요?')).toBe('numbers changed'); // "May" the verb
    expect(problem('Memorial Day is in May.', '阵亡将士纪念日在5月。')).toBeNull();
  });

  it('gives each request room for long scripts', () => {
    const [req] = buildRequests({ language: { value: 'pa', label: 'ਪੰਜਾਬੀ' }, texts: ['Hi'] });
    expect(req.params.max_tokens).toBe(32000);
    expect(req.params.system).toContain('digits 0-9');
  });

  it('accepts numbers written another way: centuries, decades, digits for words, short months, 万', () => {
    const ok = [
      ['The 1800s', '19世纪'],
      ['Name one war fought by the United States in the 1800s.', '举出美国在19世纪参与的一场战争。'],
      ['Social movement in the 1950s–1960s', '20世纪50至60年代的社会运动'],
      ['World wars · civil rights · Sept. 11', 'Các cuộc thế chiến · dân quyền · 11/9'],
      ['First Amendment', 'ບົດແກ້ໄຂທີ ໑'],
      ['Four-year terms', 'ວາລະ 4 ປີ'],
      ['Twenty-sixth Amendment', '第26修正案'],
      ['The United States fought five wars in the 1900s.', '美国在20世纪打了5场战争。'],
      ['Jefferson paid France $15 million.', '杰斐逊向法国支付了1500万美元。'],
      ['It cost 1,500 dollars.', 'Costó 1.500 dólares.'],
    ];
    for (const [en, tr] of ok) expect(problem(en, tr), en).toBeNull();
  });

  it('still rejects numbers that really changed', () => {
    const bad = [
      ['12 of 20', '12 de 21'],
      ['12 of 20', '12 de 20 y 7'],
      ['The 1800s', '18世纪'],
      ['Four-year terms', 'ວາລະ 6 ປີ'],
      ['Jefferson paid France $15 million.', '杰斐逊向法国支付了1600万美元。'],
      ['Sept. 11', '11/10'],
    ];
    for (const [en, tr] of bad) expect(problem(en, tr), en).toBe('numbers changed');
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

describe('feature names stay in English', () => {
  it('a translation that translates a feature name is rejected', () => {
    expect(problem('Speak it! is next.', 'Sigue ¡Dígalo!')).toBe('feature name translated');
    expect(problem('Speak it! is next.', 'Sigue Speak it!')).toBeNull();
    expect(problem('Read it', 'Léalo')).toBe('feature name translated');
    expect(problem('Read it out loud', 'Léalo en voz alta')).toBeNull(); // an instruction, not the feature
  });
});

describe('content/translations/reviewed/*.json', () => {
  const files = import.meta.glob('../../content/translations/reviewed/*.json', { eager: true, import: 'default' });
  const sources = new Set(SOURCES.texts.map((t) => t.text));

  it('every reviewed line is for a real English text and passes the same checks as machine lines', () => {
    const bad = [];
    for (const [file, pack] of Object.entries(files)) {
      for (const [en, tr] of Object.entries(pack.strings || {})) {
        if (!sources.has(en)) bad.push(`${file}: not in _sources.json: ${en.slice(0, 50)}`);
        const why = problem(en, tr);
        if (why) bad.push(`${file}: ${why}: ${en.slice(0, 50)}`);
      }
    }
    expect(bad).toEqual([]);
  });
});
