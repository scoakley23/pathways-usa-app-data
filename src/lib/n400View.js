// The N-400 guide (The Road): pure helpers, no storage.

// The cards a learner sees in a section (admins also see drafts).
export function visibleCards(section, isAdmin = false) {
  const qs = section?.questions || [];
  return isAdmin ? qs : qs.filter((q) => q.status === 'approved');
}

// "39 cards · 7 sections" on the guide's navy top.
export function cardCount(sections = [], isAdmin = false) {
  return sections.reduce((n, s) => n + visibleCards(s, isAdmin).length, 0);
}

// The section the "Continue" button opens: the first one not read yet.
// `started` = some section is read already ("Continue" instead of "Start");
// null section when every section is read.
export function nextSection(sections = [], completedIds = []) {
  const section = sections.find((s) => !completedIds.includes(s.id)) || null;
  return { section, started: sections.some((s) => completedIds.includes(s.id)) };
}

// Each section's place on the guide's road: 'done' (read), 'current' (the
// next one to read) or 'later'.
export function sectionStates(sections = [], completedIds = []) {
  const { section } = nextSection(sections, completedIds);
  return sections.map((s) => (completedIds.includes(s.id) ? 'done' : s.id === section?.id ? 'current' : 'later'));
}
