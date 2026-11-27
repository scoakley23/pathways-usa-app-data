import { describe, it, expect } from 'vitest';
import { studyTab, studyPath, isStudyPath, OLD_LESSONS_PATH } from './studyRoutes';

describe('studyPath', () => {
  it('Practice keeps the rest of the address', () => {
    expect(studyPath('practice', '')).toBe('/study?tab=practice');
    expect(studyPath('practice', '?mode=reading')).toBe('/study?tab=practice&mode=reading');
    expect(studyPath('practice', '?tab=lessons&mode=civics&x=1')).toBe('/study?tab=practice&mode=civics&x=1');
    expect(studyPath('nope', '')).toBe('/study?tab=practice');
  });

  it('the old Lessons tab goes to Course', () => {
    expect(OLD_LESSONS_PATH).toBe('/course');
    expect(studyPath('lessons', '')).toBe('/course');
    expect(studyPath('lessons', '?tab=lessons')).toBe('/course');
    // A practice run on an old Lessons address is still a practice run.
    expect(studyPath('lessons', '?mode=civics')).toBe('/study?tab=practice&mode=civics');
  });
});

describe('studyTab', () => {
  it('is Practice unless the address asks for the old Lessons tab', () => {
    expect(studyTab('')).toBe('practice');
    expect(studyTab('?tab=practice')).toBe('practice');
    expect(studyTab('?tab=Practice')).toBe('practice');
    expect(studyTab('?tab=other')).toBe('practice');
    expect(studyTab('?tab=lessons')).toBe('lessons');
    expect(studyTab('?tab=Lessons')).toBe('lessons');
  });

  it('a practice run is always Practice', () => {
    expect(studyTab('?mode=dictation')).toBe('practice');
    expect(studyTab('?tab=lessons&mode=civics')).toBe('practice');
  });
});

describe('isStudyPath', () => {
  it('knows Study and its old addresses', () => {
    expect(isStudyPath('/study')).toBe(true);
    expect(isStudyPath('/Lessons')).toBe(true);
    expect(isStudyPath('/Practice')).toBe(true);
    expect(isStudyPath('/n400-guide')).toBe(false);
  });
});
