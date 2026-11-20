import { describe, it, expect } from 'vitest';
import { MILESTONES, pathView, topicBlocks } from './meView';
import { UNITS } from './course';
import { visibleCourse } from './journey';

describe('the path to 128', () => {
  it('marks the milestones reached', () => {
    const v = pathView(41);
    expect(MILESTONES).toEqual([10, 25, 50, 75, 100, 128]);
    expect(v.marks.filter((m) => m.reached).map((m) => m.at)).toEqual([10, 25]);
    expect(v.next).toBe(50);
    expect(Math.round(v.pct)).toBe(32);
  });

  it('stays between 0 and the total', () => {
    expect(pathView(-3).n).toBe(0);
    expect(pathView(500).n).toBe(128);
    expect(pathView(128).next).toBeNull();
    expect(pathView(0).marks.some((m) => m.reached)).toBe(false);
  });
});

describe('topic blocks', () => {
  const course = [
    { id: 'a', title: 'A', sections: [{ id: 's', lessons: [{ id: 'l1', questionIds: ['q1', 'q2'] }, { id: 'l2', questionIds: ['q3', 'q4'] }] }] },
    { id: 'b', title: 'B', sections: [{ id: 't', lessons: [{ id: 'l3', questionIds: ['q5'] }] }] },
    { id: 'c', title: 'C (nothing yet)', sections: [{ id: 'u', lessons: [] }] },
  ];

  it('fills each topic by its questions mastered, and skips topics with none', () => {
    const blocks = topicBlocks(course, new Set(['q1', 'q5']));
    expect(blocks.map((b) => [b.id, b.done, b.total, b.pct, b.complete])).toEqual([['a', 1, 4, 25, false], ['b', 1, 1, 100, true]]);
    expect(blocks.map((b) => b.fill)).toEqual(['gold', 'sky']);
  });

  it('covers all 128 questions of the real course once', () => {
    const blocks = topicBlocks(visibleCourse(UNITS, { showDrafts: true }));
    expect(blocks.reduce((n, b) => n + b.total, 0)).toBe(128);
  });
});
