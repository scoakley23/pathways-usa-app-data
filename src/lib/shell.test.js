import { describe, it, expect } from 'vitest';
import { tabFor, TAB_PATHS, INTERVIEW_LINKS, ME_LINKS, ME_MORE_LINKS, profileRedirect } from './shellRoutes';
import { lessonSuggestions, STARTER_SUGGESTIONS, INTERVIEW_SUGGESTIONS } from './askSuggestions';
import { ASK_SCREEN_LINES, ASK_SCREEN_LINES_ES, looksPersonalLegal } from './askTutor';
import layoutSrc from '../Layout.jsx?raw';

describe('the four tabs', () => {
  it('has Today, Course, Interview and Me', () => {
    expect(Object.keys(TAB_PATHS)).toEqual(['today', 'course', 'interview', 'me']);
  });

  it('lights up the right tab for each place', () => {
    expect(tabFor('/')).toBe('today');
    for (const p of ['/study', '/Lessons', '/Practice', '/learn', '/review', '/Dashboard']) expect(tabFor(p)).toBe('course');
    for (const p of ['/interview', '/interview-day', '/n400-guide', '/n400-coach']) expect(tabFor(p)).toBe('interview');
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
    ...ME_MORE_LINKS.filter((l) => l.path).map((l) => l.path),
  ].map((p) => p.split('?')[0].toLowerCase());

  const OLD_PLACES = [
    '/', // Today
    '/study', // Study (Lessons and Practice)
    '/ask', // the old Vía/Amio tab: Ask Amio
    '/n400-guide', // the old N-400 tab
    '/progress', '/interview-day', '/resources', '/partner', '/admin', // the old profile menu
    '/settings', '/me', // the old Profile page, split in two
    '/studyhistory', '/n400-coach',
  ];

  for (const place of OLD_PLACES) {
    it(`can reach ${place}`, () => expect(reachable).toContain(place));
  }

  it('Notifications and Sign out are on Me', () => {
    expect(ME_MORE_LINKS.some((l) => l.action === 'notifications')).toBe(true);
  });

  it('the old Profile anchors go where those cards live now', () => {
    expect(profileRedirect('')).toBe('/me');
    expect(profileRedirect('#program')).toBe('/me#program');
    expect(profileRedirect('#settings')).toBe('/settings#settings');
    expect(profileRedirect('#delete-data')).toBe('/settings#delete-data');
  });

  it('there is no floating tutor button or profile menu left in the layout', () => {
    expect(layoutSrc).not.toMatch(/openTutorChat|<StudyBuddy|SheetTrigger/);
  });
});

describe('Ask Amio suggestions', () => {
  const lessons = [
    { id: 'l1', title: 'The three branches', key_points: [{ text: 'Separation of powers keeps any one branch from becoming too strong.' }, { text: 'federal' }] },
    { id: 'l2', title: 'Congress', key_points: [{ text: 'the Senate' }] },
    { id: 'l3', title: 'Old lesson', key_points: [{ text: 'colony' }] },
  ];
  const progress = [
    { lesson_id: 'l3', last_attempt_date: '2026-10-01' },
    { lesson_id: 'l1', last_attempt_date: '2026-11-10' },
    { lesson_id: 'l2', last_attempt_date: '2026-11-12' },
    { lesson_id: 'gone', last_attempt_date: '2026-11-13' },
  ];

  it('uses the 2 most recent lessons: a short key word first, then the title', () => {
    expect(lessonSuggestions(progress, lessons)).toEqual([
      'What does "the Senate" mean?',
      'What does "federal" mean?',
      'Explain "Congress" again',
    ]);
  });

  it('is empty without lessons (the screen shows starters instead)', () => {
    expect(lessonSuggestions([], lessons)).toEqual([]);
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
