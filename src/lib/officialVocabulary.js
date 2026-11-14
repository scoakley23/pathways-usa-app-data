// The official USCIS reading and writing vocabulary lists (content/vocab/,
// copied from the USCIS PDFs by scripts/vocab/extract_vocabulary.py, never
// retyped). Read it sentences may use only reading-list words; Write it
// sentences only writing-list words. Word forms count exactly as listed:
// "Senators" allows "senators", not "senator"; "elects" is on the reading
// list and "elect" on the writing list.
import readingList from '../../content/vocab/reading-vocabulary.json';
import writingList from '../../content/vocab/writing-vocabulary.json';

const APOSTROPHES = /[‘’ʼ]/g;

// One entry ("is/are/was/be", "Washington, D.C.", "Bill of Rights") → its
// words, lower case.
export function entryWords(entry) {
  return String(entry)
    .replace(APOSTROPHES, "'")
    .toLowerCase()
    .split(/[\s/,]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function wordSet(list) {
  const set = new Set();
  for (const c of list.categories) for (const e of c.entries) for (const w of entryWords(e)) set.add(w);
  return set;
}

export const READING_WORDS = wordSet(readingList);
export const WRITING_WORDS = wordSet(writingList);

// A sentence → its words, lower case, without the punctuation around them.
// Dots inside a word stay ("D.C.", "U.S."); a sentence's final period is
// dropped unless the word is listed with it.
export function sentenceWords(sentence, allowed = new Set()) {
  return String(sentence)
    .replace(APOSTROPHES, "'")
    .split(/\s+/)
    .map((raw) => {
      const w = raw.toLowerCase().replace(/^["'(]+/, '').replace(/[,?!;:"')]+$/, '');
      if (allowed.has(w)) return w;
      return w.replace(/\.+$/, '');
    })
    .filter(Boolean);
}

// Words in `sentence` that are not on `list` (a Set). [] means the sentence
// uses only listed words.
export function wordsNotOnList(sentence, list) {
  return sentenceWords(sentence, list).filter((w) => !list.has(w));
}
