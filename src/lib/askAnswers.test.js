// Ask Amio's pre-written answers (content/ask/answers.json): every suggested
// question has one, only reviewed ones are used, civics wording is official,
// and a language without a translation still goes to the AI.
import { describe, it, expect, vi } from 'vitest';
import FILE from '../../content/ask/answers.json';
import { UNITS, findLesson } from './course';
import civics2025 from '../../content/base44-export/civics-questions-2025.json';
import officeholders from '../data/officeholders.json';
import { ASK_SCREEN_LINES } from './askTutor';
import { lessonSuggestions, STARTER_SUGGESTIONS, INTERVIEW_SUGGESTIONS } from './askSuggestions';
import { splitOfficialAnswers } from './practiceChecks';
import { findAnswer, preparedAnswer, reviewedAnswers, normalizeQuestion, courseAnswer } from './askAnswers';

const BY_QUESTION = new Map(FILE.answers.map((a) => [normalizeQuestion(a.question), a]));

describe('content/ask/answers.json', () => {
  it('ids are unique; each entry is draft or reviewed, short, with a source', () => {
    expect(new Set(FILE.answers.map((a) => a.id)).size).toBe(FILE.answers.length);
    for (const a of FILE.answers) {
      expect(['draft', 'reviewed'], a.id).toContain(a.status);
      expect(a.answer.length, a.id).toBeLessThanOrEqual(320);
      expect(a.source, a.id).toBeTruthy();
    }
  });

  it('every fixed suggestion has an answer with the same question', () => {
    for (const key of [...STARTER_SUGGESTIONS, ...INTERVIEW_SUGGESTIONS]) {
      const entry = FILE.answers.find((a) => a.id === key);
      expect(entry, key).toBeTruthy();
      expect(entry.question).toBe(ASK_SCREEN_LINES[key]);
    }
  });

  it('every question a Course lesson can suggest has an answer from its reviewed content', async () => {
    const missing = [];
    for (const lesson of UNITS.flatMap((u) => u.sections.flatMap((sec) => sec.lessons || []))) {
      if (lesson.status !== 'reviewed') continue;
      const progress = [{ lesson_id: lesson.id, completed_at: '2026-11-01' }];
      const suggestions = lessonSuggestions(progress, (id) => findLesson(id)?.lesson);
      if (!suggestions.length) missing.push(lesson.id);
      for (const q of suggestions) {
        const a = await courseAnswer(q, 'en');
        if (!a?.en) missing.push(q.question);
        expect(q.parts.every((p) => typeof p === 'string' && p.length > 0)).toBe(true);
      }
    }
    expect(missing).toEqual([]);
  });

  it('a Course answer in another language comes only from the pack, whole or not at all', async () => {
    const q = { id: 'course_x_term', question: 'What does "veto" mean?', lead: 'veto: ', parts: ['when the President says no to a bill'] };
    expect(await courseAnswer(q, 'es', { translate: async () => 'cuando el Presidente dice que no' })).toEqual({ en: 'veto: when the President says no to a bill', mine: 'veto: cuando el Presidente dice que no', id: 'course_x_term' });
    expect(await courseAnswer(q, 'es', { translate: async () => null })).toBeNull();
    expect(await courseAnswer({ ...q, parts: ['a', 'b'] }, 'es', { translate: async (l, p) => (p === 'a' ? 'A' : null) })).toBeNull();
  });

  it('no prepared answer is left for the old Lessons tab', () => {
    expect(FILE.answers.filter((a) => a.id.startsWith('lesson_'))).toEqual([]);
  });

  it('quoted civics answers are official, word for word', () => {
    const byId = new Map(civics2025.map((q) => [q.id, q]));
    const plain = (s) => s.toLowerCase().replace(/[()]/g, '').replace(/\s+/g, ' ').trim();
    for (const a of FILE.answers) {
      for (const o of a.official || []) {
        const q = byId.get(o.questionId);
        expect(q, `${a.id}: ${o.questionId}`).toBeTruthy();
        expect(splitOfficialAnswers(q.answer), a.id).toContain(o.answer);
        const withOptional = plain(o.answer);
        const withoutOptional = plain(o.answer.replace(/\([^)]*\)/g, ''));
        expect(plain(a.answer).includes(withOptional) || plain(a.answer).includes(withoutOptional), `${a.id}: ${o.answer}`).toBe(true);
      }
    }
  });

  // Full names (two or more words): one-word capitals like "Lincoln" or
  // "Madison" are also historical people the lessons talk about.
  it('never names a current officeholder (those come only from officeholders.json)', () => {
    const names = new Set();
    const walk = (v, key) => {
      if (typeof v === 'string' && key === 'name' && /\S\s+\S/.test(v) && !/VACANT|UNCONFIRMED/.test(v)) names.add(v);
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
    };
    walk(officeholders);
    expect(names.size).toBeGreaterThan(100);
    const hits = FILE.answers.filter((a) => [...names].some((n) => a.answer.includes(n))).map((a) => a.id);
    expect(hits).toEqual([]);
  });
});

describe('preparedAnswer', () => {
  const fake = { answers: [
    { id: 'q_branches', question: 'What are the three branches of government?', answer: 'Legislative, executive, and judicial.', status: 'reviewed' },
    { id: 'q_how_long', question: 'How long is the interview?', answer: 'About 20 minutes.', status: 'draft' },
  ] };
  const translate = vi.fn(async (lang, en) => (lang === 'es' && en.startsWith('Legislative') ? 'Legislativo, ejecutivo y judicial.' : null));

  it('only reviewed answers are used', () => {
    expect(reviewedAnswers(fake).map((a) => a.id)).toEqual(['q_branches']);
    expect(findAnswer({ id: 'q_how_long' }, { file: fake })).toBeNull();
  });

  it('by suggestion id, by the English words, or by the translated question', () => {
    expect(findAnswer({ id: 'q_branches' }, { file: fake })?.id).toBe('q_branches');
    expect(findAnswer({ text: 'what are the three branches of government' }, { file: fake })?.id).toBe('q_branches');
    expect(findAnswer({ text: '¿Cuáles son las tres ramas del gobierno?', translations: { q_branches: '¿Cuáles son las tres ramas del gobierno?' } }, { file: fake })?.id).toBe('q_branches');
    expect(findAnswer({ text: 'What are the branches?' }, { file: fake })).toBeNull();
  });

  it('English as is; another language only with its translation, else null (the AI answers)', async () => {
    expect(await preparedAnswer({ id: 'q_branches', language: 'en' }, { file: fake, translate })).toMatchObject({ en: 'Legislative, executive, and judicial.', mine: null });
    expect(await preparedAnswer({ id: 'q_branches', language: 'es' }, { file: fake, translate })).toMatchObject({ mine: 'Legislativo, ejecutivo y judicial.' });
    expect(await preparedAnswer({ id: 'q_branches', language: 'vi' }, { file: fake, translate })).toBeNull();
    expect(await preparedAnswer({ text: 'Something else', language: 'en' }, { file: fake, translate })).toBeNull();
  });
});
