import { wordDiff } from '@/components/utils/wordDiff';

// Same normalization the dictation card has always used.
export const normalizeText = (text) =>
  (text || '').toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '').trim();

// Dictation: exact match after normalizing (unchanged rule), plus which
// target words were missed so the tutor can point them out.
export function checkDictation(target, typed) {
  const diff = wordDiff(target, typed);
  return {
    isCorrect: normalizeText(typed) === normalizeText(target),
    words: diff.words,
    missing: diff.words.filter((w) => w.status === 'missing').map((w) => w.word),
  };
}

// An official answer field can list several accepted answers, one per line or
// separated by ";", "•", or " / " (the exported list). Commas are kept
// ("Washington, D.C."), and so is a slash inside a word ("Antietam/Sharpsburg").
export function splitOfficialAnswers(answer) {
  return (answer || '')
    .split(/\n|;|•|\s\/\s/)
    .map((a) => a.trim())
    .filter(Boolean);
}

const STOP_WORDS = new Set(['the', 'a', 'an', 'of', 'to', 'and', 'or', 'in', 'on', 'for', 'is', 'are', 'it', 'its']);

// ---- Matching on the device (Step 4) --------------------------------------
// Fixed rules that let an answer match however the browser's speech
// recognition (or the learner) writes it: number words = digits ("twenty-seven"
// = "27", "fourteenth" = "14th"), "U.S.S.R." = "USSR", "United States" = "U.S.",
// "World War II" = "WW2", dashes = spaces, and simple word endings
// ("naturalization" = "naturalize", "states" = "state"). Both sides go through
// the same rules, so an answer only matches an official one.

const UNITS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORDINAL_UNITS = ['zeroth', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth', 'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth', 'nineteenth'];
const ORDINAL_TENS = ['', '', 'twentieth', 'thirtieth', 'fortieth', 'fiftieth', 'sixtieth', 'seventieth', 'eightieth', 'ninetieth'];
const NUMBER = new Map();
UNITS.forEach((w, i) => NUMBER.set(w, { v: i, kind: i < 10 ? 'unit' : 'teen' }));
TENS.forEach((w, i) => w && NUMBER.set(w, { v: i * 10, kind: 'tens' }));
ORDINAL_UNITS.forEach((w, i) => NUMBER.set(w, { v: i, kind: i < 10 ? 'unit' : 'teen', ordinal: true }));
ORDINAL_TENS.forEach((w, i) => w && NUMBER.set(w, { v: i * 10, kind: 'tens', ordinal: true }));

// Number words → digits; "nineteen twenty" → "1920"; "14th" → "14".
export function foldNumbers(tokens) {
  const out = []; // { text, words: true when read from number words, at: token index }
  let total = 0;
  let cur = null;
  let last = null; // kind of the last number word
  let start = 0;
  const flush = (end) => {
    if (cur === null) return;
    out.push({ text: String(total + cur), words: true, small: total === 0 && cur >= 10 && cur <= 99 && last !== 'hundred', at: start, end });
    total = 0; cur = null; last = null;
  };
  tokens.forEach((t, i) => {
    const digit = /^(\d+)(st|nd|rd|th)?$/.exec(t);
    if (digit) { flush(i); out.push({ text: digit[1] }); return; }
    const w = NUMBER.get(t);
    if (w) {
      // Continues the number only where a place is open: "twenty seven",
      // "four hundred thirty five"; otherwise a new number starts.
      const open = cur !== null && ((w.kind === 'unit' && last === 'tens') || last === 'hundred' || last === 'thousand');
      if (!open) { flush(i); start = i; }
      cur = (cur || 0) + w.v;
      last = w.kind;
      if (w.ordinal) flush(i + 1);
      return;
    }
    if (t === 'hundred' && cur !== null) { cur *= 100; last = 'hundred'; return; }
    if (t === 'thousand' && cur !== null) { total += cur * 1000; cur = 0; last = 'thousand'; return; }
    if (t === 'and' && (last === 'hundred' || last === 'thousand') && NUMBER.has(tokens[i + 1] || '')) return;
    flush(i);
    out.push({ text: t });
  });
  flush(tokens.length);
  // Years said in pairs: "nineteen twenty" → 1920, "seventeen seventy six" → 1776.
  const merged = [];
  for (const o of out) {
    const prev = merged[merged.length - 1];
    if (prev?.small && o.small && prev.end === o.at) merged[merged.length - 1] = { text: String(Number(prev.text) * 100 + Number(o.text)) };
    else merged.push(o);
  }
  return merged.map((o) => o.text);
}

// Same word for simple endings: states/state, naturalization/naturalize, voted/vote.
export function stem(word) {
  if (/^\d+$/.test(word) || word.length <= 3) return word;
  let w = word
    .replace(/ization$/, 'ize')
    .replace(/i[sz](e|es|ed|ing)$/, 'ize')
    .replace(/ies$/, 'y');
  if (w === word) {
    if (w.length > 5 && w.endsWith('ing')) w = w.slice(0, -3);
    else if (w.length > 4 && w.endsWith('ed')) w = w.slice(0, -2);
    else if (w.length > 3 && w.endsWith('s') && !w.endsWith('ss')) w = w.slice(0, -1);
  }
  if (w.length > 3 && w.endsWith('e')) w = w.slice(0, -1);
  return w;
}

export function matchWords(text) {
  let s = String(text || '').toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/&/g, ' and ')
    .replace(/\b([a-z])\.(?=[a-z]\.)/g, '$1') // u.s.s.r. → ussr.
    .replace(/\b([a-z])\.(?=\s|$|,|\))/g, '$1') // the last letter's dot
    .replace(/'s\b/g, 's')
    .replace(/'/g, '')
    .replace(/[-–—/]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ');
  s = ` ${s.replace(/\s+/g, ' ').trim()} `
    .replace(/ united states of america /g, ' us ')
    .replace(/ united states /g, ' us ')
    .replace(/ (usa|u s a|u s) /g, ' us ')
    .replace(/ (wwii|ww ii|ww2|ww 2|world war ii|world war two|world war second) /g, ' world war 2 ')
    .replace(/ (wwi|ww i|ww1|ww 1|world war i|world war one) /g, ' world war 1 ');
  return foldNumbers(s.trim().split(/\s+/).filter(Boolean))
    .filter((w) => !STOP_WORDS.has(w))
    .map(stem);
}

// The accepted answers in an official answer field, for matching: the
// " / " list, plus any "[Also acceptable are A, B, and C.]" note.
export function acceptedForMatching(answer) {
  const text = String(answer || '');
  const extra = [];
  const note = /\[\s*also acceptable (?:are|is)\s+([^\]]+)\]/i.exec(text);
  if (note) {
    note[1].replace(/\.\s*$/, '').split(/,\s*(?:and\s+)?|\s+and\s+/).forEach((part) => {
      const p = part.trim().replace(/^(near|on|in)\s+(the\s+)?/i, '');
      if (p) extra.push(p);
    });
  }
  return [...splitOfficialAnswers(text.replace(/\[[^\]]*\]/g, ' ')), ...extra];
}

