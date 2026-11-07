import { describe, it, expect } from 'vitest';
import questions from '../../content/civics/questions-2025.json';
import numbers from '../../content/civics/numbers-2025.json';
import { buildAskPrompt } from './askTutor';
import {
  CIVICS_BANK_HEADER,
  CIVICS_BANK_HEADER_UNNUMBERED,
  buildCivicsBankBlock,
  loadCivicsBank,
  numbersCoverBank,
} from './civicsBank';

// Official question 30 on the 2025 test.
const Q30 = 'What is the name of the Speaker of the House of Representatives now?';
const DEFAULT_2025 = 'Use the 2025 civics test unless the learner says they are taking the 2008 test.';

describe('Ask Vía gets the official 2025 civics list', () => {
  it('builds the prompt with question 30 and the 2025 default line', async () => {
    const civics = await loadCivicsBank();
    const p = buildAskPrompt({ name: 'Ana' }, 'English', 'Who is the Speaker of the House?', { civics });
    expect(p).toContain(Q30);
    expect(p).toContain(DEFAULT_2025);
    // After the officeholder list, before the task lines and the question.
    expect(p.indexOf('OFFICIAL 2025 CIVICS TEST')).toBeGreaterThan(p.indexOf('OFFICIAL LIST'));
    expect(p.indexOf('OFFICIAL 2025 CIVICS TEST')).toBeLessThan(p.indexOf('The learner typed a question'));
  });

  it('lists every official question with its exact accepted answers', async () => {
    const { block } = await loadCivicsBank();
    for (const q of questions) expect(block).toContain(`${q.question} — ${q.answer}`);
  });

  it('loads the list once and reuses it', () => {
    expect(loadCivicsBank()).toBe(loadCivicsBank());
  });

  it('leaves the prompt unchanged when the list is not loaded', () => {
    const p = buildAskPrompt({ name: 'Ana' }, 'English', 'Hi');
    expect(p).not.toContain('OFFICIAL 2025 CIVICS TEST');
    expect(p).not.toContain(DEFAULT_2025);
  });
});

describe('question numbers and 65/20 marks', () => {
  const sample = [
    { question: 'B question?', answer: 'B answer' },
    { question: 'A question?', answer: 'A1 / A2' },
  ];

  it('without full numbers: no numbers, no stars, and Vía is not asked for numbers', () => {
    const block = buildCivicsBankBlock(sample, [{ question: 'A question?', number: 1 }]);
    expect(block.split('\n')[0]).toBe(CIVICS_BANK_HEADER_UNNUMBERED);
    expect(block).toContain('- B question? — B answer');
    expect(block).not.toMatch(/^\d+\./m);
    const p = buildAskPrompt({ name: 'Ana' }, 'English', 'Hi', { civics: { block, numbered: false } });
    expect(p).not.toContain('give its number');
    expect(p).toContain('give the accepted answers in English, exactly as written');
  });

  it('with full numbers: sorted by number, * for 65/20 questions', () => {
    const nums = [
      { question: 'A question?', number: 2, sixty_five_twenty: true },
      { question: 'B question?', number: 1, sixty_five_twenty: false },
    ];
    expect(numbersCoverBank(sample, nums)).toBe(true);
    const block = buildCivicsBankBlock(sample, nums);
    expect(block.split('\n')).toEqual([CIVICS_BANK_HEADER, '1. B question? — B answer', '2. * A question? — A1 / A2']);
    const p = buildAskPrompt({ name: 'Ana' }, 'English', 'Hi', { civics: { block, numbered: true } });
    expect(p).toContain('give its number and the accepted answers in English, exactly as written');
  });

  it('rejects duplicate numbers', () => {
    expect(numbersCoverBank(sample, [
      { question: 'A question?', number: 1 },
      { question: 'B question?', number: 1 },
    ])).toBe(false);
  });

  // numbers-2025.json starts empty. Once filled in from the USCIS list it
  // must number all 128 questions 1–128, matched by exact wording.
  it('numbers-2025.json is empty or covers every official question exactly', () => {
    expect(Array.isArray(numbers)).toBe(true);
    if (!numbers.length) return;
    expect(numbers).toHaveLength(questions.length);
    expect(numbersCoverBank(questions, numbers)).toBe(true);
    expect(numbers.map((n) => n.number).sort((a, b) => a - b)).toEqual(questions.map((_, i) => i + 1));
    for (const n of numbers) expect(typeof n.sixty_five_twenty).toBe('boolean');
  });
});
