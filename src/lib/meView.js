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

// Light fills take turns so navy text stays readable on them (gold, sky).
const FILLS = ['gold', 'sky'];

/** One block per unit with test questions: done / total / percent, and its fill color. */
export function topicBlocks(course = [], masteredIds = new Set()) {
  return course
    .map((u) => ({ unit: u, ...unitQuestionsDone(u, masteredIds) }))
    .filter((b) => b.total > 0)
    .map((b, i) => ({
      id: b.unit.id,
      title: b.unit.title,
      done: b.done,
      total: b.total,
      pct: Math.round((b.done / b.total) * 100),
      complete: b.done >= b.total,
      fill: FILLS[i % FILLS.length],
    }));
}
