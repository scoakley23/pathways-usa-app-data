import { describe, it, expect } from 'vitest';
import { pickCivicsQuestions, buildPretestLesson, levelFor, scorePretest, toSavedLevels, mergeLevels, PRETEST_PARTS } from './pretest';

const civics = [
  ...Array.from({ length: 15 }, (_, i) => ({ version: '2025', question: `Q${i}?`, answer: `A${i}` })),
  { version: '2025', question: 'Who is the President now?', answer: 'Answers change. Visit uscis.gov/citizenship/testupdates' },
  { version: '2025', question: "Who is your state's governor?", answer: 'Answers vary' },
  { version: '2008', question: 'Old?', answer: 'Old' },
  { version: '2025', question: 'Q0?', answer: 'A0 duplicate' },
];
const sources = {
  civics,
  reading: [{ text: 'Who was the first President?' }, { text: 'What is the capital?' }, { text: 'Who lived here?' }, { text: 'Where is Congress?' }],
  writing: [{ text: 'Washington was the first President.' }, { text: 'Congress meets in Washington, D.C.' }, { text: 'We vote.' }],
  speaking: [
    { section: 'small_talk', question: 'How are you today?' },
    { section: 'small_talk', question: 'How did you get here today?' },
    { section: 'small_talk', question: 'Is it cold outside?' },
    { section: 'personal_info', question: 'What is your name?' },
  ],
};

describe('pickCivicsQuestions', () => {
  it('picks 10 unique 2025 questions without changing or local answers', () => {
    const picked = pickCivicsQuestions(civics);
    expect(picked).toHaveLength(10);
    expect(new Set(picked.map((q) => q.question)).size).toBe(10);
    for (const q of picked) {
      expect(q.version).toBe('2025');
      expect(q.answer).not.toMatch(/^Answers (change|vary)/);
    }
  });
});

describe('buildPretestLesson', () => {
  const lesson = buildPretestLesson(sources, 'es');

  it('has four parts in order, each opening with an intro', () => {
    const parts = lesson.steps.filter((s) => s.type === 'part-intro').map((s) => s.part);
    expect(parts).toEqual(PRETEST_PARTS);
    expect(lesson.skippableParts).toBe(true);
  });

  it('has 10 civics, 3 reading, 3 writing, and 2 small-talk steps, all in check mode', () => {
    const count = (part) => lesson.steps.filter((s) => s.part === part && s.type !== 'part-intro').length;
    expect([count('civics'), count('reading'), count('writing'), count('speaking')]).toEqual([10, 3, 3, 2]);
    for (const s of lesson.steps.filter((x) => x.type !== 'part-intro')) expect(s.mode).toBe('check');
    for (const s of lesson.steps.filter((x) => x.part === 'speaking' && x.question)) expect(s.question.section).toBe('small_talk');
  });

  it('includes Spanish intros only for Spanish learners', () => {
    expect(lesson.steps[0].text.mine).toMatch(/Primero/);
    expect(buildPretestLesson(sources, 'vi').steps[0].text.mine).toBeNull();
  });

  it('leaves out a part with no content', () => {
    const l = buildPretestLesson({ ...sources, reading: [] });
    expect(l.steps.some((s) => s.part === 'reading')).toBe(false);
  });
});

describe('levelFor', () => {
  const right = (n, total) => Array.from({ length: total }, (_, i) => ({ correct: i < n }));

  it('civics: 8+ of 10 strong, 5–7 getting there, 4 or fewer start here', () => {
    expect(levelFor('civics', right(8, 10))).toBe('strong');
    expect(levelFor('civics', right(7, 10))).toBe('getting_there');
    expect(levelFor('civics', right(5, 10))).toBe('getting_there');
    expect(levelFor('civics', right(4, 10))).toBe('start_here');
  });

  it('reading and writing: 3 of 3 strong, 2 getting there, 0–1 start here', () => {
    for (const part of ['reading', 'writing']) {
      expect(levelFor(part, right(3, 3))).toBe('strong');
      expect(levelFor(part, right(2, 3))).toBe('getting_there');
      expect(levelFor(part, right(1, 3))).toBe('start_here');
      expect(levelFor(part, right(0, 3))).toBe('start_here');
    }
  });

  it('speaking: average 80+ strong, 60–79 getting there, under 60 start here', () => {
    expect(levelFor('speaking', [{ score: 90 }, { score: 70 }])).toBe('strong');
    expect(levelFor('speaking', [{ score: 70 }, { score: 60 }])).toBe('getting_there');
    expect(levelFor('speaking', [{ score: 50 }, { score: 60 }])).toBe('start_here');
  });

  it('returns null when nothing was answered', () => {
    expect(levelFor('civics', [])).toBeNull();
  });
});

describe('scorePretest', () => {
  const lesson = buildPretestLesson(sources, 'en', () => 0.5);
  const indexes = (part) => lesson.steps.map((s, i) => (s.part === part && s.type !== 'part-intro' ? i : -1)).filter((i) => i >= 0);

  it('scores each part and leaves skipped parts as not checked', () => {
    const states = {};
    indexes('civics').forEach((i, k) => { states[i] = { outcome: { correct: k < 9 } }; });
    indexes('writing').forEach((i, k) => { states[i] = { outcome: { correct: k < 2 } }; });
    indexes('speaking').forEach((i) => { states[i] = { outcome: { score: 55 } }; });
    const levels = scorePretest(lesson, states, new Set(['reading']));
    expect(levels).toEqual({ civics: 'strong', reading: null, writing: 'getting_there', speaking: 'start_here' });
  });

  it('counts unanswered steps in a started part as not correct', () => {
    const states = { [indexes('writing')[0]]: { outcome: { correct: true } } };
    expect(scorePretest(lesson, states).writing).toBe('start_here');
  });
});

describe('toSavedLevels', () => {
  it('keeps only the four levels and a date', () => {
    const saved = toSavedLevels({ civics: 'strong', reading: null, writing: 'bogus', speaking: 'start_here', answers: ['x'] }, new Date('2026-10-21T00:00:00Z'));
    expect(saved).toEqual({ civics: 'strong', reading: null, writing: null, speaking: 'start_here', checked_at: '2026-10-21T00:00:00.000Z' });
  });
});

describe('partial re-check', () => {
  it('builds only the requested part', () => {
    const l = buildPretestLesson(sources, 'en', undefined, ['speaking']);
    expect(new Set(l.steps.map((s) => s.part))).toEqual(new Set(['speaking']));
  });
  it('keeps earlier levels for skills not re-checked', () => {
    expect(mergeLevels({ civics: 'strong', reading: 'start_here', writing: null, speaking: 'start_here' }, { speaking: 'getting_there', civics: null }, ['speaking']))
      .toEqual({ civics: 'strong', reading: 'start_here', writing: null, speaking: 'getting_there' });
  });
});
