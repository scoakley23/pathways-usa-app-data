import { describe, it, expect } from 'vitest';
import { suggestPart, partStatus } from './studyView';

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
