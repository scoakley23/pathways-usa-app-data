import { describe, it, expect } from 'vitest';
import { studyTab, studyPath, isStudyPath } from './studyRoutes';

describe('studyPath', () => {
  it('sends the old Lessons and Practice addresses to the right tab', () => {
    expect(studyPath('lessons', '')).toBe('/study?tab=lessons');
    expect(studyPath('practice', '')).toBe('/study?tab=practice');
  });

  it('keeps a practice run and other parameters', () => {
    expect(studyPath('practice', '?mode=reading')).toBe('/study?tab=practice&mode=reading');
    expect(studyPath('practice', '?tab=lessons&mode=civics&x=1')).toBe('/study?tab=practice&mode=civics&x=1');
  });

  it('falls back to Lessons for an unknown tab', () => {
    expect(studyPath('nope', '')).toBe('/study?tab=lessons');
  });
});

describe('studyTab', () => {
  it('reads the tab, defaulting to Lessons', () => {
    expect(studyTab('')).toBe('lessons');
    expect(studyTab('?tab=practice')).toBe('practice');
    expect(studyTab('?tab=Practice')).toBe('practice');
    expect(studyTab('?tab=other')).toBe('lessons');
  });

  it('puts a practice run on the Practice tab', () => {
    expect(studyTab('?mode=dictation')).toBe('practice');
    expect(studyTab('?tab=lessons&mode=civics')).toBe('practice');
  });
});

describe('isStudyPath', () => {
  it('matches Study and the old addresses, any case', () => {
    expect(isStudyPath('/study')).toBe(true);
    expect(isStudyPath('/Lessons')).toBe(true);
    expect(isStudyPath('/Practice')).toBe(true);
    expect(isStudyPath('/n400-guide')).toBe(false);
  });
});
