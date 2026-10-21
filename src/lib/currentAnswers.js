import CURRENT_OFFICIALS from '../../content/civics/current-officials.json';

// Answers that are not fixed in the official list:
// - "Answers change" (President, Vice President, Speaker, Chief Justice):
//   names an admin checked on uscis.gov and confirmed, in
//   content/civics/current-officials.json (updated from Admin → Current officials).
// - "Answers vary by where you live" (your senators, representative,
//   governor, state capital): the learner's own Find My Representative result.
// Nothing here is ever AI-written at view time.

export { CURRENT_OFFICIALS };

export const isChangingAnswer = (answer) => (answer || '').startsWith('Answers change');
export const isLocalAnswer = (answer) => (answer || '').startsWith('Answers vary');

// Which national office a "now" question asks about ("Vice President" before "President").
export function officeFor(questionText) {
  const q = (questionText || '').toLowerCase();
  if (q.includes('vice president')) return 'vicePresident';
  if (q.includes('speaker')) return 'speaker';
  if (q.includes('chief justice')) return 'chiefJustice';
  if (q.includes('president')) return 'president';
  return null;
}

// The learner's own answer for a location question, from their saved
// Find My Representative result (PublicProfile.representative_data).
export function getPersonalizedAnswer(question, representativeData) {
  if (!representativeData || !question) return null;
  const q = question.toLowerCase();
  if (!q.includes('your')) return null; // only personalize location-specific questions (e.g. "your state's U.S. senators")
  if (q.includes('senator') || q.includes('senators')) {
    return (representativeData.senators || []).map((s) => s.name).join(' and ') || null;
  }
  if (q.includes('representative') || q.includes('house of representatives')) {
    if (!representativeData.representative?.name) return null;
    return `${representativeData.representative.name} (District ${representativeData.representative.district})`;
  }
  if (q.includes('governor')) return representativeData.governor || null;
  if (q.includes('capital')) return representativeData.state_capital || null;
  return null;
}

// What to show next to the official "Answers change / vary" text:
//   { kind: 'current', text, checkedOn, source }  confirmed national official
//   { kind: 'check', source }                     not confirmed yet: check uscis.gov
//   { kind: 'yours', text }                       the learner's own official
//   { kind: 'find' }                              not looked up yet
//   null                                          a fixed answer (nothing to add)
export function currentAnswerFor(question, { representativeData = null, officials = CURRENT_OFFICIALS } = {}) {
  if (!question) return null;
  if (isChangingAnswer(question.answer)) {
    const name = officials?.answers?.[officeFor(question.question)];
    return name && officials.checkedOn
      ? { kind: 'current', text: name, checkedOn: officials.checkedOn, source: officials.source }
      : { kind: 'check', source: officials?.source || CURRENT_OFFICIALS.source };
  }
  if (isLocalAnswer(question.answer)) {
    const text = getPersonalizedAnswer(question.question, representativeData);
    return text ? { kind: 'yours', text } : { kind: 'find' };
  }
  return null;
}

// Problems in current-officials.json (empty = OK). Names may be blank only
// while checkedOn is null.
export function findOfficialsProblems(officials) {
  const problems = [];
  if (!officials || typeof officials !== 'object') return ['current-officials.json is not an object'];
  if (!/^https:\/\/www\.uscis\.gov\//.test(officials.source || '')) problems.push('source must be a https://www.uscis.gov/ page');
  const keys = ['president', 'vicePresident', 'speaker', 'chiefJustice'];
  for (const k of keys) {
    if (typeof officials.answers?.[k] !== 'string') problems.push(`answers.${k} must be a string`);
  }
  if (officials.checkedOn !== null) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(officials.checkedOn || '')) problems.push('checkedOn must be null or yyyy-mm-dd');
    for (const k of keys) if (!officials.answers?.[k]?.trim()) problems.push(`answers.${k} is empty but checkedOn is set`);
  }
  return problems;
}
