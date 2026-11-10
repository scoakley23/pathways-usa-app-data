import { describe, it, expect } from 'vitest';
import { suggestPart, partStatus, topicStates } from './studyView';

describe('suggestPart', () => {
  it('suggests Reading without a quick check', () => {
    expect(suggestPart(null)).toBe('reading');
    expect(suggestPart({ checked_at: '2026-01-01' })).toBe('reading');
  });

  it('suggests the lowest level, first in Practice order on a tie', () => {
    expect(suggestPart({ reading: 'strong', writing: 'getting_there', civics: 'start_here', speaking: 'strong' })).toBe('civics');
    expect(suggestPart({ reading: 'getting_there', writing: 'getting_there', civics: 'strong', speaking: 'strong' })).toBe('reading');
  });

  it('counts a part not checked yet as the lowest', () => {
    expect(suggestPart({ reading: 'start_here', writing: 'strong', civics: 'strong' })).toBe('speaking');
  });
});

describe('partStatus', () => {
  it('maps quick-check levels to a status', () => {
    expect(partStatus('strong')).toBe('ready');
    expect(partStatus('getting_there')).toBe('getting_there');
    expect(partStatus('start_here')).toBe('start_here');
    expect(partStatus(undefined)).toBe('not_checked');
    expect(partStatus('other')).toBe('not_checked');
  });
});

describe('topicStates', () => {
  const lessons = [
    { id: 'a1', topic: 'A' }, { id: 'a2', topic: 'A' },
    { id: 'b1', topic: 'B' },
    { id: 'c1', topic: 'C' },
  ];

  it('marks done, current and later topics and leaves out empty ones', () => {
    const progress = [{ lesson_id: 'a1', completed: true }, { lesson_id: 'a2', completed: true }];
    const next = { lesson: lessons[2], reason: 'start' };
    const rows = topicStates(['A', 'B', 'C', 'Empty'], lessons, progress, next);
    expect(rows.map((r) => [r.name, r.state, r.doneCount])).toEqual([['A', 'done', 2], ['B', 'current', 0], ['C', 'later', 0]]);
  });

  it('lets the current topic win over done', () => {
    const progress = [{ lesson_id: 'b1', completed: true, needs_review: true }];
    const rows = topicStates(['A', 'B'], lessons, progress, { lesson: lessons[2], reason: 'review' });
    expect(rows[1].state).toBe('current');
  });

  it('has no current topic when every lesson is done', () => {
    const progress = lessons.map((l) => ({ lesson_id: l.id, completed: true }));
    expect(topicStates(['A', 'B', 'C'], lessons, progress, null).every((r) => r.state === 'done')).toBe(true);
  });
});
