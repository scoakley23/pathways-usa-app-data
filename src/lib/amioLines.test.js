import { describe, it, expect } from 'vitest';
import { KIND_LINES, RIGHT_LINES, nextLine, rotatingLine } from './amioLines';
import { LESSON_LINES } from '@/components/lesson/lessonStrings';

describe("Amio's rotating lines", () => {
  it('has 4 or 5 short lines in each set, all in the lesson wording', () => {
    for (const set of [RIGHT_LINES, KIND_LINES]) {
      expect(set.length).toBeGreaterThanOrEqual(4);
      expect(set.length).toBeLessThanOrEqual(5);
      for (const key of set) {
        expect(LESSON_LINES[key], key).toBeTruthy();
        expect(LESSON_LINES[key].length, key).toBeLessThanOrEqual(60);
      }
    }
  });

  it('goes round the set', () => {
    expect([0, 1, 4, 5, 6, -1].map((n) => rotatingLine(['a', 'b', 'c', 'd', 'e'], n))).toEqual(['a', 'b', 'e', 'a', 'b', 'e']);
    expect(rotatingLine([], 3)).toBeNull();
  });

  it('gives the next line each time', () => {
    const set = ['x', 'y', 'z', 'w'];
    expect([nextLine(set), nextLine(set), nextLine(set), nextLine(set), nextLine(set)]).toEqual(['x', 'y', 'z', 'w', 'x']);
  });

  it('never says "wrong" or shames', () => {
    for (const key of KIND_LINES) expect(LESSON_LINES[key]).not.toMatch(/wrong|bad|fail|mistake/i);
  });
});
