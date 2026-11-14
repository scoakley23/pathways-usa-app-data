// The N-400 practice person (Prompt 10, a trial): a made-up person whose
// answers learners can hear and say out loud. Reviewed content in
// content/n400/practice-person.json, never written by AI live. Learners see an
// answer only when both the person and the answer are "reviewed"; admins also
// see drafts (marked as drafts). Always labeled "practice person, not real".
import data from '../../content/n400/practice-person.json';

export const PRACTICE_PERSON_LABEL = 'practice person, not real';
export const PRACTICE_PERSON = data;

// { name, answer, draft } for a card, or null when there is nothing to show.
export function practiceAnswer(questionId, { isAdmin = false, source = data } = {}) {
  const entry = source?.answers?.[questionId];
  if (!entry?.answer || !source?.person?.name) return null;
  const reviewed = source.person.status === 'reviewed' && entry.status === 'reviewed';
  if (!reviewed && !isAdmin) return null;
  return { name: source.person.name, answer: entry.answer, draft: !reviewed };
}
