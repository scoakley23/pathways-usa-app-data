import { describe, it, expect } from 'vitest';
import { posterTone, POSTER_SCHEME } from './posterTone';

describe('posterTone', () => {
  it('alternates red and blue card by card', () => {
    expect(POSTER_SCHEME).toBe('alternate');
    expect([0, 1, 2, 3].map((i) => posterTone(i))).toEqual(['red', 'blue', 'red', 'blue']);
  });

  it('treats missing or odd indexes safely', () => {
    expect(posterTone()).toBe('red');
    expect(posterTone(-1)).toBe('blue');
    expect(posterTone('x')).toBe('red');
  });
});
