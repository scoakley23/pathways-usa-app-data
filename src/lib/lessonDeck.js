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

// The lesson to suggest at the top of /Lessons: one worth going over again
// (low score last time) first, then one already started, then the first one
// not started, in lesson order. Returns { lesson, reason } or null when every
// lesson is done. `progress` = LessonProgress records.
export function nextLesson(lessons = [], progress = []) {
  const byId = new Map(progress.map((p) => [p.lesson_id, p]));
  const review = lessons.find((l) => byId.get(l.id)?.needs_review);
  if (review) return { lesson: review, reason: 'review' };
  const started = lessons.find((l) => byId.get(l.id) && !byId.get(l.id).completed);
  if (started) return { lesson: started, reason: 'continue' };
  const fresh = lessons.find((l) => !byId.get(l.id));
  if (fresh) return { lesson: fresh, reason: 'start' };
  return null;
}
