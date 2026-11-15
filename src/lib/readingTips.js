// The tip after a Read it attempt, chosen on the device (Step 4: no AI).
// Reviewed per-word tips come from content/vocab/reading-tips.json; otherwise
// one of the fixed lines below, by what happened. The score never depends on
// the tip. readingTipParts() gives the English line with its {word} / {words}
// placeholders still in it, so the translation pack can translate the line
// and the missed (English) words are filled in afterwards (useReadingTip()).
import TIPS_FILE from '../../content/vocab/reading-tips.json';

export const READING_TIP_LINES = {
  allRight: 'You read every word. Keep a steady, natural pace.',
  noneMatched: 'We didn\'t hear the words of this sentence. Read it slowly, one word at a time.',
  oneMissed: 'Almost there. Say "{word}" slowly and clearly.',
  someMissed: 'Look at the words we didn\'t hear: {words}. Say each one slowly, then read the sentence again.',
  extraWords: 'Read only the words in the sentence, one at a time.',
};

// Lowercase letters only: "Presidents’" → "presidents", "U.S." → "us".
export const tipKey = (word) => String(word || '').toLowerCase().replace(/[^a-z]/g, '');

// Reviewed tips only (drafts are never shown to learners).
export function reviewedTips(file = TIPS_FILE) {
  return Object.fromEntries(
    Object.entries(file?.tips || {})
      .filter(([, t]) => t?.status === 'reviewed' && typeof t.tip === 'string' && t.tip.trim())
      .map(([word, t]) => [tipKey(word), t.tip.trim()]),
  );
}

// Other reading-card lines that go with the tip (in the translation pack).
export const READING_CARD_LINES = {
  tip: 'Tip:',
  noSpeech: "We couldn't detect any speech. Make sure your microphone is working and speak clearly into it.",
  saidInYourLanguage: 'Said in your language',
};

export const fillTip = (line, values = {}) => String(line || '').replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');

// diff = wordDiff(sentence, transcript) → { line, values }: the English line
// (placeholders kept) and the English words to put in them.
export function readingTipParts(diff, { tips = reviewedTips() } = {}) {
  const words = diff?.words || [];
  const missed = words.filter((w) => w.status === 'missing').map((w) => w.word);
  if (!words.length || missed.length === words.length) return { line: READING_TIP_LINES.noneMatched, values: {} };
  if (!missed.length) {
    return { line: (diff.spokenWordCount || 0) > words.length ? READING_TIP_LINES.extraWords : READING_TIP_LINES.allRight, values: {} };
  }
  const withTip = missed.find((w) => tips[tipKey(w)]);
  if (withTip) return { line: tips[tipKey(withTip)], values: {} };
  if (missed.length === 1) return { line: READING_TIP_LINES.oneMissed, values: { word: missed[0] } };
  return { line: READING_TIP_LINES.someMissed, values: { words: missed.map((w) => `"${w}"`).join(', ') } };
}

// One short English line.
export function readingTip(diff, options) {
  const { line, values } = readingTipParts(diff, options);
  return fillTip(line, values);
}

// Every English line a tip can be built from (for the translation pack):
// the fixed lines, the card's lines, and the word tips (drafts too, so they
// are ready when reviewed).
export function readingTipSources(file = TIPS_FILE) {
  return [
    ...Object.values(READING_TIP_LINES),
    ...Object.values(READING_CARD_LINES),
    ...Object.values(file?.tips || {}).map((t) => t?.tip).filter(Boolean),
  ];
}
