import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GUEST_KEY, endGuest, isGuest, startGuest } from './guestMode';

describe('guest mode', () => {
  beforeEach(() => {
    const store = new Map();
    vi.stubGlobal('localStorage', {
      getItem: (k) => (store.has(k) ? store.get(k) : null),
      setItem: (k, v) => store.set(k, String(v)),
      removeItem: (k) => store.delete(k),
    });
  });

  it('is a device-only key that Delete my data clears', () => {
    expect(GUEST_KEY.startsWith('pathways_')).toBe(true);
  });

  it('turns on and off', () => {
    expect(isGuest()).toBe(false);
    startGuest();
    expect(isGuest()).toBe(true);
    endGuest();
    expect(isGuest()).toBe(false);
  });

  it('never throws when storage is blocked', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    });
    expect(() => startGuest()).not.toThrow();
    expect(isGuest()).toBe(false);
    expect(() => endGuest()).not.toThrow();
  });
});
