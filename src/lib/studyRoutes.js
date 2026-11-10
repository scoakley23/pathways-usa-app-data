// Lessons and Practice live in one Study page (/study) as two tabs. The old
// addresses (/Lessons, /Practice, /Practice?mode=…) still work: they send the
// learner to the matching tab and keep everything else in the address.

export const STUDY_TABS = ['lessons', 'practice'];

// Which tab a Study address shows. A practice run (?mode=…) is always on the
// Practice tab; with no tab, Study opens on Lessons.
export function studyTab(search = '') {
  const params = new URLSearchParams(search);
  if (params.has('mode')) return 'practice';
  const tab = (params.get('tab') || '').toLowerCase();
  return STUDY_TABS.includes(tab) ? tab : 'lessons';
}

// The Study address for a tab, keeping the other query parameters (mode,
// lesson, …) in their order. `search` is a location.search string.
export function studyPath(tab, search = '') {
  const params = new URLSearchParams(search);
  params.delete('tab');
  const rest = params.toString();
  return `/study?tab=${STUDY_TABS.includes(tab) ? tab : 'lessons'}${rest ? `&${rest}` : ''}`;
}

// True for the Study tabs on the tab bar (Study, and the old Lessons and
// Practice addresses on their way there).
export function isStudyPath(pathname = '') {
  return ['/study', '/lessons', '/practice'].includes(pathname.toLowerCase());
}
