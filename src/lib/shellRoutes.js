// The app shell (Pathways + Amio, Prompt 3): four bottom tabs, Today ·
// Course · Interview · Me, and which addresses belong to which tab. Pure
// data and functions so tests can check that every old place is still
// reachable.

export const TAB_PATHS = {
  today: '/',
  course: '/study?tab=lessons',
  interview: '/interview',
  me: '/me',
};

// Addresses (lowercase, no query) that light up each tab. Anything not
// listed lights up no tab.
const TAB_FOR_PATH = {
  '/': 'today',
  '/study': 'course',
  '/lessons': 'course',
  '/practice': 'course',
  '/learn': 'course',
  '/review': 'course',
  '/dashboard': 'course',
  '/interview': 'interview',
  '/interview-day': 'interview',
  '/n400-guide': 'interview',
  '/n400-coach': 'interview',
  '/me': 'me',
  '/settings': 'me',
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
  return TAB_FOR_PATH[p] || null;
}

// What the Interview tab lists (Prompt 10 restyles it).
export const INTERVIEW_LINKS = [
  { id: 'mock', label: 'Practice interview', body: 'Answer the officer’s questions out loud and get scores.', path: '/study?tab=practice&mode=interview' },
  { id: 'day', label: 'What happens on the day', body: 'What to expect, and a full practice run of the day.', path: '/interview-day' },
  { id: 'n400', label: 'N-400 guide', body: 'What each question on the form means and how the officer may say it.', path: '/n400-guide' },
  { id: 'coach', label: 'Practice the N-400 with Amio', body: 'Learn to understand the officer’s N-400 questions.', path: '/n400-coach' },
];

// What Me lists. `when` limits a row to some learners: 'staff' (a partner
// program's staff) or 'admin'.
export const ME_LINKS = [
  { id: 'ask', label: 'Ask Amio a question', path: '/ask' },
  { id: 'help', label: 'Free help near you', path: '/resources' },
  { id: 'settings', label: 'Settings and privacy', path: '/settings' },
];
export const ME_MORE_LINKS = [
  { id: 'progress', label: 'Your progress', path: '/Progress' },
  { id: 'history', label: 'Your questions to Amio', path: '/StudyHistory' },
  { id: 'notifications', label: 'Notifications', action: 'notifications' },
  { id: 'partner', label: 'Partner program page', path: '/Partner', when: 'staff' },
  { id: 'admin', label: 'Admin', path: '/Admin', when: 'admin' },
];

// The old Profile page moved: Me has the person and the program, Settings
// has the rest. Its old #anchors go where that card lives now.
export function profileRedirect(hash = '') {
  const h = (hash || '').replace(/^#/, '');
  if (h === 'settings' || h === 'delete-data') return `/settings#${h}`;
  if (h === 'program') return '/me#program';
  return '/me';
}
