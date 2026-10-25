import { describe, expect, it } from 'vitest';
import { BADGES, isFullMarks, mergeBadges, newBadges } from './badges';

const right = (type = 'sentence') => ({ content_type: type, last_result: 'correct', status: 'practicing' });
const wrong = (type = 'sentence') => ({ content_type: type, last_result: 'incorrect', status: 'practicing' });
const mastered = (type = 'civics_question') => ({ content_type: type, last_result: 'incorrect', status: 'mastered' });
const many = (n, make) => Array.from({ length: n }, () => make());

describe('newBadges', () => {
  it('earns nothing with no progress', () => {
    expect(newBadges({})).toEqual([]);
    expect(newBadges({ progressRows: [wrong(), wrong()] })).toEqual([]);
  });

  it('earns First Step on the first right item', () => {
    expect(newBadges({ progressRows: [right()] })).toEqual(['first_step']);
  });

  it('counts mastered items as right even if the last try missed', () => {
    expect(newBadges({ progressRows: [mastered()] })).toEqual(['first_step']);
  });

  it('earns 10 Right and 50 Right from different items', () => {
    expect(newBadges({ progressRows: many(9, right) })).toEqual(['first_step']);
    expect(newBadges({ progressRows: many(10, right) })).toEqual(['first_step', 'ten_right']);
    expect(newBadges({ progressRows: many(50, right) })).toEqual(['first_step', 'ten_right', 'fifty_right']);
  });

  it('earns Civics Scholar only from 50 mastered civics questions', () => {
    const sentences = many(60, () => mastered('sentence'));
    expect(newBadges({ owned: ['first_step', 'ten_right', 'fifty_right'], progressRows: sentences })).toEqual([]);
    const civics = [...many(49, mastered), right('civics_question')];
    expect(newBadges({ owned: ['first_step', 'ten_right', 'fifty_right'], progressRows: civics })).toEqual([]);
    expect(newBadges({ owned: ['first_step', 'ten_right', 'fifty_right'], progressRows: many(50, mastered) })).toEqual(['scholar']);
  });

  it('earns 1,000 Points at 1000', () => {
    expect(newBadges({ points: 990 })).toEqual([]);
    expect(newBadges({ points: 1000 })).toEqual(['points_1000']);
  });

  it('earns Full Marks only from a checked run that was all right', () => {
    expect(newBadges({ run: ['right', 'right', 'right', 'right', 'right'] })).toEqual(['full_marks']);
    expect(newBadges({ run: ['right', 'right', 'right', 'right', 'close'] })).toEqual([]);
    expect(newBadges({ run: null })).toEqual([]);
  });

  it('never returns a badge already owned', () => {
    expect(newBadges({ owned: ['first_step'], progressRows: [right()] })).toEqual([]);
    const all = BADGES.map((b) => b.id);
    expect(newBadges({ owned: all, progressRows: many(60, mastered), points: 5000, run: Array(6).fill('right') })).toEqual([]);
  });
});

describe('isFullMarks', () => {
  it('needs at least five cards', () => {
    expect(isFullMarks(['right', 'right', 'right', 'right'])).toBe(false);
    expect(isFullMarks(Array(5).fill('right'))).toBe(true);
    expect(isFullMarks([])).toBe(false);
  });
});

describe('mergeBadges', () => {
  it('adds new IDs once and drops retired ones', () => {
    expect(mergeBadges(['first_step', 'on_fire'], ['first_step', 'ten_right'])).toEqual(['first_step', 'ten_right']);
  });
});

describe('isFullMarks with skipped cards', () => {
  it('fails when a card has no outcome', () => {
    const run = Array(6).fill('right');
    run[2] = undefined;
    expect(isFullMarks(run)).toBe(false);
  });
});
