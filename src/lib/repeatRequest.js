// "Can you please say that again?" On the real test a learner may ask the
// officer to repeat a question; that is not an answer. isRepeatRequest() is
// true when the WHOLE reply (spoken or typed, in English) only asks to hear
// the question again. Then the app repeats the question instead of grading:
// nothing is checked, counted, saved or sent to the AI.
//
// A reply that also says anything else ("can you repeat… the Constitution")
// is graded as an answer, so a real answer is never thrown away.

const clean = (s) => String(s || '')
  .toLowerCase()
  .replace(/[’']/g, "'")
  .replace(/[^a-z' ]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

// Words that may come around the request without changing it.
const POLITE = new Set([
  'please', 'sorry', 'officer', 'sir', 'maam', "ma'am", 'madam', 'miss', 'mister', 'excuse', 'me',
  'um', 'uh', 'umm', 'hmm', 'oh', 'ok', 'okay', 'yes', 'so', 'and', 'i', "i'm", 'im', 'am',
]);

// The request itself: each pattern must cover a whole phrase.
const PHRASES = [
  // can / could / would / will you (please) repeat|say|ask|read (that|it|the question|this) (again|one more time)
  /^(?:(?:can|could|would|will) you (?:please )?)?(?:repeat|say|ask|read)(?: (?:that|it|this|the question|your question|the last question|what you said|yourself))?(?: (?:again|one more time|once more|one more|slower|slowly|more slowly))?$/,
  // (can|could) i hear (that|it|the question) again
  /^(?:can|could|may) i (?:please )?hear (?:that|it|this|the question)(?: again| one more time)?$/,
  // one more time / once more / again
  /^(?:one more time|once more|come again|again)$/,
  // pardon (me)
  /^(?:beg your )?pardon(?: me)?$/,
  // what (was|is) the question / what did you say / what
  /^what(?: was| is)?(?: the question| that| you said| did you say| did you ask)?$/,
  // i didn't (hear|understand|catch) (that|it|you|the question)
  /^(?:i )?(?:didn't|did not|don't|do not|couldn't|could not) (?:hear|understand|catch|get)(?: (?:that|it|you|the question|what you said))?(?: well)?$/,
  // i don't understand the question / i'm sorry i don't understand
  /^(?:i )?(?:don't|do not) understand(?: (?:the question|that|it|you))?$/,
  // repeat please
  /^repeat$/,
];

// Splits off polite words at the start and end, and between two requests
// ("sorry, I didn't hear you, can you repeat that").
function stripPolite(words) {
  let a = 0;
  let b = words.length;
  while (a < b && POLITE.has(words[a])) a++;
  while (b > a && POLITE.has(words[b - 1])) b--;
  return words.slice(a, b);
}

function isPhrase(words) {
  const text = stripPolite(words).join(' ');
  return !!text && PHRASES.some((re) => re.test(text));
}

// Tries every way of cutting the reply into one or two requests.
export function isRepeatRequest(reply) {
  const words = clean(reply).split(' ').filter(Boolean);
  if (!words.length || words.length > 16) return false;
  if (isPhrase(words)) return true;
  // Only polite words, with "sorry" or "excuse me": "Sorry?", "Excuse me, officer?"
  if (!stripPolite(words).length && (words.includes('sorry') || words.includes('excuse'))) return true;
  for (let i = 1; i < words.length; i++) {
    if (isPhrase(words.slice(0, i)) && isPhrase(words.slice(i))) return true;
  }
  return false;
}
