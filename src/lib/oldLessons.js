// The old Lessons tab's lessons (Base44 Lesson ids) and the Course lesson each
// one now points to (content/course/old-lessons.json). Saved data is never
// rewritten: a learner's old notes stay under the old id and are shown,
// read-only, under the Course lesson.
import map from '../../content/course/old-lessons.json';

export const OLD_LESSONS = map.lessons;

/** The Course lesson an old lesson id points to, or null. */
export function courseLessonForOld(oldId) {
  return OLD_LESSONS[oldId]?.courseLessonId || null;
}

/** Old lesson ids (with titles) that point to a Course lesson. */
export function oldLessonsFor(courseLessonId) {
  return Object.entries(OLD_LESSONS)
    .filter(([, l]) => l.courseLessonId === courseLessonId)
    .map(([id, l]) => ({ id, title: l.title }));
}

/** A learner's old notes (rows from lessonNotes.list()) for a Course lesson. */
export function olderNotesFor(courseLessonId, notes = []) {
  const old = new Map(oldLessonsFor(courseLessonId).map((l) => [l.id, l.title]));
  return notes
    .filter((n) => old.has(n.lesson_id) && String(n.content || '').trim())
    .map((n) => ({ id: n.id, title: n.lesson_title || old.get(n.lesson_id), content: n.content }));
}
