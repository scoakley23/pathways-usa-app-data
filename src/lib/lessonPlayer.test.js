import { describe, it, expect } from 'vitest';
import { STEPS, starsFor, stepsDone, nextStepIndex, progressRow, wordBank, checkWriting, readingWords, missedQuestions } from './lessonPlayer';
import { UNITS, questionRecord } from './course';
import { wordsNotOnList, WRITING_WORDS } from './officialVocabulary';

const all = { listen: 'right', teachBack: 'right', readIt: 'right', writeIt: 'right', officer: 'right' };

describe('stars', () => {
  it('finishing all 5 steps right gives 3 stars', () => {
    expect(STEPS).toEqual(['listen', 'teachBack', 'readIt', 'writeIt', 'officer']);
    expect(starsFor(all)).toBe(3);
  });
  it('one star each for Teach it back, Read it + Write it, and the Officer question', () => {
    expect(starsFor({ ...all, teachBack: 'skipped' })).toBe(2);
    expect(starsFor({ ...all, writeIt: 'skipped' })).toBe(2);
    expect(starsFor({ ...all, readIt: 'skipped', writeIt: 'skipped' })).toBe(2);
    expect(starsFor({ ...all, officer: 'unchecked' })).toBe(2); // can't be checked: no star, not wrong
    expect(starsFor({ listen: 'right' })).toBe(0);
  });
  it('counts steps done and where to continue', () => {
    expect(stepsDone({ listen: 'right', teachBack: 'skipped' })).toBe(2);
    expect(nextStepIndex({ listen: 'right', teachBack: 'skipped' })).toBe(2);
    expect(nextStepIndex(all)).toBe(5);
  });
});

describe('the saved row (lesson_progress)', () => {
  const now = new Date('2026-11-15T15:00:00Z');
  it('a finished run saves steps, stars and when it was finished', () => {
    expect(progressRow('u2-s2-l3', all, null, now)).toEqual({ lesson_id: 'u2-s2-l3', steps_done: 5, stars: 3, completed: true, completed_at: '2026-11-15T15:00:00.000Z' });
  });
  it('a partial run saves the steps done, not finished', () => {
    expect(progressRow('l', { listen: 'right', teachBack: 'right' }, null, now)).toEqual({ lesson_id: 'l', steps_done: 2, stars: 1, completed: false, completed_at: null });
  });
  it('a replay never lowers stars or steps and keeps the first finish date', () => {
    const existing = { steps_done: 5, stars: 3, completed: true, completed_at: '2026-11-01T10:00:00.000Z' };
    expect(progressRow('l', { ...all, officer: 'skipped' }, existing, now)).toEqual({ lesson_id: 'l', steps_done: 5, stars: 3, completed: true, completed_at: '2026-11-01T10:00:00.000Z' });
  });
  it('holds only steps and stars: nothing the learner said', () => {
    expect(Object.keys(progressRow('l', all, null, now)).sort()).toEqual(['completed', 'completed_at', 'lesson_id', 'stars', 'steps_done']);
  });
});

describe('Write it', () => {
  const sentence = 'The people elect Congress.';
  it('level 1: the word bank has the sentence words and the extra words, not in order', () => {
    const bank = wordBank(sentence, ['vote', 'meets']);
    expect(bank.map((b) => b.word).sort()).toEqual(['Congress.', 'The', 'elect', 'meets', 'people', 'vote'].sort());
    expect(bank.slice(0, 4).map((b) => b.word).join(' ')).not.toBe(sentence);
    expect(new Set(bank.map((b) => b.id)).size).toBe(bank.length);
  });
  it('every lesson’s word bank uses writing-list words only', () => {
    for (const u of UNITS) for (const s of u.sections) for (const l of s.lessons || []) {
      for (const tile of wordBank(l.steps.writeIt.sentence, l.steps.writeIt.distractorWords)) {
        expect(wordsNotOnList(tile.word, WRITING_WORDS), `${l.id}: ${tile.word}`).toEqual([]);
      }
    }
  });
  it('checks with the dictation rule and gives gentle fixes', () => {
    expect(checkWriting(sentence, 'The people elect Congress.')).toMatchObject({ isCorrect: true, fixes: [] });
    expect(checkWriting(sentence, 'the people elect congress')).toMatchObject({ isCorrect: true, fixes: ['capital', 'period'] });
    expect(checkWriting(sentence, 'The people vote Congress.').isCorrect).toBe(false);
  });
});

describe('Read it', () => {
  it('words turn green as they are read; pass at 70%', () => {
    const r = readingWords('Who elects Congress?', 'who elects');
    expect(r.words.map((w) => w.status)).toEqual(['correct', 'correct', 'missing']);
    expect(r.passed).toBe(false);
    expect(readingWords('Who elects Congress?', 'who elects congress').passed).toBe(true);
  });
});

describe('the lessons’ questions', () => {
  it('every Teach it back and Officer question has its official record', () => {
    for (const u of UNITS) for (const s of u.sections) for (const l of s.lessons || []) {
      for (const id of [l.steps.teachBack.questionId, l.steps.officer.questionId]) {
        const q = questionRecord(id);
        expect(q?.question && q?.answer, `${l.id}: ${id}`).toBeTruthy();
      }
    }
  });
  it('a missed question goes to review once', () => {
    expect(missedQuestions(['q1', 'q1', null, 'q2'])).toEqual(['q1', 'q2']);
  });
});
