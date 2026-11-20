// Settings → "Questions and answers" (Amio v2, frame MeSettings). Reviewed
// content in content/faq/faq.json; learners see only "reviewed" entries, and
// Settings hides the row while there are none.
import FAQ from '../../content/faq/faq.json';

export const FAQ_ITEMS = FAQ.items;

export function reviewedFaq(items = FAQ_ITEMS) {
  return items.filter((x) => x.status === 'reviewed');
}

/** Problems with the FAQ file (for the test). */
export function faqProblems(items = FAQ_ITEMS) {
  const problems = [];
  const ids = new Set();
  for (const x of items) {
    if (!x.id || ids.has(x.id)) problems.push(`bad or repeated id: ${x.id}`);
    ids.add(x.id);
    if (!['draft', 'reviewed'].includes(x.status)) problems.push(`${x.id}: status must be draft or reviewed`);
    if (!x.q?.trim() || !x.a?.trim()) problems.push(`${x.id}: needs q and a`);
    if ((x.a || '').length > 240) problems.push(`${x.id}: answer over 240 characters`);
  }
  return problems;
}
