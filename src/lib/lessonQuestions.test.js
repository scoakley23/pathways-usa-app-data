import { describe, it, expect } from 'vitest';
import { assignQuestions, contentWords, questionsForLesson } from './lessonQuestions';

const lessons = [
  { id: 'l1', topic: 'System of Government', order: 1, title: 'Congress', content: 'Congress makes federal laws. The Senate and the House of Representatives.', key_points: [{ text: 'Senators serve six years' }] },
  { id: 'l2', topic: 'System of Government', order: 2, title: 'The President', content: 'The President is in charge of the executive branch and signs bills.' },
  { id: 'l3', topic: 'System of Government', order: 3, title: 'The courts', content: 'The Supreme Court and the federal courts review laws.' },
];
const q = (question, answer) => ({ id: question, question, answer });
const questions = [
  q('How many U.S. senators are there?', 'One hundred (100)'),
  q('Who signs bills to become laws?', 'The President'),
  q('How many justices are on the Supreme Court?', 'Nine (9)'),
  q('Who makes federal laws?', 'Congress'),
  q('What is something unrelated?', 'Nothing here'),
];

describe('contentWords', () => {
  it('drops common words, punctuation and plural s', () => {
    expect(contentWords('How many U.S. senators are there?')).toEqual(['senator']);
    expect(contentWords('Name one of the amendments (2025 test).')).toEqual(['amendment']);
  });
});

describe('assignQuestions', () => {
  it('puts each question in the lesson that shares its words', () => {
    const map = assignQuestions(lessons, questions);
    expect(map.get('l1').map((x) => x.answer)).toContain('One hundred (100)');
    expect(map.get('l1').map((x) => x.answer)).toContain('Congress');
    expect(map.get('l2').map((x) => x.answer)).toContain('The President');
    expect(map.get('l3').map((x) => x.answer)).toContain('Nine (9)');
  });
  it('gives every question to exactly one lesson, unmatched ones to the emptiest', () => {
    const map = assignQuestions(lessons, questions);
    const all = [...map.values()].flat();
    expect(all).toHaveLength(questions.length);
    expect(new Set(all.map((x) => x.id)).size).toBe(questions.length);
  });
  it('is deterministic whatever order the lessons and questions come in', () => {
    const a = assignQuestions(lessons, questions);
    const b = assignQuestions([...lessons].reverse(), [...questions].reverse());
    for (const l of lessons) expect(b.get(l.id).map((x) => x.id)).toEqual(a.get(l.id).map((x) => x.id));
  });
  it('handles a single lesson or no questions', () => {
    expect(assignQuestions([lessons[0]], questions).get('l1')).toHaveLength(questions.length);
    expect(assignQuestions(lessons, []).get('l2')).toEqual([]);
    expect(assignQuestions([], questions).size).toBe(0);
  });
});

describe('questionsForLesson', () => {
  it('uses only lessons of the same topic', () => {
    const other = { id: 'x', topic: 'U.S. History', title: 'Congress history', content: 'Congress senators' };
    expect(questionsForLesson(lessons[0], [...lessons, other], questions).map((x) => x.answer)).toContain('Congress');
    expect(questionsForLesson(null, lessons, questions)).toEqual([]);
  });
});
