import { describe, it, expect } from 'vitest';
import { recentResults, lowSkills, adjustedLevels, weakestSkill, nextEnglishMix, checkIns } from './checkIns';

const d = (s) => new Date(`${s}T12:00:00`);
const today = d('2026-11-20');
const row = (type, result, when = '2026-11-18') => ({ content_type: type, last_result: result, last_practiced: `${when}T10:00:00` });

describe('recentResults', () => {
  it('counts the last 7 days per skill', () => {
    const r = recentResults({
      progress: [row('civics_question', 'correct'), row('civics_question', 'incorrect'), row('civics_question', 'correct', '2026-11-01'), row('sentence', 'correct')],
      sessions: [{ created_date: '2026-11-19T10:00:00', overall_score: 80 }, { created_date: '2026-11-19T11:00:00', overall_score: 40 }],
      today,
    });
    expect(r.civics).toMatchObject({ attempts: 2, correct: 1, rate: 0.5 });
    expect(r.reading.attempts).toBe(1);
    expect(r.writing.attempts).toBe(1);
    expect(r.speaking).toMatchObject({ attempts: 2, rate: 0.5 });
  });
});

describe('lowSkills', () => {
  const recent = { civics: { attempts: 5, rate: 0.4 }, reading: { attempts: 5, rate: 0.9 }, writing: { attempts: 0, rate: null }, speaking: { attempts: 1, rate: 0 } };
  it('needs the plan to have run a week', () => {
    expect(lowSkills({ recent, planStart: d('2026-11-18'), today })).toEqual([]);
  });
  it('flags low recent results and untouched "Start here" skills', () => {
    expect(lowSkills({ levels: { writing: 'start_here', speaking: 'getting_there' }, recent, planStart: d('2026-11-01'), today })).toEqual(['civics', 'writing']);
  });
  it('moves low skills to "Start here" in the plan', () => {
    expect(adjustedLevels({ civics: 'strong', reading: 'strong' }, ['civics'])).toEqual({ civics: 'start_here', reading: 'strong' });
  });
});

describe('helpers', () => {
  it('finds the weakest checked skill', () => {
    expect(weakestSkill({ civics: 'strong', reading: 'getting_there', writing: 'start_here', speaking: null })).toBe('writing');
    expect(weakestSkill({})).toBeNull();
  });
  it('moves the English mix up one step', () => {
    expect(nextEnglishMix('mostly_mine')).toBe('half');
    expect(nextEnglishMix('half')).toBe('mostly_english');
    expect(nextEnglishMix('mostly_english')).toBeNull();
  });
});

describe('checkIns', () => {
  it('welcomes back after missed days, without guilt', () => {
    expect(checkIns({ missedDays: 2, today })[0].kind).toBe('welcome-back');
    expect(checkIns({ missedDays: 0, today })).toEqual([]);
  });
  it('offers a re-check of the weakest skill every 2 weeks', () => {
    const c = checkIns({ levels: { civics: 'strong', speaking: 'start_here' }, checkedAt: '2026-11-05T10:00:00', today });
    expect(c.find((x) => x.kind === 'recheck').skill).toBe('speaking');
    expect(checkIns({ levels: { speaking: 'start_here' }, checkedAt: '2026-11-10T10:00:00', today }).some((x) => x.kind === 'recheck')).toBe(false);
  });
  it('suggests more English when scores are high, not for English learners', () => {
    const levels = { civics: 'strong', reading: 'strong', writing: 'strong', speaking: 'getting_there' };
    expect(checkIns({ levels, englishMix: 'mostly_mine', language: 'es', today })[0]).toMatchObject({ kind: 'english-mix', next: 'half' });
    expect(checkIns({ levels, englishMix: 'mostly_mine', language: 'en', today })).toEqual([]);
    expect(checkIns({ levels, englishMix: 'mostly_english', language: 'es', today })).toEqual([]);
  });
  it('hides messages the learner closed today', () => {
    expect(checkIns({ missedDays: 1, today, dismissed: ['welcome-back'] })).toEqual([]);
  });
});
