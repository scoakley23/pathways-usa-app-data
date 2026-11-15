// The tip after a Read it attempt, chosen on the device (Step 4: no AI).
// Reviewed per-word tips come from content/vocab/reading-tips.json; otherwise
// one of the fixed lines below, by what happened. The score never depends on
// the tip.
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

const fill = (line, values) => line.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');

// diff = wordDiff(sentence, transcript). Returns one short English line.
export function readingTip(diff, { tips = reviewedTips() } = {}) {
  const words = diff?.words || [];
  const missed = words.filter((w) => w.status === 'missing').map((w) => w.word);
  if (!words.length || missed.length === words.length) return READING_TIP_LINES.noneMatched;
  if (!missed.length) {
    return (diff.spokenWordCount || 0) > words.length ? READING_TIP_LINES.extraWords : READING_TIP_LINES.allRight;
  }
  const withTip = missed.find((w) => tips[tipKey(w)]);
  if (withTip) return tips[tipKey(withTip)];
  if (missed.length === 1) return fill(READING_TIP_LINES.oneMissed, { word: missed[0] });
  return fill(READING_TIP_LINES.someMissed, { words: missed.map((w) => `"${w}"`).join(', ') });
}
