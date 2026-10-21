import { describe, it, expect, beforeEach } from 'vitest';
import { getTextSize, saveTextSize, TEXT_SIZE_KEY } from './textSize';

describe('text size', () => {
  beforeEach(() => {
    const store = {};
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
    };
  });

  it('defaults to normal and saves valid sizes', () => {
    expect(getTextSize()).toBe('normal');
    saveTextSize('large');
    expect(getTextSize()).toBe('large');
    expect(localStorage.getItem(TEXT_SIZE_KEY)).toBe('large');
  });

  it('ignores invalid sizes', () => {
    saveTextSize('huge');
    expect(getTextSize()).toBe('normal');
  });

  it('falls back to normal when storage is blocked', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(getTextSize()).toBe('normal');
    expect(() => saveTextSize('large')).not.toThrow();
  });
});
