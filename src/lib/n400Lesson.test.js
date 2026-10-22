import { describe, it, expect } from 'vitest';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import { pickSection, practiceQuestions, buildN400Lesson, liveSections } from './n400Lesson';

describe('N-400 coaching lessons', () => {
  it('goes through sections in form order, skipping completed ones', () => {
    const live = liveSections(N400_SECTIONS);
    expect(pickSection(N400_SECTIONS, []).id).toBe(live[0].id);
    expect(pickSection(N400_SECTIONS, [live[0].id]).id).toBe(live[1].id);
    expect(pickSection(N400_SECTIONS, live.map((s) => s.id))).toBeNull();
  });

  it('opens a requested section, even if completed', () => {
    const live = liveSections(N400_SECTIONS);
    expect(pickSection(N400_SECTIONS, [live[2].id], live[2].id).id).toBe(live[2].id);
    expect(pickSection(N400_SECTIONS, [], 'not-a-section').id).toBe(live[0].id);
  });

  it('builds learn → practice understanding → lawyer note, with no practice person', () => {
    for (const section of liveSections(N400_SECTIONS)) {
      const lesson = buildN400Lesson({ section, language: 'es' });
      const types = lesson.steps.map((s) => s.type);
      expect(types[0]).toBe('explain');
      expect(types.filter((t) => t === 'n400-card').length).toBe(section.questions.filter((q) => q.status === 'approved').length);
      expect(types[types.length - 1]).toBe('n400-lawyer');
      expect(types).not.toContain('n400-persona');
      const practice = lesson.steps.filter((s) => s.type === 'n400-understand');
      expect(practice.length).toBe(practiceQuestions(section).length);
      for (const p of practice) {
        expect(typeof p.question.question).toBe('string');
        expect(p).not.toHaveProperty('personaId');
      }
      expect(JSON.stringify(lesson)).not.toMatch(/practice person|persona de práctica/i);
      expect(lesson.steps[0].text.mine).toMatch(/Esta semana/);
    }
  });

  it('uses only "how the officer might ask" phrasings for practice', () => {
    const section = liveSections(N400_SECTIONS)[0];
    for (const q of practiceQuestions(section)) {
      const source = section.questions.find((x) => x.officerPhrasings?.[0] === q.question);
      expect(source).toBeTruthy();
      expect(q.meaning).toBe(source.meaning || '');
    }
  });
  it('reads cleanly when a title ends with a period', () => { expect(buildN400Lesson({ section: { id: 'x', title: 'Time Outside the U.S.', questions: [] } }).steps[0].text.en).toMatch(/U\.S\. First/); });
});
