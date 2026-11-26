import { describe, it, expect } from 'vitest';
import { UNITS } from '@/lib/course';
import { journeyStops, visibleCourse, visibleSection, OPTIONAL_STOPS } from '@/lib/journey';
import { n400CardFor, lawyerIf } from '@/lib/n400View';
import { n400Href } from '@/lib/checkpoints';
import { N400_SECTIONS } from '@/components/n400/n400Content';

// N-400 card stops ({ type: 'n400', section, card }) open one card of the
// N-400 guide. They must point to an existing approved card, the same card
// for learners and admins, and are always open (never locked, never the
// suggested stop).
const cardStops = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.stops || [])
  .filter((st) => st.type === 'n400' && !st.lessonId)
  .map((st) => ({ ...st, unitId: u.id, sectionId: s.id }))));

describe('N-400 card stops', () => {
  it('the course has card stops', () => {
    expect(cardStops.length).toBeGreaterThan(0);
  });

  it.each(cardStops.map((s) => [s.id, s]))('%s points to an approved card', (_id, stop) => {
    expect(typeof stop.title).toBe('string');
    expect(Number.isInteger(stop.card) && stop.card >= 1).toBe(true);
    const section = N400_SECTIONS.find((s) => s.id === stop.section);
    expect(section, `section ${stop.section}`).toBeTruthy();
    expect(section.status).toBe('approved');
    const learnerCard = n400CardFor(stop, N400_SECTIONS, false);
    expect(learnerCard, `card ${stop.card}`).toBeTruthy();
    expect(learnerCard.status).toBe('approved');
    // No draft before it, so ?card=n is the same card for learners and admins.
    expect(n400CardFor(stop, N400_SECTIONS, true)).toBe(learnerCard);
    expect(n400Href(stop)).toBe(`/n400-guide?section=${stop.section}&card=${stop.card}`);
  });

  it('stop ids are unique across the course', () => {
    const ids = UNITS.flatMap((u) => u.sections.flatMap((s) => (s.stops || []).map((st) => st.id)));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('card stops are always open and never the suggested stop', () => {
    expect(OPTIONAL_STOPS).toContain('n400');
    const stops = journeyStops(visibleCourse(UNITS));
    const mine = stops.filter((s) => s.type === 'n400' && !s.lessonId);
    expect(mine.length).toBe(cardStops.length);
    for (const s of mine) {
      expect(s.state).toBe('open');
      expect(s.guideCard?.status).toBe('approved');
    }
  });

  it('a card stop whose card is a draft is hidden from learners, shown to admins', () => {
    const section = { id: 'x', lessons: [{ id: 'l', status: 'reviewed' }], stops: [{ id: 'c', type: 'n400', section: 'oath-questions', card: 99 }] };
    expect(visibleSection(section).stops).toHaveLength(0);
    const draftSections = N400_SECTIONS.map((s) => (s.id === 'oath-questions' ? { ...s, questions: s.questions.map((q, i) => (i === 0 ? { ...q, status: 'draft' } : q)) } : s));
    const stop = { section: 'oath-questions', card: 1 };
    expect(n400CardFor(stop, draftSections, false)?.id).not.toBe('p9-30');
    expect(n400CardFor(stop, draftSections, true)?.id).toBe('p9-30');
  });
});

describe('which answer means "talk to a lawyer first"', () => {
  it('is "no" on items 16, 22.b and the Oath promises, "yes" everywhere else', () => {
    const noCards = N400_SECTIONS.flatMap((s) => s.questions).filter((q) => lawyerIf(q) === 'no').map((q) => q.id);
    expect(noCards).toEqual(['p9-16', 'p9-22b', 'p9-31', 'p9-32', 'p9-34', 'p9-35', 'p9-36', 'p9-37']);
    for (const q of N400_SECTIONS.flatMap((s) => s.questions)) expect([undefined, 'no']).toContain(q.lawyerIf);
  });
});
