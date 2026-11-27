import { describe, it, expect } from 'vitest';
import { tabFor, TAB_PATHS, INTERVIEW_LINKS, ME_LINKS, SETTINGS_LINKS, SETTINGS_PATH, profileRedirect } from './shellRoutes';
import { studyPath, studyTab } from './studyRoutes';
import { lessonSuggestions, STARTER_SUGGESTIONS, INTERVIEW_SUGGESTIONS } from './askSuggestions';
import { ASK_SCREEN_LINES, ASK_SCREEN_LINES_ES, looksPersonalLegal } from './askTutor';
import layoutSrc from '../Layout.jsx?raw';

describe('the four tabs', () => {
  it('has Today, Course, Interview and Me', () => {
    expect(Object.keys(TAB_PATHS)).toEqual(['today', 'course', 'interview', 'me']);
  });

  it('lights up the right tab for each place', () => {
    expect(tabFor('/')).toBe('today');
    for (const p of ['/course', '/course/units', '/course/unit/u2', '/course/lesson/u2-s2-l3', '/study', '/Lessons', '/Practice', '/learn', '/review', '/Dashboard']) expect(tabFor(p)).toBe('course');
    expect(TAB_PATHS.course).toBe('/course');
    for (const p of ['/interview', '/interview/when', '/interview-day', '/n400-guide', '/n400-coach']) expect(tabFor(p)).toBe('interview');
    for (const p of ['/me', '/settings', '/ask', '/resources', '/lawyer-first', '/Progress', '/Profile', '/StudyHistory', '/Partner', '/Admin']) expect(tabFor(p)).toBe('me');
    expect(tabFor('/quick-check')).toBe(null);
  });
});

describe('every old place is still reachable', () => {
  // Every place the old tab bar or profile menu opened, and where it is now.
  const reachable = [
    ...Object.values(TAB_PATHS),
    ...INTERVIEW_LINKS.map((l) => l.path),
    ...ME_LINKS.map((l) => l.path),
    SETTINGS_PATH,
    ...SETTINGS_LINKS.filter((l) => l.path).map((l) => l.path),
  ].map((p) => p.split('?')[0].toLowerCase());

  const OLD_PLACES = [
    '/', // Today
    '/study', // Study (Practice; the old Lessons tab is in Course)
    '/ask', // the old Vía/Amio tab: Ask Amio
    '/n400-guide', // the old N-400 tab
    '/progress', '/interview-day', '/resources', '/partner', '/admin', // the old profile menu
    '/settings', '/me', // the old Profile page, split in two
    '/studyhistory', '/n400-coach',
  ];

  for (const place of OLD_PLACES) {
    it(`can reach ${place}`, () => expect(reachable).toContain(place));
  }

  it('the old Lessons tab and /Lessons land on Course; Study is Practice', () => {
    expect(studyTab('?tab=lessons')).toBe('lessons');
    expect(studyPath('lessons', '?tab=lessons')).toBe('/course');
    expect(reachable).toContain('/course');
    expect(tabFor('/course')).toBe('course');
    expect(studyPath('practice', '')).toBe('/study?tab=practice');
  });

  it('Notifications are in Settings', () => {
    expect(SETTINGS_LINKS.some((l) => l.action === 'notifications')).toBe(true);
  });

  it('the old Profile anchors go where those cards live now', () => {
    expect(profileRedirect('')).toBe('/me');
    expect(profileRedirect('#program')).toBe('/settings#program');
    expect(profileRedirect('#settings')).toBe('/settings#settings');
    expect(profileRedirect('#delete-data')).toBe('/settings#delete-data');
  });

  it('there is no floating tutor button or profile menu left in the layout', () => {
    expect(layoutSrc).not.toMatch(/openTutorChat|<StudyBuddy|SheetTrigger/);
  });
});

describe('Ask Amio suggestions', () => {
  const lesson = (id, title, words, status = 'reviewed') => ({ id, title, status, steps: { listen: { facts: [`${title} fact.`], newWords: words } } });
  const LESSONS = {
    l1: lesson('l1', 'The three branches', [{ word: 'checks', meaning: 'limits', status: 'draft' }, { word: 'federal', meaning: 'for the whole country' }]),
    l2: lesson('l2', 'Congress', [{ word: 'the Senate', meaning: 'one part of Congress' }]),
    l3: lesson('l3', 'Old lesson', [{ word: 'colony', meaning: 'a place ruled from far away' }]),
    l4: lesson('l4', 'Draft lesson', [{ word: 'draft', meaning: 'x' }], 'draft'),
  };
  const find = (id) => LESSONS[id] || null;
  const progress = [
    { lesson_id: 'l3', completed_at: '2026-10-01' },
    { lesson_id: 'l1', completed_at: '2026-11-10' },
    { lesson_id: 'l2', completed_at: '2026-11-12' },
    { lesson_id: 'l4', completed_at: '2026-11-13' },
    { lesson_id: '699db0a1297afea4b73d1036', last_attempt_date: '2026-11-14' }, // an old Lessons tab row
  ];

  it('uses the 2 most recent reviewed Course lessons: a reviewed new word first, then the title', () => {
    expect(lessonSuggestions(progress, find).map((q) => q.question)).toEqual([
      'What does "the Senate" mean?',
      'What does "federal" mean?',
      'Explain "Congress" again',
    ]);
    expect(lessonSuggestions(progress, find)[0]).toEqual({ id: 'course_l2_term', question: 'What does "the Senate" mean?', lead: 'the Senate: ', parts: ['one part of Congress'] });
  });

  it('is empty without lessons (the screen shows starters instead)', () => {
    expect(lessonSuggestions([], find)).toEqual([]);
    expect(STARTER_SUGGESTIONS).toHaveLength(3);
    expect(INTERVIEW_SUGGESTIONS).toHaveLength(3);
  });

  it('fixed suggestions have English and Spanish text and never ask about the learner’s own case', () => {
    for (const key of [...STARTER_SUGGESTIONS, ...INTERVIEW_SUGGESTIONS]) {
      expect(ASK_SCREEN_LINES[key]).toBeTruthy();
      expect(ASK_SCREEN_LINES_ES[key]).toBeTruthy();
      expect(ASK_SCREEN_LINES[key]).not.toMatch(/\bmy\b|eligib/i);
      expect(looksPersonalLegal(ASK_SCREEN_LINES[key])).toBe(false);
    }
    expect(Object.keys(ASK_SCREEN_LINES_ES).sort()).toEqual(Object.keys(ASK_SCREEN_LINES).sort());
  });
});

describe('headerless screens (Amio v2)', () => {
  it('drops the phone header on first open and the four tabs only', async () => {
    const { isHeaderless } = await import('./shellRoutes');
    for (const p of ['/', '/course', '/interview', '/me', '/quick-check', '/Me/']) expect(isHeaderless(p)).toBe(true);
    for (const p of ['/settings', '/ask', '/Progress', '/course/units', '/interview/when', '/plan']) expect(isHeaderless(p)).toBe(false);
  });
});
