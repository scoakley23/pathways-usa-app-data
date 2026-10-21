import { describe, it, expect } from 'vitest';
import { N400_SECTIONS } from '@/components/n400/n400Content';
import { EXAMPLE_APPLICANTS } from '@/components/n400/exampleApplicants';
import { pickSection, personaForSection, practiceQuestions, buildN400Lesson, liveSections } from './n400Lesson';

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

  it('rotates the practice person by section', () => {
    const live = liveSections(N400_SECTIONS);
    expect(personaForSection(N400_SECTIONS, live[0], EXAMPLE_APPLICANTS).id).toBe(EXAMPLE_APPLICANTS[0].id);
    expect(personaForSection(N400_SECTIONS, live[1], EXAMPLE_APPLICANTS).id).toBe(EXAMPLE_APPLICANTS[1].id);
  });

  it('builds learn → practice as a person → lawyer note', () => {
    for (const section of liveSections(N400_SECTIONS)) {
      const persona = EXAMPLE_APPLICANTS[0];
      const lesson = buildN400Lesson({ section, persona, personaFactsText: 'facts', language: 'es' });
      const types = lesson.steps.map((s) => s.type);
      expect(types[0]).toBe('explain');
      expect(types.filter((t) => t === 'n400-card').length).toBe(section.questions.filter((q) => q.status === 'approved').length);
      expect(types[types.length - 1]).toBe('n400-lawyer');
      const practice = lesson.steps.filter((s) => s.type === 'n400-persona');
      expect(practice.length).toBe(practiceQuestions(section).length);
      for (const p of practice) {
        expect(p.personaId).toBe(persona.id);
        expect(p.extra).toBe('facts');
      }
      expect(lesson.steps[0].text.mine).toMatch(/Esta semana/);
    }
  });

  it('uses only "how the officer might ask" phrasings for practice', () => {
    const section = liveSections(N400_SECTIONS)[0];
    for (const q of practiceQuestions(section)) {
      expect(section.questions.some((x) => x.officerPhrasings?.[0] === q.question)).toBe(true);
    }
  });
  it('reads cleanly when a title ends with a period', () => { expect(buildN400Lesson({ section: { id: 'x', title: 'Time Outside the U.S.', questions: [] }, persona: { id: 'p', name: 'P' }, personaFactsText: '' }).steps[0].text.en).toMatch(/U\.S\. First/); });
});
