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
  // The same checks run on the live file and on any draft beside it
  // (numbers-2025.draft.json), so a draft can't drop a question or repeat a
  // number before it goes live.
  const numberFiles = import.meta.glob('../../content/civics/numbers-2025*.json', { eager: true, import: 'default' });

  it('finds the live numbers file', () => {
    expect(numberFiles['../../content/civics/numbers-2025.json']).toBe(numbers);
  });

  for (const [path, list] of Object.entries(numberFiles)) {
    const name = path.split('/').pop();
    it(`${name} is empty or covers every official question exactly`, () => {
      expect(Array.isArray(list)).toBe(true);
      if (!list.length) return;
      expect(list).toHaveLength(questions.length);
      expect(numbersCoverBank(questions, list)).toBe(true);
      // Every number 1–128 once, every question once.
      expect(list.map((n) => n.number).sort((a, b) => a - b)).toEqual(questions.map((_, i) => i + 1));
      expect(new Set(list.map((n) => n.question)).size).toBe(list.length);
      for (const n of list) {
        expect(Object.keys(n).sort()).toEqual(['number', 'question', 'sixty_five_twenty']);
        expect(typeof n.sixty_five_twenty).toBe('boolean');
      }
      // The USCIS list marks exactly 20 questions for the 65/20 rule.
      expect(list.filter((n) => n.sixty_five_twenty)).toHaveLength(20);
      // Question 30 is the Speaker of the House (spot check against the PDF).
      expect(list.find((n) => n.number === 30)).toMatchObject({ question: Q30, sixty_five_twenty: true });
    });
  }
});
