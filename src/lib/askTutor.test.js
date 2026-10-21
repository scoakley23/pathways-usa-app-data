import { describe, it, expect } from 'vitest';
import {
  looksPersonalLegal,
  redactIdentifiers,
  buildAskPrompt,
  interpretAskResponse,
  historyAnswerText,
  ASK_LINES,
  ASK_LINES_ES,
} from './askTutor';

describe('looksPersonalLegal', () => {
  it.each([
    'What is happening with my case?',
    'Am I eligible to apply for citizenship?',
    'Can I apply if I was out of the country for 8 months?',
    'How should I answer the question about taxes on the N-400?',
    'Should I answer yes to question 12?',
    'My A-number is A123456789, can you check it?',
    'I was arrested in 2015. Is that a problem?',
    'Can they deport me?',
    'Will I be denied because of my ticket?',
    'Do I qualify for a fee waiver?',
    'I have a criminal record from long ago',
    'What about my green card?',
    'Mi caso está pendiente, ¿qué hago?',
    '¿Soy elegible para la ciudadanía?',
    'Am I eligible?', // short
    'AM I ELIGIBLE',
    'What happens to my status if I travel?',
  ])('declines: %s', (q) => {
    expect(looksPersonalLegal(q)).toBe(true);
  });

  it.each([
    'What is the supreme law of the land?',
    'How do I say Congress?',
    'What does the Constitution do?',
    'Who was the first President?',
    'What is an amendment?',
    'Can you explain the three branches of government?',
    'How many senators are there?',
    'What happens at the citizenship interview?',
    'Why did the colonists fight the British?',
    '¿Qué es la Constitución?',
    'Should I say "the Constitution" or just "Constitution"?',
    '',
  ])('lets through: %s', (q) => {
    expect(looksPersonalLegal(q)).toBe(false);
  });
});

describe('redactIdentifiers', () => {
  it('removes emails and phone numbers', () => {
    expect(redactIdentifiers('write me at maria.test@example.com')).toBe('write me at [removed]');
    expect(redactIdentifiers('call 555-123-4567 please')).toBe('call [removed] please');
  });
  it('keeps years and small numbers', () => {
    expect(redactIdentifiers('What happened in 1776-1787?')).toBe('What happened in 1776-1787?');
    expect(redactIdentifiers('There are 100 senators')).toBe('There are 100 senators');
  });
});

describe('buildAskPrompt', () => {
  const profile = { name: 'Ana', tone: 'coach' };
  it('uses the persona instructions and includes the question', () => {
    const p = buildAskPrompt(profile, 'Spanish', 'What is the Bill of Rights?');
    expect(p).toContain('You are Ana');
    expect(p).toContain('Coach');
    expect(p).toContain('What is the Bill of Rights?');
    expect(p).toContain('is_personal_legal');
    expect(p).toContain('in Spanish in answer_mine');
  });
  it('asks for English only when the language is English', () => {
    const p = buildAskPrompt(profile, 'English', 'Hi');
    expect(p).toContain('Leave answer_mine empty');
  });
  it('never includes an email or a learner name field', () => {
    const p = buildAskPrompt(profile, 'English', 'What is the capital?');
    expect(p).not.toMatch(/@/);
    expect(p).not.toMatch(/email/i);
  });
});

describe('interpretAskResponse', () => {
  it('declines when the AI flags a personal legal question', () => {
    expect(interpretAskResponse({ is_personal_legal: true, answer_en: 'You should...' }, 'es')).toEqual({ type: 'decline' });
  });
  it('returns both languages for a non-English learner', () => {
    expect(interpretAskResponse({ is_personal_legal: false, answer_en: ' The Constitution. ', answer_mine: 'La Constitución.' }, 'es'))
      .toEqual({ type: 'answer', en: 'The Constitution.', mine: 'La Constitución.' });
  });
  it('drops answer_mine for English learners', () => {
    expect(interpretAskResponse({ is_personal_legal: false, answer_en: 'Yes.', answer_mine: 'Sí.' }, 'en'))
      .toEqual({ type: 'answer', en: 'Yes.', mine: null });
  });
  it('handles JSON strings, plain strings and empty results', () => {
    expect(interpretAskResponse('{"is_personal_legal":true}', 'en')).toEqual({ type: 'decline' });
    expect(interpretAskResponse('Plain answer', 'en')).toEqual({ type: 'answer', en: 'Plain answer', mine: null });
    expect(interpretAskResponse({ is_personal_legal: false }, 'en')).toEqual({ type: 'error' });
    expect(interpretAskResponse(null, 'en')).toEqual({ type: 'error' });
  });
  it('shows the learner-language answer alone if English is missing', () => {
    expect(interpretAskResponse({ is_personal_legal: false, answer_mine: 'Hola' }, 'es')).toEqual({ type: 'answer', en: '', mine: 'Hola' });
  });
});

describe('historyAnswerText', () => {
  it('stacks learner language over English', () => {
    expect(historyAnswerText({ mine: 'Hola', en: 'Hello' })).toBe('Hola\n\nHello');
    expect(historyAnswerText({ mine: null, en: 'Hello' })).toBe('Hello');
  });
});

describe('fixed lines', () => {
  it('has a hand-written Spanish line for every English line', () => {
    expect(Object.keys(ASK_LINES_ES).sort()).toEqual(Object.keys(ASK_LINES).sort());
  });
});
