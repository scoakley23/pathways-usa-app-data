import { describe, it, expect } from 'vitest';
import { buildDemoLesson } from './demoLesson';
import { STEP_TYPES } from './tutorLesson';

const bank = [
  { id: '1', version: '2025', question: 'What is the supreme law of the United States?', answer: '(U.S.) Constitution' },
  { id: '2', version: '2025', question: 'What does the Constitution do?', answer: 'Forms the government; Defines powers of government; Protects the rights of the people' },
  { id: '3', version: '2008', question: 'What is the supreme law of the land?', answer: 'the Constitution' },
  { id: '4', version: '2025', question: 'Name one branch of government.', answer: 'Legislative; Executive; Judicial' },
];

describe('buildDemoLesson', () => {
  it('builds a 9-step lesson from the two 2025 demo questions', () => {
    const lesson = buildDemoLesson(bank, 'es');
    expect(lesson.steps).toHaveLength(9);
    for (const s of lesson.steps) expect(STEP_TYPES).toContain(s.type);
    const qs = lesson.steps.filter((s) => s.question).map((s) => s.question.id);
    expect(new Set(qs)).toEqual(new Set(['1', '2']));
  });

  it('takes every correct answer from the official answer, never from demo text', () => {
    const lesson = buildDemoLesson(bank);
    const checks = lesson.steps.filter((s) => s.type === 'check-understanding');
    expect(checks.map((c) => c.correct)).toEqual(['(U.S.) Constitution', 'Forms the government']);
    for (const c of checks) expect(c.options).toContain(c.correct);
  });

  it('shows Spanish only for Spanish learners', () => {
    expect(buildDemoLesson(bank, 'es').steps[0].text.mine).toMatch(/Constitución/);
    expect(buildDemoLesson(bank, 'vi').steps[0].text.mine).toBeNull();
  });

  it('falls back to the first two 2025 questions with "coming soon"', () => {
    const lesson = buildDemoLesson([bank[3], { ...bank[3], id: '5' }]);
    expect(lesson.steps).toHaveLength(6);
    expect(lesson.steps[0].text.en).toBe('Explanation coming soon.');
    expect(lesson.steps.some((s) => s.type === 'check-understanding')).toBe(false);
  });

  it('ignores 2008 questions', () => {
    const lesson = buildDemoLesson([bank[2]]);
    expect(lesson.steps).toHaveLength(0);
  });
});
