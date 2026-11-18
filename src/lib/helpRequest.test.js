import { describe, it, expect } from 'vitest';
import { helpRequestKind } from './helpRequest';
import { HELP_PHRASES, N400_LESSONS, helpPhrase } from './n400Lessons';

describe('helpRequestKind (Ask for help, on the device)', () => {
  it('knows each phrase the lessons teach', () => {
    for (const l of N400_LESSONS) {
      for (const p of HELP_PHRASES) expect(helpRequestKind(helpPhrase(p, l.helpWord)), `${l.id} ${p.id}`).toBe(p.id);
    }
  });

  it('accepts other ways to say them', () => {
    expect(helpRequestKind('can you say that again')).toBe('repeat');
    expect(helpRequestKind('pardon me')).toBe('repeat');
    expect(helpRequestKind('excuse me, what does deportation mean')).toBe('meaning');
    expect(helpRequestKind('what is the meaning of that word')).toBe('meaning');
    expect(helpRequestKind('could you explain it more simply')).toBe('simpler');
    expect(helpRequestKind('please use easier words')).toBe('simpler');
  });

  it('an answer is not a request for help', () => {
    for (const s of ['no', 'yes I did', 'I went to Mexico', 'the Constitution', '']) expect(helpRequestKind(s), s).toBe(null);
  });
});
