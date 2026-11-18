// "Ask for help" in an N-400 lesson: the learner practices the phrases that
// help in the interview room. helpRequestKind() says which one a reply is, on
// the device (nothing is sent anywhere):
//   'repeat'  → "Could you repeat that, please?" (src/lib/repeatRequest.js)
//   'meaning' → "What does ___ mean?"
//   'simpler' → "Can you say it more simply?"
// or null. Speech can blur the word in "What does ___ mean?", so any word counts.
import { isRepeatRequest } from '@/lib/repeatRequest';

const clean = (s) => String(s || '')
  .toLowerCase()
  .replace(/[’']/g, "'")
  .replace(/[^a-z0-9' -]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const MEANING = [
  /\bwhat (?:does|do|did|is) (?:the word )?.{1,40} mean\b/,
  /\bwhat is the meaning of\b/,
  /\bwhat does that (?:word )?mean\b/,
  /\bwhat does it mean\b/,
];
const SIMPLER = [
  /\b(?:say|explain|ask|put) (?:it|that|this|the question)? ?(?:more )?(?:simply|simple|simpler|easier|in (?:simple|simpler|easier|other) words)\b/,
  /\b(?:use|with) (?:simpler|easier|simple|easy) words\b/,
  /\bmore simply\b/,
  /\bin (?:simple|simpler|easier) (?:english|words)\b/,
];

export function helpRequestKind(reply) {
  const text = clean(reply);
  if (!text) return null;
  if (SIMPLER.some((re) => re.test(text))) return 'simpler';
  if (/\bmean(?:s|ing)?\b/.test(text) && MEANING.some((re) => re.test(text))) return 'meaning';
  if (isRepeatRequest(reply)) return 'repeat';
  return null;
}
