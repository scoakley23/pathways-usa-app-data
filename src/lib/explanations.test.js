import { describe, it, expect } from 'vitest';
import officialQuestions from '../../content/civics/questions-2025.json';
import {
  EXPLANATIONS, findExplanationProblems, selectExplanation, explainText, pickNextToLearn, buildLearnLesson,
} from './explanations';

// ---- The real content files -------------------------------------------------
// Every explanation must copy the official question and answers exactly
// (content/civics/questions-2025.json is exported from the Base44 records).
// An explanation for a question that is not in that file FAILS.
describe('content/explanations/*.json', () => {
  it('loads the English and Spanish files', () => {
    expect(EXPLANATIONS).toHaveProperty('en');
    expect(EXPLANATIONS).toHaveProperty('es');
  });

  it('questions-2025.json is a list of { question, answer }', () => {
    expect(Array.isArray(officialQuestions)).toBe(true);
    for (const q of officialQuestions) {
      expect(typeof q.question).toBe('string');
      expect(typeof q.answer).toBe('string');
    }
  });

  it('every explanation matches the official question and answer list exactly', () => {
    expect(findExplanationProblems(EXPLANATIONS, officialQuestions)).toEqual([]);
  });
});

// ---- Rules, with small fixtures (fake content) ------------------------------
const Q1 = 'What is the supreme law of the United States?';
const OFFICIAL = [{ question: Q1, answer: '(U.S.) Constitution', category: 'Principles of American Democracy' }];
const entry = (status, explanation, extra = {}) => ({ question: Q1, answers: ['(U.S.) Constitution'], status, explanation, keyWords: [{ en: 'supreme law', translation: 'ley suprema' }], ...extra });

describe('findExplanationProblems', () => {
  it('passes a matching entry', () => {
    expect(findExplanationProblems({ es: { [Q1]: entry('draft', 'Texto.') } }, OFFICIAL)).toEqual([]);
  });

  it('fails when the answers differ from the official list', () => {
    const bad = entry('reviewed', 'Texto.', { answers: ['the Constitution'] });
    expect(findExplanationProblems({ es: { [Q1]: bad } }, OFFICIAL)).toHaveLength(1);
  });

  it('fails when the question is not in the official file (no skipping)', () => {
    const q = 'An invented question?';
    const problems = findExplanationProblems({ en: { [q]: { ...entry('draft', 'x'), question: q } } }, OFFICIAL);
    expect(problems.join()).toMatch(/not in content\/civics\/questions-2025.json/);
    expect(findExplanationProblems({ en: { [q]: { ...entry('draft', 'x'), question: q } } }, [])).toHaveLength(1);
  });

  it('fails on a bad status, a key that is not the question, or a made-up key word', () => {
    expect(findExplanationProblems({ en: { [Q1]: entry('done', 'x') } }, OFFICIAL)).toHaveLength(1);
    expect(findExplanationProblems({ en: { 'Other key': entry('draft', 'x') } }, OFFICIAL).join()).toMatch(/key does not equal/);
    const kw = entry('draft', 'x', { keyWords: [{ en: 'Bill of Rights', translation: 'x' }] });
    expect(findExplanationProblems({ en: { [Q1]: kw } }, OFFICIAL)).toHaveLength(1);
  });
});

describe('selectExplanation', () => {
  const tables = {
    en: { [Q1]: entry('reviewed', 'English text.', { keyWords: [{ en: 'supreme law', translation: 'supreme law' }] }) },
    es: { [Q1]: entry('reviewed', 'Texto en español.') },
  };

  it('uses the learner language when it is reviewed', () => {
    expect(selectExplanation(Q1, 'es', tables)).toEqual({
      text: 'Texto en español.', keyWords: tables.es[Q1].keyWords, link: null, source: 'mine', comingSoon: false, englishText: 'English text.',
    });
    expect(selectExplanation(Q1, 'en', tables)).toMatchObject({ text: 'English text.', source: 'mine', comingSoon: false });
  });

  it('falls back to reviewed English with "translation coming soon" when the translation is a draft', () => {
    const t = { ...tables, es: { [Q1]: entry('draft', 'Borrador.') } };
    expect(selectExplanation(Q1, 'es', t)).toMatchObject({ text: 'English text.', source: 'english', comingSoon: true });
  });

  it('falls back to English for languages with no file', () => {
    expect(selectExplanation(Q1, 'vi', tables)).toMatchObject({ source: 'english', comingSoon: true });
  });

  it('returns nothing when English is not reviewed', () => {
    const t = { en: { [Q1]: entry('draft', 'Draft.') }, es: { [Q1]: entry('draft', 'Borrador.') } };
    expect(selectExplanation(Q1, 'es', t)).toEqual({ text: null, keyWords: [], link: null, source: null, comingSoon: false, englishText: null });
    expect(selectExplanation(Q1, 'en', t).source).toBe(null);
    expect(selectExplanation('Unknown?', 'en', tables).source).toBe(null);
  });

  it('never shows a draft, even in English', () => {
    const t = { en: { [Q1]: entry('draft', 'Draft.') } };
    expect(selectExplanation(Q1, 'en', t).text).toBe(null);
  });
});

