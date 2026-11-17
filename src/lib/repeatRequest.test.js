// Asking the officer to repeat is not an answer. Fake replies only.
import { describe, it, expect } from 'vitest';
import { isRepeatRequest } from './repeatRequest';

describe('isRepeatRequest', () => {
  it.each([
    'can you please say that again?',
    'Can you repeat the question please',
    'Could you repeat that, please?',
    'would you say it again',
    'repeat please',
    'Please repeat the question.',
    'say that again',
    'one more time, please',
    'Sorry?',
    'pardon',
    'Pardon me, officer',
    'I beg your pardon',
    'excuse me?',
    'what?',
    'What was the question?',
    'what did you say',
    "Sorry, I didn't understand",
    "I didn't hear you",
    "I don't understand the question",
    "sorry I didn't catch that, can you repeat it",
    "I'm sorry, could you say it more slowly",
    'can I hear the question again',
    'come again?',
    'um repeat the question please sir',
    'Can you repeat the question, ma’am?',
  ])('"%s" asks to repeat', (reply) => {
    expect(isRepeatRequest(reply)).toBe(true);
  });

  it.each([
    'the Constitution',
    'can you repeat the question please the Constitution',
    'say the Constitution',
    'I don\'t know',
    'the right to repeat',
    'freedom of speech',
    'what is the Constitution',
    'yes',
    'sorry I don\'t know the answer',
    'no',
    '',
    '   ',
    'everyone must follow the law',
    'I came here by bus',
    'I understand the question, it asks if I was arrested',
  ])('"%s" is an answer (graded as usual)', (reply) => {
    expect(isRepeatRequest(reply)).toBe(false);
  });
});

describe('never swallows a real answer', () => {
  it('no official civics answer (2008 or 2025) looks like a request to repeat', async () => {
    const lists = [
      (await import('../../content/base44-export/civics-questions-2008.json')).default,
      (await import('../../content/base44-export/civics-questions-2025.json')).default,
    ];
    const answers = lists.flat().flatMap((q) => String(q.answer).split(/[/;\n]/));
    expect(answers.length).toBeGreaterThan(200);
    expect(answers.filter((a) => isRepeatRequest(a))).toEqual([]);
  });

  it('the civics grading eval has no "please repeat" cases (the phone handles those)', async () => {
    const { cases } = (await import('../../scripts/evals/civics-grading/cases.json')).default;
    expect(cases.filter((c) => isRepeatRequest(c.answer)).map((c) => c.id)).toEqual([]);
  });
});
