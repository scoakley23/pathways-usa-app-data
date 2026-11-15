import { describe, it, expect } from 'vitest';
import { checkDictation, splitOfficialAnswers, matchOfficialAnswer, acceptedForMatching, answersNeeded, foldNumbers, stem, matchWords } from './practiceChecks';

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

describe('on-device matching rules (Step 4)', () => {
  const ok = (said, official, opts) => matchOfficialAnswer(said, official, opts).isCorrect;

  it('number words = digits, including years and ordinals', () => {
    expect(ok('twenty seven', 'Twenty-seven (27)')).toBe(true);
    expect(ok('27', 'Twenty-seven (27)')).toBe(true);
    expect(ok('four hundred and thirty five', 'Four hundred thirty-five (435)')).toBe(true);
    expect(ok('nineteen twenty', '1920')).toBe(true);
    expect(ok('July fourth seventeen seventy six', 'July 4, 1776')).toBe(true);
    expect(ok('the fourteenth amendment', '14th Amendment')).toBe(true);
    expect(ok('twelve', 'Two (2)')).toBe(false);
    expect(ok('1921', '1920')).toBe(false);
    expect(ok('between eighteen and twenty six', 'between eighteen (18) and twenty-six (26)')).toBe(true);
    expect(foldNumbers(['eighteen', 'and', 'twenty', 'six'])).toEqual(['18', 'and', '26']);
  });

  it('abbreviations, dashes, apostrophes and simple endings', () => {
    expect(ok('U.S.S.R.', 'Soviet Union / USSR / Russia')).toBe(true);
    expect(ok('star spangled banner', 'The Star-Spangled Banner')).toBe(true);
    expect(ok('world war 2', 'World War I / World War II')).toBe(true);
    expect(ok('WWII', 'World War II')).toBe(true);
    expect(ok('World War I', 'World War II')).toBe(false);
    expect(ok('naturalization', 'Naturalize')).toBe(true);
    expect(ok('new years day', 'New Year’s Day')).toBe(true);
    expect(ok('Washington DC', 'Washington, D.C.')).toBe(true);
    expect(ok('the United States', 'The United States / The flag')).toBe(true);
  });

  it('uses an "[Also acceptable are …]" note', () => {
    const statue = 'New York (Harbor) / Liberty Island [Also acceptable are New Jersey, near New York City, and on the Hudson (River).]';
    expect(acceptedForMatching(statue)).toEqual(['New York (Harbor)', 'Liberty Island', 'New Jersey', 'New York City', 'Hudson (River)']);
    expect(ok('New Jersey', statue)).toBe(true);
    expect(ok('on the Hudson', statue)).toBe(true);
    expect(ok('Boston', statue)).toBe(false);
  });

  it('"Name three…" needs three different accepted answers', () => {
    expect(answersNeeded('Name three national U.S. holidays.')).toBe(3);
    expect(answersNeeded('What are two Cabinet-level positions?')).toBe(2);
    expect(answersNeeded('There were 13 original states. Name five.')).toBe(5);
    expect(answersNeeded('What are the two parts of the U.S. Congress?')).toBe(1);
    expect(answersNeeded('Name the three branches of government.')).toBe(1);
    const holidays = "New Year’s Day / Memorial Day / Independence Day / Labor Day";
    expect(ok('Labor Day', holidays, { needed: 3 })).toBe(false);
    expect(ok('Labor Day, Memorial Day and New Year\'s Day', holidays, { needed: 3 })).toBe(true);
  });

  it('extra (reviewed variants) count as the official answer they stand for', () => {
    const r = matchOfficialAnswer('FDR', '(Franklin) Roosevelt', { extra: [{ text: 'FDR', answer: '(Franklin) Roosevelt' }] });
    expect(r).toMatchObject({ isCorrect: true, matched: '(Franklin) Roosevelt' });
  });

  it('foldNumbers and stem', () => {
    expect(foldNumbers(['two', 'thousand', 'one'])).toEqual(['2001']);
    expect(stem('states')).toBe(stem('state'));
    expect(stem('voted')).toBe(stem('vote'));
    expect(matchWords('the U.S. Constitution')).toEqual(['us', stem('constitution')]);
  });
});

describe('sure: checked on the device only when nothing else was said', () => {
  const m = (said, official, questionText) => matchOfficialAnswer(said, official, { questionText });

  it('filler and the question\'s own words are fine', () => {
    expect(m('I think it is the Constitution', '(U.S.) Constitution', 'What is the supreme law of the land?').sure).toBe(true);
    expect(m('there are nine seats', 'Nine (9)', 'How many seats are on the Supreme Court?').sure).toBe(true);
  });

  it('a long answer that only contains an accepted one goes to the AI', () => {
    const r = m('England France and Russia', 'Soviet Union / USSR / Russia', 'Who was the United States’ main rival during the Cold War?');
    expect(r).toMatchObject({ isCorrect: true, sure: false });
  });

  it('"vice", "not" and other numbers change the meaning: never accepted on the device', () => {
    expect(m('the vice president', 'The President (of the United States)', 'Who vetoes bills?').isCorrect).toBe(false);
    expect(m('not the Senate', 'Senate and House (of Representatives)', 'What are the two parts of the U.S. Congress?').isCorrect).toBe(false);
    expect(m('the 16th president', 'The President (of the United States)', 'Who vetoes bills?').isCorrect).toBe(false);
  });
});
