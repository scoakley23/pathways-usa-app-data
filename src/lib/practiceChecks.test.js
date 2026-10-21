import { describe, it, expect } from 'vitest';
import { checkDictation, splitOfficialAnswers, matchOfficialAnswer } from './practiceChecks';

describe('checkDictation', () => {
  it('ignores case and punctuation like the dictation card', () => {
    expect(checkDictation('Congress meets in Washington, D.C.', 'congress meets in washington dc').isCorrect).toBe(true);
  });

  it('lists missed words', () => {
    const r = checkDictation('Citizens have the right to vote.', 'Citizens have right vote');
    expect(r.isCorrect).toBe(false);
    expect(r.missing).toEqual(['the', 'to']);
  });

  it('handles empty input', () => {
    expect(checkDictation('We vote.', '').isCorrect).toBe(false);
  });
});

describe('splitOfficialAnswers', () => {
  it('splits on lines, semicolons, and bullets but not commas', () => {
    expect(splitOfficialAnswers('the Constitution')).toEqual(['the Constitution']);
    expect(splitOfficialAnswers('sets up the government; defines the government\n• protects rights'))
      .toEqual(['sets up the government', 'defines the government', 'protects rights']);
    expect(splitOfficialAnswers('Washington, D.C.')).toEqual(['Washington, D.C.']);
  });

  it('splits the exported " / " lists but keeps a slash inside a word', () => {
    expect(splitOfficialAnswers('Communism / Nuclear war')).toEqual(['Communism', 'Nuclear war']);
    expect(splitOfficialAnswers('(Battle of) Antietam/Sharpsburg')).toEqual(['(Battle of) Antietam/Sharpsburg']);
  });
});

describe('matchOfficialAnswer', () => {
  const official = 'sets up the government; defines the government; protects the basic rights of Americans';

  it('accepts any accepted answer, ignoring small words and case', () => {
    expect(matchOfficialAnswer('It sets up government', official).isCorrect).toBe(true);
    expect(matchOfficialAnswer('PROTECTS basic rights of Americans', official).isCorrect).toBe(true);
  });

  it('rejects partial or empty answers', () => {
    expect(matchOfficialAnswer('government', official).isCorrect).toBe(false);
    expect(matchOfficialAnswer('', official).isCorrect).toBe(false);
  });

  it('treats words in parentheses as optional', () => {
    expect(matchOfficialAnswer('the Constitution', '(U.S.) Constitution').isCorrect).toBe(true);
    expect(matchOfficialAnswer('U.S. Constitution', '(U.S.) Constitution').isCorrect).toBe(true);
  });

  it('accepts a one-word answer', () => {
    expect(matchOfficialAnswer('the constitution', 'the Constitution').isCorrect).toBe(true);
  });
});
