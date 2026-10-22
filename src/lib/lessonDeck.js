// A lesson as a deck of steps (Phase 4): Watch → Learn → Key words →
// Questions on the test → Go over them. Steps with nothing to show are
// skipped (no video, no flashcards, no official questions for the lesson).

export const STEP_LABELS = {
  watch: 'Watch',
  learn: 'Learn',
  words: 'Key words',
  questions: 'Questions on the test',
  review: 'Go over them',
};

export function deckSteps({ hasVideo = false, hasWords = false, hasQuestions = false } = {}) {
  return [
    hasVideo && 'watch',
    'learn',
    hasWords && 'words',
    hasQuestions && 'questions',
    hasQuestions && 'review',
  ].filter(Boolean);
}

// The lesson text (markdown) as one idea per card: paragraphs and lists split
// on blank lines, with a heading kept on the same card as what follows it.
export function splitIdeas(markdown) {
  const blocks = (markdown || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
  const ideas = [];
  let heading = null;
  for (const block of blocks) {
    if (/^#{1,6}\s/.test(block) && !block.includes('\n')) {
      heading = heading ? `${heading}\n\n${block}` : block;
      continue;
    }
    ideas.push(heading ? `${heading}\n\n${block}` : block);
    heading = null;
  }
  if (heading) ideas.push(heading);
  return ideas;
}