describe('explainText', () => {
  it('shows "Explanation coming soon." (Spanish for es) when there is none', () => {
    const none = { text: null, keyWords: [], source: null, comingSoon: false, englishText: null };
    expect(explainText(none, 'en').text).toEqual({ en: 'Explanation coming soon.', mine: null });
    expect(explainText(none, 'es').text).toEqual({ en: 'Explanation coming soon.', mine: 'Explicación disponible pronto.' });
  });

  it('adds "Translation coming soon." when English is shown instead', () => {
    const r = explainText({ text: 'English.', source: 'english', comingSoon: true, englishText: 'English.' }, 'es');
    expect(r.text).toEqual({ en: 'English.', mine: null });
    expect(r.note).toEqual({ en: 'Translation coming soon.', mine: 'Traducción disponible pronto.' });
  });

  it('shows the translation with English under it', () => {
    const r = explainText({ text: 'Texto.', source: 'mine', comingSoon: false, englishText: 'Text.' }, 'es');
    expect(r).toEqual({ text: { en: 'Text.', mine: 'Texto.' }, note: null });
  });
});

describe('pickNextToLearn and buildLearnLesson', () => {
  const qs = [
    { id: 'b', version: '2025', question: 'B question?', answer: 'b', category: 'History' },
    { id: 'a', version: '2025', question: 'A question?', answer: 'a', category: 'History' },
    { id: 'z', version: '2025', question: 'Z question?', answer: 'z', category: 'Civics' },
    { id: 'old', version: '2008', question: 'Old?', answer: 'x', category: 'Civics' },
  ];

  it('picks unstarted 2025 questions in category, then text order', () => {
    expect(pickNextToLearn(qs, [], 2).map((q) => q.id)).toEqual(['z', 'a']);
    expect(pickNextToLearn(qs, [{ content_id: 'z' }], 2).map((q) => q.id)).toEqual(['a', 'b']);
    expect(pickNextToLearn(qs, [{ content_id: 'z' }, { content_id: 'a' }, { content_id: 'b' }], 2)).toEqual([]);
  });

  it('builds explain → bridge → speak for each question', () => {
    const lookup = () => ({ text: null, keyWords: [], source: null, comingSoon: false, englishText: null });
    const lesson = buildLearnLesson(qs.slice(0, 2), 'en', lookup);
    expect(lesson.steps.map((s) => s.type)).toEqual(['explain', 'show-english', 'practice-speaking', 'explain', 'show-english', 'practice-speaking']);
    expect(lesson.steps[2].question).toBe(qs[0]);
    expect(lesson.steps[0].text.en).toBe('Explanation coming soon.');
  });
});

describe('links and current answers', () => {
  it('accepts only https links to official sites, with a label', () => {
    const ok = entry('draft', 'x', { link: { url: 'https://www.loc.gov/item/x/', label: 'Listen' } });
    expect(findExplanationProblems({ en: { [Q1]: ok } }, OFFICIAL)).toEqual([]);
    for (const url of ['http://www.loc.gov/x', 'https://example.com/x', 'https://loc.gov.evil.com/x', 'javascript:alert(1)']) {
      const bad = entry('draft', 'x', { link: { url, label: 'Listen' } });
      expect(findExplanationProblems({ en: { [Q1]: bad } }, OFFICIAL)).toHaveLength(1);
    }
    const noLabel = entry('draft', 'x', { link: { url: 'https://www.loc.gov/x' } });
    expect(findExplanationProblems({ en: { [Q1]: noLabel } }, OFFICIAL)).toHaveLength(1);
  });

  it('passes the link to the explain step and the learner\'s own answer to the bridge', () => {
    const lookup = () => ({ text: 'T.', keyWords: [], link: { url: 'https://www.loc.gov/x', label: 'Listen' }, source: 'mine', comingSoon: false, englishText: 'T.' });
    const q = { id: 'g', version: '2025', question: 'Who is the governor of your state now?', answer: 'Answers vary by where you live.' };
    const lesson = buildLearnLesson([q], 'en', lookup, { representativeData: { governor: 'Pat Example' } });
    expect(lesson.steps[0].link.label).toBe('Listen');
    expect(lesson.steps[1].now).toEqual({ kind: 'yours', text: 'Pat Example' });
  });
});
