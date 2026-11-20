// Me (Amio v2, frame Me): the path from 0 to 128 civics questions with
// milestones, and one block per topic (unit) that fills as its questions are
// mastered. Pure functions over civics answers mastered (user_progress, via
// useReadinessData()) and the course; nothing new is saved.
import { unitQuestionsDone } from '@/lib/journey';

export const MILESTONES = [10, 25, 50, 75, 100, 128];

/** Where the learner is on the path: percent along, and each milestone reached or not. */
export function pathView(mastered = 0, total = 128) {
  const n = Math.max(0, Math.min(Number(mastered) || 0, total));
  const marks = MILESTONES.filter((m) => m <= total).map((m) => ({ at: m, pct: (m / total) * 100, reached: n >= m }));
  return { n, total, pct: total ? (n / total) * 100 : 0, marks, next: marks.find((m) => !m.reached)?.at ?? null };
}

// Each topic keeps one colour, in turn: gold, sky, denim (by its place in the
// course), with the pale version as the block and the colour filling it with
// the percent mastered. A finished topic is navy with a gold check. The
// suggested topic (Course's current unit) is the wide block, first.
export const TOPIC_TONES = ['gold', 'sky', 'denim'];

/** One block per unit with test questions: done / total / percent, tone, finished and suggested. */
export function topicBlocks(course = [], masteredIds = new Set(), { suggestedId = null } = {}) {
  const blocks = course
    .map((u, i) => ({ unit: u, index: i, ...unitQuestionsDone(u, masteredIds) }))
    .filter((b) => b.total > 0)
    .map((b) => ({
      id: b.unit.id,
      title: b.unit.title,
      done: b.done,
      total: b.total,
      pct: Math.round((b.done / b.total) * 100),
      complete: b.done >= b.total,
      tone: TOPIC_TONES[b.index % TOPIC_TONES.length],
      suggested: b.unit.id === suggestedId && b.done < b.total,
    }));
  const first = blocks.filter((b) => b.suggested);
  const rest = blocks.filter((b) => !b.suggested);
  // The last block goes wide when the others leave it alone on its row.
  return [...first, ...rest].map((b, k, all) => ({
    ...b,
    wide: b.suggested || (k === all.length - 1 && (all.length - first.length) % 2 === 1),
  }));
}
