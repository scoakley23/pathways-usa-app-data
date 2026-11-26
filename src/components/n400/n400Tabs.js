// Short tab labels for the N-400 sections (Part 8, then the Part 9 groups), in
// form order. Sections no longer have their own colors: every tone is navy
// (the `tone` names stay so callers keep working).
export const TABS = {
  'time-outside-us': { label: 'Part 8', tone: 'civics' },
  'citizenship-voting-taxes': { label: 'Citizenship, voting, and taxes', tone: 'reading' },
  'groups-violence': { label: 'Groups and violence', tone: 'writing' },
  'crimes-offenses': { label: 'Crimes and offenses', tone: 'speaking' },
  'immigration-history': { label: 'Immigration history', tone: 'plum' },
  'selective-service-military': { label: 'Selective Service and military', tone: 'sky' },
  'oath-questions': { label: 'Oath questions', tone: 'navy' },
};

export const tabFor = (section) => TABS[section.id] || { label: section.title, tone: 'navy' };
