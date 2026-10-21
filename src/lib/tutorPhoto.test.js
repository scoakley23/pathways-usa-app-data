import { describe, it, expect, beforeEach } from 'vitest';
import { TUTOR_PHOTO_KEY, centerSquare, loadTutorPhoto, saveTutorPhoto } from './tutorPhoto';

let store;
beforeEach(() => {
  store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
});

describe('tutor photo (device only)', () => {
  it('has no photo on a new device', () => {
    expect(loadTutorPhoto()).toBeNull();
  });
  it('saves and loads an image data URL under a pathways_ key (cleared by DeleteMyData)', () => {
    expect(TUTOR_PHOTO_KEY.startsWith('pathways_')).toBe(true);
    expect(saveTutorPhoto('data:image/jpeg;base64,AAAA')).toBe(true);
    expect(loadTutorPhoto()).toBe('data:image/jpeg;base64,AAAA');
  });
  it('refuses anything that is not an image data URL', () => {
    expect(saveTutorPhoto('https://example.com/a.jpg')).toBe(false);
    store[TUTOR_PHOTO_KEY] = 'javascript:alert(1)';
    expect(loadTutorPhoto()).toBeNull();
  });
  it('returns false when the device storage is full or blocked', () => {
    globalThis.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
    expect(saveTutorPhoto('data:image/jpeg;base64,AAAA')).toBe(false);
  });
  it('crops to the centered square', () => {
    expect(centerSquare(400, 300)).toEqual([50, 0, 300]);
    expect(centerSquare(300, 500)).toEqual([0, 100, 300]);
    expect(centerSquare(200, 200)).toEqual([0, 0, 200]);
  });
});
