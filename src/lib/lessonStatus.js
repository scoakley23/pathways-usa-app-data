// Lesson progress (/Dashboard): every visible Course lesson by unit, with
// its status from the saved course progress (courseProgress.load()):
// finished = completed, started = at least one step done, else not started.
// Stars are not shown (they stay saved for partner and pilot counts).

export function lessonStatusOf(p) {
  if (p?.completed) return 'completed';
  if ((p?.steps_done || 0) > 0) return 'in_progress';
  return 'not_started';
}

/** { units: [{ id, number, title, lessons: [{ id, title, status }] }], counts } */
export function lessonStatusRows(course = [], progress = {}) {
  const counts = { completed: 0, in_progress: 0, not_started: 0 };
  const units = course.map((u) => ({
    id: u.id,
    number: u.number,
    title: u.title,
    lessons: u.sections.flatMap((s) => s.lessons || []).map((l) => {
      const status = lessonStatusOf(progress[l.id]);
      counts[status] += 1;
      return { id: l.id, title: l.title, status };
    }),
  })).filter((u) => u.lessons.length > 0);
  return { units, counts };
}
