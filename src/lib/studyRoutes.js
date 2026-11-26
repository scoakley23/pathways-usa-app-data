// Study is Practice only now. The old Lessons tab merged into Course: its
// addresses (/study?tab=lessons, /Lessons) go to /course. The old addresses
// /Practice and /Practice?mode=… still open Practice, keeping the rest of the
// address.

export const STUDY_TABS = ['practice'];
export const OLD_LESSONS_PATH = '/course';

// Which part a Study address asks for: 'lessons' only for the old Lessons
// tab (which redirects to Course); everything else is Practice. A practice
// run (?mode=…) is always Practice.
export function studyTab(search = '') {
  const params = new URLSearchParams(search);
  if (params.has('mode')) return 'practice';
  return (params.get('tab') || '').toLowerCase() === 'lessons' ? 'lessons' : 'practice';
}

// The address for a Study tab, keeping the other query parameters (mode, …)
// in their order. The old Lessons tab goes to Course. `search` is a
// location.search string.
export function studyPath(tab, search = '') {
  const params = new URLSearchParams(search);
  if (tab === 'lessons' && !params.has('mode')) return OLD_LESSONS_PATH;
  params.delete('tab');
  const rest = params.toString();
  return `/study?tab=practice${rest ? `&${rest}` : ''}`;
}

// True for Study and the old Lessons and Practice addresses.
export function isStudyPath(pathname = '') {
  return ['/study', '/lessons', '/practice'].includes(pathname.toLowerCase());
}
