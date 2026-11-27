// The app shell (Pathways + Amio, Prompt 3): four bottom tabs, Today ·
// Course · Interview · Me, and which addresses belong to which tab. Pure
// data and functions so tests can check that every old place is still
// reachable.

export const TAB_PATHS = {
  today: '/',
  course: '/course',
  interview: '/interview',
  me: '/me',
};

// Addresses (lowercase, no query) that light up each tab. Anything not
// listed lights up no tab.
const TAB_FOR_PATH = {
  '/': 'today',
  '/plan': 'today',
  '/done-today': 'today',
  '/review-chest': 'today',
  '/study': 'course',
  '/lessons': 'course',
  '/practice': 'course',
  '/learn': 'course',
  '/review': 'course',
  '/dashboard': 'course',
  '/interview': 'interview',
  '/interview/when': 'interview',
  '/interview-day': 'interview',
  '/class': 'interview',
  '/n400-guide': 'interview',
  '/n400-coach': 'interview',
  '/me': 'me',
  '/settings': 'me',
  '/settings/ai-policy': 'me',
  '/ask': 'me',
  '/resources': 'me',
  '/lawyer-first': 'me',
  '/progress': 'me',
  '/profile': 'me',
  '/studyhistory': 'me',
  '/partner': 'me',
  '/admin': 'me',
  '/admin/pilot': 'me',
};

export function tabFor(pathname = '/') {
  const p = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  // The Course tab (Prompt 5): /course, its unit guide, all units and lessons.
  if (p === '/course' || p.startsWith('/course/')) return 'course';
  return TAB_FOR_PATH[p] || null;
}

// What the Interview tab lists (Prompt 10 restyles it).
export const INTERVIEW_LINKS = [
  { id: 'mock', label: 'Practice interview', body: 'Answer the officer’s questions out loud and get scores.', path: '/study?tab=practice&mode=interview' },
  { id: 'day', label: 'What happens on the day', body: 'What to expect, and a full practice run of the day.', path: '/interview-day' },
  { id: 'n400', label: 'N-400 guide', body: 'What each question on the form means and how the officer may say it.', path: '/n400-guide' },
  // The old N-400 coach address now opens the learner's next N-400 lesson.
  { id: 'coach', label: 'Next N-400 lesson', body: 'Learn to understand the officer’s N-400 questions.', path: '/n400-coach' },
  // The Class screen (desktop vision D): civics questions on a big screen for a class.
  { id: 'class', label: 'Class screen', body: 'Show civics questions on a big screen for your class.', path: '/class' },
];

// What Me lists under the path and topics (Amio v2, frame Me): Ask Amio, Free
// help near you and Progress. Everything else moved to Settings
// (SETTINGS_LINKS). `when` limits a row to some learners: 'staff' (a partner
// program's staff) or 'admin'.
export const ME_LINKS = [
  { id: 'ask', label: 'Ask Amio a question', path: '/ask' },
  { id: 'help', label: 'Free help near you', path: '/resources' },
  { id: 'progress', label: 'Your progress', path: '/Progress' },
];
// Me's top corner opens Settings (frame Me's settings icon).
export const SETTINGS_PATH = '/settings';
export const SETTINGS_LINKS = [
  { id: 'history', label: 'Your questions to Amio', path: '/StudyHistory' },
  { id: 'notifications', label: 'Notifications', action: 'notifications' },
  { id: 'partner', label: 'Partner program page', path: '/Partner', when: 'staff' },
  { id: 'admin', label: 'Admin', path: '/Admin', when: 'admin' },
];
/** @deprecated older name; Settings lists these now. */
export const ME_MORE_LINKS = SETTINGS_LINKS;

// The old Profile page moved to Settings (Amio v2: My tutor is a Settings
// row too). Its old #anchors go where that card lives now.
export function profileRedirect(hash = '') {
  const h = (hash || '').replace(/^#/, '');
  if (h === 'settings' || h === 'delete-data') return `/settings#${h}`;
  if (h === 'program') return '/settings#program';
  return '/me';
}

// Amio v2: on phones there is no header on first open (Welcome, the
// first-open steps and the quick check) or on the four tabs; desktop keeps a
// slim header with the tabs. Other pages keep the header (no language button).
export const HEADERLESS = ['/', '/course', '/interview', '/me', '/quick-check'];
export function isHeaderless(pathname = '') {
  const p = pathname.toLowerCase().replace(/\/+$/, '') || '/';
  return HEADERLESS.includes(p);
}
