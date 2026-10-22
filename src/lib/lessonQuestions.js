// Which official civics questions belong to which lesson (Phase 4), with no
// new data: each question of a topic goes to the one lesson in that topic
// whose words (title, description, key points, text) it shares the most.
// Runs on the device; the official questions and answers are never changed.

const STOP = new Set(`a an the of to and or in on at by for from with as is are was were be been it its this that these those
what who whom which when where why how name one two three four five some any all each every other more most many much
do does did done can could should would will may might must not no yes our we you your they their them he she his her
us u s about into than then there here also only just very before after during over under why what's`.split(/\s+/));

// Lowercased words without punctuation or common words; a trailing plural
// "s" is dropped so "amendments" matches "amendment".
export function contentWords(text) {
  return (text || '')
    .toLowerCase()
    .replace(/\([^)]*(?:2008|2025)[^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOP.has(w))
    .map((w) => (w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w));
}

// Word → weight for one lesson: the title counts most, then description and
// key points, then the lesson text.
export function lessonWords(lesson) {
  const weights = new Map();
  const add = (text, weight) => {
    for (const w of new Set(contentWords(text))) weights.set(w, Math.max(weights.get(w) || 0, weight));
  };
  add(lesson?.content, 1);
  for (const point of lesson?.key_points || []) {
    add(typeof point === 'string' ? point : `${point.text || ''} ${point.definition || ''}`, 2);
  }
  add(lesson?.description, 2);
  add(lesson?.title, 3);
  return weights;
}

const byOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0) || String(a.title || '').localeCompare(String(b.title || '')) || String(a.id).localeCompare(String(b.id));

// Map of lesson id → that lesson's questions (in question-text order).
// Words found in every lesson of the topic don't help choose, so they are
// ignored. Ties (and questions that match nothing) go to the lesson with the
// fewest questions so far, then the earlier lesson.
export function assignQuestions(topicLessons, questions) {
  const lessons = [...(topicLessons || [])].sort(byOrder);
  const result = new Map(lessons.map((l) => [l.id, []]));
  if (lessons.length === 0) return result;
  const bags = lessons.map(lessonWords);
  const everywhere = new Set(
    lessons.length > 1 ? [...bags[0].keys()].filter((w) => bags.every((bag) => bag.has(w))) : [],
  );
  const sorted = [...(questions || [])].sort((a, b) => String(a.question).localeCompare(String(b.question)));
  for (const q of sorted) {
    const words = new Set(contentWords(`${q.question} ${q.answer || ''}`).filter((w) => !everywhere.has(w)));
    let best = 0;
    let bestScore = -1;
    lessons.forEach((lesson, i) => {
      let score = 0;
      for (const w of words) score += bags[i].get(w) || 0;
      const fewer = result.get(lesson.id).length < result.get(lessons[best].id).length;
      if (score > bestScore || (score === bestScore && fewer)) {
        best = i;
        bestScore = score;
      }
    });
    result.get(lessons[best].id).push(q);
  }
  return result;
}

// The questions for one lesson, from all lessons and that topic's questions.
export function questionsForLesson(lesson, allLessons, topicQuestions) {
  if (!lesson) return [];
  const topicLessons = (allLessons || []).filter((l) => l.topic === lesson.topic);
  if (!topicLessons.some((l) => l.id === lesson.id)) topicLessons.push(lesson);
  return assignQuestions(topicLessons, topicQuestions).get(lesson.id) || [];
}
