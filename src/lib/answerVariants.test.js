// Accepted-answer variants (content/civics/answer-variants.json) and the
// on-device civics check. Variants only recognize an official answer; they
// never add one.
import { describe, it, expect } from 'vitest';
import VARIANTS from '../../content/civics/answer-variants.json';
import civics2025 from '../../content/base44-export/civics-questions-2025.json';
import civics2008 from '../../content/base44-export/civics-questions-2008.json';
import { matchCivicsAnswer, reviewedVariants } from './answerVariants';
import { splitOfficialAnswers, answersNeeded } from './practiceChecks';
import { OFFICEHOLDER_QUESTIONS } from './officeholderQuestions';

const ALL = [...civics2025, ...civics2008];
const BY_ID = new Map(ALL.map((q) => [q.id, q]));

describe('answer-variants.json', () => {
  it('each variant belongs to a real question and names one of its official answers exactly', () => {
    for (const [id, entry] of Object.entries(VARIANTS.questions)) {
      const q = BY_ID.get(id);
      expect(q, id).toBeTruthy();
      expect(entry.question).toBe(q.question);
      const official = splitOfficialAnswers(q.answer);
      for (const v of entry.variants) {
        expect(official, `${id}: ${v.answer}`).toContain(v.answer);
        expect(['draft', 'reviewed']).toContain(v.status);
        expect(typeof v.text === 'string' && v.text.trim()).toBeTruthy();
      }
    }
  });

  it('no variants for officeholder questions (graded from the officeholders table only)', () => {
    const norm = (t) => t.toLowerCase().replace(/[’']/g, "'");
    const officeholder = new Set(OFFICEHOLDER_QUESTIONS.map((q) => norm(q.question)));
    for (const [id, entry] of Object.entries(VARIANTS.questions)) {
      expect(/answers (change|vary)/i.test(BY_ID.get(id).answer), id).toBe(false);
      expect(officeholder.has(norm(entry.question)), id).toBe(false);
    }
  });

  it('only reviewed variants are used', () => {
    const q = civics2025.find((x) => x.question.startsWith('Who was president during the Great Depression'));
    const file = { questions: { [q.id]: { variants: [
      { text: 'FDR', answer: '(Franklin) Roosevelt', status: 'draft' },
      { text: 'Franklin Delano Roosevelt', answer: '(Franklin) Roosevelt', status: 'reviewed' },
    ] } } };
    expect(reviewedVariants(q.id, file)).toEqual([{ text: 'Franklin Delano Roosevelt', answer: '(Franklin) Roosevelt' }]);
    expect(matchCivicsAnswer('FDR', q, { file }).isCorrect).toBe(false);
    expect(matchCivicsAnswer('Roosevelt', q, { file }).isCorrect).toBe(true);
    const reviewed = { questions: { [q.id]: { variants: [{ text: 'FDR', answer: '(Franklin) Roosevelt', status: 'reviewed' }] } } };
    expect(matchCivicsAnswer('it was FDR', q, { file: reviewed }).isCorrect).toBe(true);
  });
});

describe('matchCivicsAnswer on the real question lists', () => {
  const graded = ALL.filter((q) => !/answers (change|vary)/i.test(q.answer));

  it('every official accepted answer is recognized (enough of them for "Name three…")', () => {
    const misses = [];
    for (const q of graded) {
      const accepted = splitOfficialAnswers(q.answer.replace(/\[[^\]]*\]/g, ' '));
      const needed = answersNeeded(q.question);
      const said = needed > 1 ? accepted.slice(0, needed).join(', ') : null;
      if (said !== null) {
        if (accepted.length >= needed && !matchCivicsAnswer(said, q).isCorrect) misses.push(`${q.question} ← ${said}`);
        continue;
      }
      for (const a of accepted) if (!matchCivicsAnswer(a, q).isCorrect) misses.push(`${q.question} ← ${a}`);
    }
    expect(misses).toEqual([]);
  });

  it('wrong answers are not accepted', () => {
    const find = (start) => civics2025.find((q) => q.question.startsWith(start));
    expect(matchCivicsAnswer('fifty', find('How many U.S. senators are there?')).isCorrect).toBe(false);
    expect(matchCivicsAnswer('the Senate', find('What is the highest court')).isCorrect).toBe(false);
    expect(matchCivicsAnswer('Labor Day', find('Name three national U.S. holidays.')).isCorrect).toBe(false);
    expect(matchCivicsAnswer('one hundred', find('How many U.S. senators are there?')).isCorrect).toBe(true);
  });
});
