import { describe, it, expect, vi, beforeEach } from 'vitest';

const invoke = vi.fn(async () => ({ is_acceptable: true }));
vi.mock('@/api/base44Client', () => ({ base44: { integrations: { Core: { InvokeLLM: (...a) => invoke(...a) } } } }));

const { evaluateInterviewAnswer, evaluateUnderstanding, isUnderstandingSection } = await import('@/components/practice/evaluateInterviewAnswer');

beforeEach(() => invoke.mockClear());

describe('understanding check for questions about the learner\'s application', () => {
  it('covers the personal information and morals sections only', () => {
    expect(isUnderstandingSection({ section: 'personal_info' })).toBe(true);
    expect(isUnderstandingSection({ section: 'morals_ethics' })).toBe(true);
    expect(isUnderstandingSection({ section: 'small_talk' })).toBe(false);
    expect(isUnderstandingSection({ section: 'oath_requirements' })).toBe(false);
    expect(isUnderstandingSection(null)).toBe(false);
  });

  it('asks the AI to judge understanding only, never facts, answers or eligibility', async () => {
    await evaluateUnderstanding({ question: 'Have you ever been arrested?' }, 'It asks if police ever took me', { meaning: 'Plain meaning text.' });
    const { prompt } = invoke.mock.calls[0][0];
    expect(prompt).toMatch(/Judge ONLY whether what they said shows they understand/);
    expect(prompt).toMatch(/Never repeat, judge, or comment on facts about the learner's own life/);
    expect(prompt).toMatch(/never say anything about eligibility/);
    expect(prompt).toMatch(/It explains the question; it never answers it/);
    expect(prompt).toContain('Plain meaning text.');
  });

  it('removes emails and phone numbers before sending (test data only)', async () => {
    await evaluateUnderstanding({ question: 'What is your address?' }, 'call me at 555-123-4567 or test@example.com');
    const { prompt } = invoke.mock.calls[0][0];
    expect(prompt).not.toContain('555-123-4567');
    expect(prompt).not.toContain('test@example.com');
    expect(prompt).toContain('[removed]');
  });
});

describe('mock interview answer scoring', () => {
  it('removes identifiers before sending (test data only)', async () => {
    await evaluateInterviewAnswer(
      { question: 'How did you get here today?', expected_response: 'I took the bus.', response_type: 'short' },
      'I took the bus, my A-number is A-123-456-789, SSN 123-45-6789, email test@example.com',
    );
    const { prompt } = invoke.mock.calls[0][0];
    expect(prompt).not.toContain('123-456-789');
    expect(prompt).not.toContain('123-45-6789');
    expect(prompt).not.toContain('test@example.com');
    expect(prompt).toContain('I took the bus, my A-number is [removed]');
  });
});
