import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { integrations: { Core: { InvokeLLM: vi.fn() } } } }));

import {
  CHUNK_SIZE,
  chunkKeys,
  getCachedTranslation,
  resetTranslationCache,
  translateStrings,
} from './translateStrings';

// Fake AI: "translates" by adding a prefix to each value in the chunk it got.
function fakeInvoke() {
  return vi.fn(async ({ response_json_schema }) => {
    const keys = response_json_schema.required;
    return Object.fromEntries(keys.map((k) => [k, `T:${k}`]));
  });
}

function makeStrings(n) {
  return Object.fromEntries(Array.from({ length: n }, (_, i) => [`k${i}`, `English ${i}`]));
}

describe('translateStrings', () => {
  let store;
  beforeEach(() => {
    resetTranslationCache();
    store = {};
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => {
        store[k] = String(v);
      },
    };
  });

  it('shares one request when two screens ask at the same time', async () => {
    const invoke = fakeInvoke();
    const strings = makeStrings(3);
    const opts = { storageKey: 'pathways_test_es', strings, buildPrompt: () => 'p', invoke };
    const [a, b] = await Promise.all([translateStrings(opts), translateStrings(opts)]);
    expect(invoke).toHaveBeenCalledTimes(1);
    expect(a).toEqual(b);
    expect(a.k0).toBe('T:k0');
  });

  it('splits big sets into chunks sent together and reports each as it arrives', async () => {
    const invoke = fakeInvoke();
    const strings = makeStrings(CHUNK_SIZE * 2 + 3);
    const partials = [];
    const done = await translateStrings({
      storageKey: 'pathways_test_vi',
      strings,
      buildPrompt: (part) => JSON.stringify(part),
      onPartial: (sofar) => partials.push(Object.keys(sofar).length),
      invoke,
    });
    expect(invoke).toHaveBeenCalledTimes(3);
    expect(Object.keys(done)).toHaveLength(CHUNK_SIZE * 2 + 3);
    expect(partials.length).toBe(3);
    expect(partials[partials.length - 1]).toBe(CHUNK_SIZE * 2 + 3);
  });

  it('saves a complete translation and reuses it without asking again', async () => {
    const invoke = fakeInvoke();
    const strings = makeStrings(2);
    await translateStrings({ storageKey: 'pathways_test_fr', strings, buildPrompt: () => 'p', invoke });
    expect(JSON.parse(store.pathways_test_fr)).toEqual({ k0: 'T:k0', k1: 'T:k1' });

    resetTranslationCache(); // a new visit: only browser storage is left
    expect(getCachedTranslation('pathways_test_fr')).toEqual({ k0: 'T:k0', k1: 'T:k1' });
    await translateStrings({ storageKey: 'pathways_test_fr', strings, buildPrompt: () => 'p', invoke });
    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('keeps the chunks that worked but does not save an incomplete translation', async () => {
    let call = 0;
    const invoke = vi.fn(async ({ response_json_schema }) => {
      call += 1;
      if (call === 2) throw new Error('network');
      return Object.fromEntries(response_json_schema.required.map((k) => [k, `T:${k}`]));
    });
    const done = await translateStrings({
      storageKey: 'pathways_test_ar',
      strings: makeStrings(CHUNK_SIZE + 1),
      buildPrompt: () => 'p',
      invoke,
    });
    expect(Object.keys(done)).toHaveLength(CHUNK_SIZE);
    expect(store.pathways_test_ar).toBeUndefined();
    expect(getCachedTranslation('pathways_test_ar')).toBeNull();
  });

  it('rejects when nothing came back, and works without browser storage', async () => {
    delete globalThis.localStorage;
    const invoke = vi.fn(async () => {
      throw new Error('down');
    });
    await expect(
      translateStrings({ storageKey: 'pathways_test_zh', strings: makeStrings(2), buildPrompt: () => 'p', invoke }),
    ).rejects.toThrow();
  });

  it('chunkKeys splits keys in order', () => {
    expect(chunkKeys(['a', 'b', 'c'], 2)).toEqual([['a', 'b'], ['c']]);
  });
});
