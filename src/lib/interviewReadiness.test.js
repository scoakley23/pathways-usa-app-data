import { describe, it, expect } from 'vitest';
import { readinessTiles, lastScores, isBestSoFar, reportParts, workOnNext, WORK_ON_NEXT } from './interviewReadiness';

const session = (passed, total, date, extra = {}) => ({ passed_count: passed, question_count: total, overall_score: Math.round((passed / total) * 100), created_date: date, ...extra });

describe('Are you ready? tiles', () => {
  it('reading, writing and civics are ready at "strong"; speaking when the latest interview passed', () => {
    const { tiles, readyCount } = readinessTiles({
      levels: { reading: 'strong', writing: 'strong', civics: 'getting_there' },
      sessions: [session(6, 12, '2026-11-01', { passed: false }), session(10, 12, '2026-11-10', { overall_score: 78, passed: false })],
      civicsMastered: 34,
    });
    expect(tiles.map((t) => [t.id, t.ready])).toEqual([['reading', true], ['writing', true], ['speaking', false], ['civics', false]]);
    expect(tiles.find((t) => t.id === 'speaking').value).toBe(78);
    expect(tiles.find((t) => t.id === 'civics')).toMatchObject({ value: 34, total: 128 });
    expect(readyCount).toBe(2);
  });

  it('works for a new learner with nothing saved', () => {
    const { tiles, readyCount } = readinessTiles();
    expect(readyCount).toBe(0);
    expect(tiles.find((t) => t.id === 'speaking').value).toBe(null);
    expect(tiles.find((t) => t.id === 'reading').level).toBe(null);
  });
});

describe('practice interview scores', () => {
  const sessions = [session(9, 12, '2026-11-05'), session(6, 12, '2026-11-01'), session(7, 12, '2026-11-02'), session(10, 12, '2026-11-12'), session(5, 12, '2026-10-01')];
  it('shows the last 4, oldest first', () => {
    expect(lastScores(sessions).map((s) => s.passed)).toEqual([6, 7, 9, 10]);
  });
  it('knows a best-so-far', () => {
    expect(isBestSoFar(10, 12, sessions)).toBe(true);
    expect(isBestSoFar(8, 12, sessions)).toBe(false);
    expect(isBestSoFar(3, 12, [])).toBe(true);
  });
});

describe('the report', () => {
  const results = [
    { section: 'small_talk', is_acceptable: true }, { section: 'small_talk', is_acceptable: true },
    { section: 'personal_info', is_acceptable: true }, { section: 'personal_info', is_acceptable: false }, { section: 'personal_info', is_acceptable: true },
    { section: 'morals_ethics', is_acceptable: false }, { section: 'morals_ethics', is_acceptable: false }, { section: 'morals_ethics', is_acceptable: true }, { section: 'morals_ethics', is_acceptable: true },
    { section: 'oath_requirements', is_acceptable: true },
  ];
  it('has one row per part, in the interview order', () => {
    expect(reportParts(results).map((p) => [p.id, p.passed, p.total, p.ready])).toEqual([
      ['small_talk', 2, 2, true], ['personal_info', 2, 3, false], ['morals_ethics', 2, 4, false], ['oath_requirements', 1, 1, true],
    ]);
  });
  it('"Work on next" is the weakest part', () => {
    expect(workOnNext(reportParts(results)).id).toBe('morals_ethics');
    expect(workOnNext(reportParts(results.map((r) => ({ ...r, is_acceptable: true }))))).toBe(null);
  });
  it('never tells the learner how to answer about their own history', () => {
    for (const { tip } of Object.values(WORK_ON_NEXT)) expect(tip).not.toMatch(/\bno, i have never|say no|answer no/i);
    expect(WORK_ON_NEXT.morals_ethics.tip).toMatch(/talk to a lawyer first/);
  });
});

describe('readyParts (Interview tab: n of 5 ready)', () => {
  it('counts N-400, Speaking, Reading, Writing and Civics', async () => {
    const { readyParts } = await import('./interviewReadiness');
    const none = readyParts({});
    expect(none.parts.map((p) => p.id)).toEqual(['n400', 'speaking', 'reading', 'writing', 'civics']);
    expect([none.readyCount, none.total]).toEqual([0, 5]);
    const some = readyParts({
      levels: { reading: 'strong', writing: 'getting_there', civics: 'strong' },
      sessions: [{ created_date: '2026-11-01', overall_score: 40, passed: false }, { created_date: '2026-11-10', overall_score: 85, passed: true }],
      n400Read: 6, n400Total: 7,
    });
    expect(some.parts.filter((p) => p.ready).map((p) => p.id)).toEqual(['speaking', 'reading', 'civics']);
    expect(readyParts({ n400Read: 7, n400Total: 7 }).parts[0].ready).toBe(true);
  });

  it('speaking follows the latest interview, not the best', async () => {
    const { readyParts } = await import('./interviewReadiness');
    const r = readyParts({ sessions: [{ created_date: '2026-11-01', overall_score: 90, passed: true }, { created_date: '2026-11-10', overall_score: 30, passed: false }] });
    expect(r.parts.find((p) => p.id === 'speaking').ready).toBe(false);
  });
});
