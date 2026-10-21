import { describe, it, expect, beforeEach } from 'vitest';
import { loadPlanSettings, savePlanChoice, loadDone, saveDone, touchVisit, ymd, TARGET_DATE_KEY } from './planSettings';

let store;
beforeEach(() => {
  store = {};
  globalThis.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
});
const d = (s) => new Date(`${s}T12:00:00`);

describe('plan settings (device only)', () => {
  it('has no plan on a new device', () => {
    expect(loadPlanSettings()).toBeNull();
  });
  it('saves a month as the middle of that month', () => {
    const p = savePlanChoice({ mode: 'date', month: '2027-03' }, d('2026-11-02'));
    expect(p.mode).toBe('date');
    expect(ymd(p.target)).toBe('2027-03-15');
    expect(store[TARGET_DATE_KEY]).toBe('2027-03-15');
  });
  it('"I don\'t know yet" means 12 weeks', () => {
    const p = savePlanChoice({ mode: 'unknown' }, d('2026-11-02'));
    expect(ymd(p.target)).toBe('2027-01-25');
  });
  it('"Just let me study" has no date', () => {
    savePlanChoice({ mode: 'date', month: '2027-03' }, d('2026-11-02'));
    const p = savePlanChoice({ mode: 'study' }, d('2026-11-02'));
    expect(p.target).toBeNull();
    expect(store[TARGET_DATE_KEY]).toBeUndefined();
  });
  it('treats a date set on the Progress page as a plan', () => {
    store[TARGET_DATE_KEY] = '2027-02-01';
    expect(loadPlanSettings().mode).toBe('date');
  });
  it('survives blocked storage', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); }, removeItem: () => { throw new Error('x'); } };
    expect(loadPlanSettings()).toBeNull();
    expect(() => savePlanChoice({ mode: 'unknown' })).not.toThrow();
    expect(loadDone(new Date())).toEqual([]);
    expect(touchVisit(new Date())).toBe(0);
  });
});

describe('done tasks and missed days', () => {
  it('keeps checkmarks per day', () => {
    saveDone(d('2026-11-02'), ['a']);
    expect(loadDone(d('2026-11-02'))).toEqual(['a']);
    expect(loadDone(d('2026-11-03'))).toEqual([]);
  });
  it('counts missed days once per day', () => {
    expect(touchVisit(d('2026-11-02'))).toBe(0);
    expect(touchVisit(d('2026-11-03'))).toBe(0);
    expect(touchVisit(d('2026-11-06'))).toBe(2);
    expect(touchVisit(d('2026-11-06'))).toBe(2); // same day, same answer
  });
});
