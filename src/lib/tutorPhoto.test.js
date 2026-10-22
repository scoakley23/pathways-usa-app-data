import { describe, it, expect, beforeEach } from 'vitest';
import { TUTOR_PHOTO_KEY, clearTutorPhoto } from './tutorPhoto';

let store;
beforeEach(() => {
  store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
});

describe('old tutor photo clean-up', () => {
  it('deletes a photo left on the device', () => {
    expect(TUTOR_PHOTO_KEY.startsWith('pathways_')).toBe(true);
    store[TUTOR_PHOTO_KEY] = 'data:image/jpeg;base64,AAAA';
    store.pathways_language = 'es';
    clearTutorPhoto();
    expect(store[TUTOR_PHOTO_KEY]).toBeUndefined();
    expect(store.pathways_language).toBe('es');
  });
  it('does nothing harmful when storage is blocked', () => {
    globalThis.localStorage.removeItem = () => { throw new Error('SecurityError'); };
    expect(() => clearTutorPhoto()).not.toThrow();
  });
});
