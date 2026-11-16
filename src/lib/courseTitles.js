// Course titles in the learner's language (Prompt 13): unit, section, lesson
// and stop titles and unit descriptions go through the translation pack
// (src/lib/translationSources.js, set "course-titles"); English when the pack
// doesn't have a line. Never live AI. Ids never change, so the journey's
// logic is the same in every language. Official questions and the Read it /
// Write it sentences are not titles and stay in English.

/** Every title and description in the course, for the translation pack's sources. */
export function courseTitleTexts(units) {
  return units.flatMap((u) => [
    u.title,
    u.description,
    ...u.sections.flatMap((s) => [
      s.title,
      ...(s.lessons || []).map((l) => l.title),
      ...(s.stops || []).filter((st) => st.type !== 'lesson').map((st) => st.title),
    ]),
  ]).filter((t) => typeof t === 'string' && t.trim());
}

/** The same course with titles looked up by `tx(english)` (returns English when missing). */
export function translateCourse(units, tx) {
  if (!tx) return units;
  const lesson = (l) => ({ ...l, title: tx(l.title) });
  return units.map((u) => ({
    ...u,
    title: tx(u.title),
    description: u.description ? tx(u.description) : u.description,
    sections: u.sections.map((s) => ({
      ...s,
      title: tx(s.title),
      lessons: (s.lessons || []).map(lesson),
      stops: (s.stops || []).map((st) => ({ ...st, title: st.title ? tx(st.title) : st.title, lesson: st.lesson ? lesson(st.lesson) : st.lesson })),
    })),
  }));
}