// "Name three…", "What are two…", "Name five." → 3, 2, 5 (else 1).
const COUNT_WORDS = { two: 2, three: 3, four: 4, five: 5 };
export function answersNeeded(questionText) {
  const m = /\b(?:name|what are|give)\s+(two|three|four|five)\b/i.exec(String(questionText || ''));
  return m ? COUNT_WORDS[m[1].toLowerCase()] : 1;
}

// Every key word of `accepted` (words in parentheses optional) is in `heard`.
function covers(heard, accepted) {
  const words = matchWords(accepted.replace(/\([^)]*\)/g, ' '));
  return words.length > 0 && words.every((w) => heard.has(w));
}

// On-device check of a civics answer (typed or spoken). Correct if every key
// word of an accepted answer is in what the learner said (`extra` = reviewed
// variants: [{ text, answer }], each tied to one official answer). `needed`
// distinct official answers are required ("Name three…").
// `sure` = correct AND at most MAX_EXTRA_WORDS other words (words of the
// question and FILLER don't count). A long answer that merely contains an accepted one
// ("England, France and Russia") isn't sure: where the AI can judge, it goes
// there instead of being marked right on the device.
export const MAX_EXTRA_WORDS = 0;
// Words that change the meaning ("vice president" is not "president", "not
// the Senate" is not "the Senate"): when said but not part of the matched
// answer, the answer is not accepted on the device. Numbers likewise.
const CHANGES_MEANING = new Set(['vice', 'not', 'no', 'never', 'nobody', 'none', 'dont', 'doesnt', 'didnt', 'isnt', 'wasnt', 'arent', 'cant', 'without', 'except', 'former', 'anti'].map(stem));
// Words people add around an answer; they never count as extra.
const FILLER = new Set(['i', 'think', 'believe', 'guess', 'maybe', 'um', 'uh', 'umm', 'er', 'ok', 'okay', 'so', 'well', 'yes', 'yeah', 'that', 'this', 'was', 'were', 'be', 'answer', 'my', 'would', 'say', 'sure', 'thats', 'its', 'they', 'he', 'she', 'we', 'you', 'by', 'with', 'at', 'from', 'because', 'all', 'name', 'call', 'called', 'there', 'have', 'has', 'do', 'does', 'can', 'will'].map(stem));

export function matchOfficialAnswer(said, officialAnswer, { extra = [], needed = 1, questionText = '' } = {}) {
  const heard = new Set(matchWords(said));
  if (heard.size === 0) return { isCorrect: false, sure: false, matched: null, found: [] };
  const found = [];
  const allowed = new Set(matchWords(questionText));
  const take = (answer, text) => {
    found.push(answer);
    matchWords(answer).forEach((w) => allowed.add(w));
    matchWords(text).forEach((w) => allowed.add(w));
  };
  for (const accepted of acceptedForMatching(officialAnswer)) {
    if (!found.includes(accepted) && covers(heard, accepted)) take(accepted, accepted);
  }
  for (const v of extra) {
    if (!found.includes(v.answer) && covers(heard, v.text)) take(v.answer, v.text);
  }
  const other = [...heard].filter((w) => !allowed.has(w));
  const flipped = other.some((w) => CHANGES_MEANING.has(w) || /^\d+$/.test(w));
  const isCorrect = !flipped && found.length >= Math.max(1, needed);
  const extraWords = other.filter((w) => !FILLER.has(w)).length;
  return { isCorrect, sure: isCorrect && extraWords <= MAX_EXTRA_WORDS, matched: isCorrect ? found[0] : null, found, extraWords };
}
