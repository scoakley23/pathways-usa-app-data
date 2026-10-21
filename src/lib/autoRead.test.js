import { describe, it, expect, beforeEach } from 'vitest';
import { AUTO_READ_KEY, canSpeakNow, getAutoRead, readingParts, saveAutoRead } from './autoRead';

describe('readingParts', () => {
  it('reads the learner language first, then English', () => {
    expect(readingParts({ mine: 'Hola', en: 'Hello', language: 'es' })).toEqual([
      { text: 'Hola', language: 'es' },
      { text: 'Hello', language: 'en' },
    ]);
  });
  it('reads only English for English learners or when there is no translation', () => {
    expect(readingParts({ mine: 'Hello', en: 'Hello', language: 'en' })).toEqual([{ text: 'Hello', language: 'en' }]);
    expect(readingParts({ mine: null, en: 'Hello', language: 'vi' })).toEqual([{ text: 'Hello', language: 'en' }]);
  });
  it('skips empty text', () => {
    expect(readingParts({ mine: '  ', en: '', language: 'es' })).toEqual([]);
  });
});

describe('canSpeakNow', () => {
  it('waits for the first tap when the browser reports activation', () => {
    expect(canSpeakNow({ userActivation: { hasBeenActive: false } })).toBe(false);
    expect(canSpeakNow({ userActivation: { hasBeenActive: true } })).toBe(true);
  });
  it('assumes speech is allowed when the browser has no activation API', () => {
    expect(canSpeakNow({})).toBe(true);
    expect(canSpeakNow(undefined)).toBe(true);
  });
});

describe('auto-read setting', () => {
  const store = {};
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    };
  });
  it('is on by default and can be turned off', () => {
    expect(getAutoRead()).toBe(true);
    saveAutoRead(false);
    expect(store[AUTO_READ_KEY]).toBe('off');
    expect(getAutoRead()).toBe(false);
    saveAutoRead(true);
    expect(getAutoRead()).toBe(true);
  });
  it('stays on when storage is blocked', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(getAutoRead()).toBe(true);
    expect(() => saveAutoRead(false)).not.toThrow();
  });
});
