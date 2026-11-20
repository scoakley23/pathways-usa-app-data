// The Interview tab (Prompt 10): "Are you ready?" tiles, the last practice
// scores, and the practice interview report's parts. Pure functions over what
// the app already saves (quick-check levels, mastered civics questions,
// InterviewSession scores) and, for the report, the results kept in memory
// for that interview. Nothing new is saved.

// The practice interview's parts, in the order it asks them.
export const INTERVIEW_PARTS = [
  { id: 'small_talk', label: 'Small talk' },
  { id: 'personal_info', label: 'N-400 questions about you' },
  { id: 'morals_ethics', label: '"Have you ever…" questions' },
  { id: 'oath_requirements', label: 'Swearing in' },
  // Only in a unit practice interview (Prompt 8): that unit's test questions.
  { id: 'civics', label: 'Civics questions' },
];

// What to practice next, per part. Never how to answer a question about the
// learner's own history: the "Have you ever…" tip is about understanding the
// question, with the lawyer line (CLAUDE.md, Legal and content).
export const WORK_ON_NEXT = {
  small_talk: { tip: 'Answer in a full sentence, in English.', link: '/study?tab=practice&mode=interview', linkLabel: 'Practice again' },
  personal_info: { tip: 'Practice saying what each N-400 question asks.', link: '/n400-guide', linkLabel: 'Practice in the N-400 guide' },
  morals_ethics: { tip: 'Practice what each question asks, so you understand the officer. If "yes" might be true for you, talk to a lawyer first.', link: '/n400-guide', linkLabel: 'Practice in the N-400 guide' },
  oath_requirements: { tip: 'Practice what the swearing-in questions mean.', link: '/n400-guide', linkLabel: 'Practice in the N-400 guide' },
  civics: { tip: 'Go over this unit’s lessons again.', link: '/course', linkLabel: 'Open the course' },
};

const byDate = (rows) => [...rows].sort((a, b) => String(a.created_date || '').localeCompare(String(b.created_date || '')));
const scored = (sessions) => byDate(sessions.filter((s) => Number(s?.question_count) > 0));

/**
 * The four "Are you ready?" tiles.
 * levels: quick-check levels (User.skill_levels: strong | getting_there | start_here)
 * sessions: saved InterviewSession rows; civicsMastered / civicsTotal: counts.
 * Reading, writing and civics are ready at the quick check's "strong" level;
 * speaking when the latest practice interview passed.
 */
export function readinessTiles({ levels = null, sessions = [], civicsMastered = 0, civicsTotal = 128 } = {}) {
  const level = (part) => levels?.[part] || null;
  const latest = byDate(sessions.filter((s) => typeof s?.overall_score === 'number')).pop() || null;
  const tiles = [
    { id: 'reading', label: 'Reading', kind: 'level', level: level('reading'), ready: level('reading') === 'strong' },
    { id: 'writing', label: 'Writing', kind: 'level', level: level('writing'), ready: level('writing') === 'strong' },
    { id: 'speaking', label: 'Speaking', kind: 'percent', value: latest ? Math.round(latest.overall_score) : null, ready: !!latest?.passed },
    { id: 'civics', label: 'Civics', kind: 'count', value: civicsMastered, total: civicsTotal, ready: level('civics') === 'strong' },
  ];
  return { tiles, readyCount: tiles.filter((t) => t.ready).length };
}

/**
 * The Interview tab's "n of 5 parts of the interview ready" (Amio v2, frame
 * Interview): N-400 · Speaking · Reading · Writing · Civics.
 * - N-400: every N-400 guide section read (`n400Read` of `n400Total`).
 * - Speaking: the latest practice interview passed (as Today's Speaking tile).
 * - Reading, Writing, Civics: the quick check's "strong" level (as before).
 */
export const READY_PARTS = ['n400', 'speaking', 'reading', 'writing', 'civics'];
export function readyParts({ levels = null, sessions = [], n400Read = 0, n400Total = 7 } = {}) {
  const level = (part) => levels?.[part] || null;
  const latest = byDate(sessions.filter((s) => typeof s?.overall_score === 'number')).pop() || null;
  const ready = {
    n400: n400Total > 0 && n400Read >= n400Total,
    speaking: !!latest?.passed,
    reading: level('reading') === 'strong',
    writing: level('writing') === 'strong',
    civics: level('civics') === 'strong',
  };
  const parts = READY_PARTS.map((id) => ({ id, ready: ready[id] }));
  return { parts, readyCount: parts.filter((x) => x.ready).length, total: parts.length };
}

// The last `n` practice interviews, oldest first: { passed, total }.
export function lastScores(sessions = [], n = 4) {
  return scored(sessions).slice(-n).map((s) => ({ passed: Number(s.passed_count) || 0, total: Number(s.question_count) }));
}

// True when `passed` of `total` is at least as good as every saved interview
// before this one (as a share), and there was something to beat or match.
export function isBestSoFar(passed, total, previous = []) {
  if (!total) return false;
  const share = passed / total;
  return scored(previous).every((s) => share >= (Number(s.passed_count) || 0) / Number(s.question_count));
}

// The report's rows: one per part the interview asked, in order.
export function reportParts(results = []) {
  return INTERVIEW_PARTS
    .map((p) => {
      const rows = results.filter((r) => r.section === p.id);
      const passed = rows.filter((r) => r.is_acceptable).length;
      return { ...p, passed, total: rows.length, ready: rows.length > 0 && passed === rows.length };
    })
    .filter((p) => p.total > 0);
}

// The weakest part (lowest share passed; the earlier part on a tie), with
// its tip; null when every part is ready.
export function workOnNext(parts = []) {
  const notReady = parts.filter((p) => !p.ready);
  if (!notReady.length) return null;
  const weakest = notReady.reduce((a, b) => (b.passed / b.total < a.passed / a.total ? b : a));
  return { ...weakest, ...WORK_ON_NEXT[weakest.id] };
}
