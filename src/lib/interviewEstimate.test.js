import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  PROCESSING_TIMES, STALE_DAYS, FILED_KEY, OFFICE_KEY, NOT_FILED, estimateRange, hasRealOffices, isCheckedOffice, loadInterviewChoice,
  isStale, officeById, processingProblems, recentMonths, saveInterviewChoice, visibleOffices, USCIS_PROCESSING_URL,
} from './interviewEstimate';

describe('the hand-checked processing times file', () => {
  it('has no problems', () => {
    expect(processingProblems(PROCESSING_TIMES)).toEqual([]);
  });

  it('never shows a sample office to learners', () => {
    for (const o of visibleOffices(PROCESSING_TIMES)) expect(o.sample, o.id).toBe(false);
    expect(visibleOffices(PROCESSING_TIMES, { showSamples: true }).length).toBeGreaterThanOrEqual(visibleOffices(PROCESSING_TIMES).length);
  });

  it('fails a real office without checked_on, a sample not marked as one, or bad months', () => {
    const base = { source_url: USCIS_PROCESSING_URL, checked_on: null };
    expect(processingProblems({ ...base, offices: [{ id: 'houston-tx', name: 'Houston TX', state: 'TX', min_months: 6, max_months: 9, sample: false }] }))
      .toContain('real offices but no checked_on date (YYYY-MM-DD)');
    expect(processingProblems({ ...base, offices: [{ id: 'sample-x', name: 'Sample X', state: '--', min_months: 6, max_months: 9, sample: false }] }).length).toBeGreaterThan(0);
    expect(processingProblems({ ...base, offices: [{ id: 'sample-y', name: 'Sample Y', state: '--', min_months: 6, max_months: 9, sample: true }] }).length).toBeGreaterThan(0);
    expect(processingProblems({ ...base, checked_on: '2026-11-20', offices: [{ id: 'a', name: 'A', state: 'TX', min_months: 9, max_months: 6, sample: false }] }).length).toBeGreaterThan(0);
    expect(processingProblems({ ...base, checked_on: '2026-11-20', offices: [{ id: 'a', name: 'A', state: 'TX', min_months: 6, max_months: 9, sample: false }] })).toEqual([]);
  });

  it('never shows an office waiting for the owner\'s check to learners', () => {
    for (const o of visibleOffices(PROCESSING_TIMES)) expect(o.needs_owner_check, o.id).toBeUndefined();
  });

  it('checks offices waiting for the owner: real, copied_on, and no checked_on needed yet', () => {
    const base = { source_url: USCIS_PROCESSING_URL, checked_on: null };
    const waiting = { id: 'city-st', name: 'City ST', state: 'ST', min_months: 6, max_months: 9, sample: false, needs_owner_check: true, copied_on: '2026-11-26' };
    expect(processingProblems({ ...base, offices: [waiting] })).toEqual([]);
    const { copied_on: _omit, ...noDate } = waiting;
    expect(processingProblems({ ...base, offices: [noDate] }).join(' ')).toMatch(/copied_on/);
    expect(processingProblems({ ...base, offices: [{ ...waiting, needs_owner_check: false }] }).join(' ')).toMatch(/must be true/);
    expect(processingProblems({ ...base, offices: [{ ...waiting, id: 'sample-z', name: 'Z (sample, not real)', sample: true }] }).join(' ')).toMatch(/must be real/);
    const checked = { id: 'a', name: 'A', state: 'TX', min_months: 6, max_months: 9, sample: false };
    expect(processingProblems({ ...base, checked_on: '2026-11-26', offices: [{ ...checked, copied_on: '2026-11-26' }] }).join(' ')).toMatch(/copied_on is only/);
    // Once a checked office is in, the file needs checked_on again.
    expect(processingProblems({ ...base, offices: [waiting, checked] })).toContain('real offices but no checked_on date (YYYY-MM-DD)');
  });

  it('is bundled, never fetched: no code asks USCIS for it', () => {
    const src = path.resolve(__dirname, '..');
    const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
    for (const f of walk(src).filter((f) => /\.(js|jsx)$/.test(f) && !f.endsWith('.test.js'))) {
      const text = fs.readFileSync(f, 'utf8');
      expect(/fetch\([^)]*uscis|axios[^)]*uscis/i.test(text), f).toBe(false);
    }
  });
});

describe('the estimate', () => {
  const office = { id: 'x', name: 'X', state: 'TX', min_months: 6, max_months: 9, sample: false };

  it('counts the USCIS months from the filing month', () => {
    const r = estimateRange(office, '2026-10');
    expect([r.from.getFullYear(), r.from.getMonth() + 1]).toEqual([2027, 4]);
    expect([r.to.getFullYear(), r.to.getMonth() + 1]).toEqual([2027, 7]);
    expect([r.min, r.max]).toEqual([6, 9]);
  });

  it('has no range without an office or a filing month', () => {
    expect(estimateRange(null, '2026-10')).toBeNull();
    expect(estimateRange(office, NOT_FILED)).toBeNull();
    expect(estimateRange(office, 'October')).toBeNull();
  });

  it('counts half months exactly, without rounding', () => {
    const at = (n, filed) => { const r = estimateRange({ ...office, min_months: n, max_months: n }, filed); return [r.to.getFullYear(), r.to.getMonth() + 1, r.to.getDate()]; };
    expect(at(14.5, '2026-10')).toEqual([2027, 12, 31]); // end of December 2027
    expect(at(14, '2026-10')).toEqual([2027, 12, 15]);
    expect(at(12.5, '2026-02')).toEqual([2027, 2, 28]); // short month: still February
    expect(at(0.5 + 11, '2025-12')).toEqual([2026, 11, 30]);
    expect(estimateRange({ ...office, min_months: 14.5, max_months: 14.5 }, '2026-10').max).toBe(14.5);
  });

  it('accepts half months in the file but nothing finer', () => {
    const base = { source_url: USCIS_PROCESSING_URL, checked_on: '2026-11-26' };
    const o = (min, max) => ({ id: 'a', name: 'A', state: 'TX', min_months: min, max_months: max, sample: false });
    expect(processingProblems({ ...base, offices: [o(14.5, 14.5)] })).toEqual([]);
    expect(processingProblems({ ...base, offices: [o(14.25, 14.25)] }).length).toBeGreaterThan(0);
    expect(processingProblems({ ...base, offices: [o(0.5, 1)] }).length).toBeGreaterThan(0);
    expect(processingProblems({ ...base, offices: [o('14.5', '14.5')] }).length).toBeGreaterThan(0);
  });

  it('says "by" when USCIS shows one number (min = max)', () => {
    expect(estimateRange(office, '2026-10').single).toBe(false);
    const r = estimateRange({ ...office, min_months: 7, max_months: 7 }, '2026-10');
    expect(r.single).toBe(true);
    expect([r.to.getFullYear(), r.to.getMonth() + 1]).toEqual([2027, 5]);
  });

  it('finds offices by id, hiding samples from learners', () => {
    const today = new Date(2026, 10, 27);
    const data = { checked_on: '2026-11-20', offices: [office, { ...office, id: 'sample-a', sample: true }] };
    expect(officeById('x', data, { today })).toBe(office);
    expect(officeById('sample-a', data)).toBeNull();
    expect(officeById('sample-a', data, { showSamples: true })).not.toBeNull();
    expect(hasRealOffices({ offices: [{ ...office, sample: true }] })).toBe(false);
  });

  it(`shows learners nothing once the hand check is over ${STALE_DAYS} days old`, () => {
    const data = { checked_on: '2026-10-01', offices: [office] };
    expect(isStale(data, new Date(2026, 10, 30))).toBe(false); // 60 days
    expect(isStale(data, new Date(2026, 11, 1))).toBe(true); // 61 days
    expect(isStale({ offices: [office] })).toBe(true); // no date
    expect(visibleOffices(data, { today: new Date(2026, 10, 30) })).toEqual([office]);
    expect(visibleOffices(data, { today: new Date(2026, 11, 1) })).toEqual([]); // learners: "Coming soon"
    expect(officeById('x', data, { today: new Date(2026, 11, 1) })).toBeNull();
    expect(visibleOffices(data, { today: new Date(2026, 11, 1), showSamples: true })).toEqual([office]); // admins and dev
  });

  it('hides an office waiting for the owner\'s check from learners, even when its id is saved', () => {
    const waiting = { ...office, id: 'waiting', needs_owner_check: true, copied_on: '2026-11-26' };
    const data = { offices: [waiting] };
    expect(visibleOffices(data)).toEqual([]);
    expect(officeById('waiting', data)).toBeNull();
    expect(estimateRange(officeById('waiting', data), '2026-10')).toBeNull();
    expect(hasRealOffices(data)).toBe(false); // learners keep "Coming soon"
    expect(officeById('waiting', data, { showSamples: true })).toBe(waiting); // admins and dev
    expect(isCheckedOffice(waiting)).toBe(false);
    expect(isCheckedOffice(office)).toBe(true);
  });

  it('lists recent months, newest first', () => {
    expect(recentMonths(3, new Date(2026, 0, 10))).toEqual(['2026-01', '2025-12', '2025-11']);
  });
});

describe('device-only answers', () => {
  const store = {};
  beforeEach(() => {
    Object.keys(store).forEach((k) => delete store[k]);
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it('saves the office and filing month on the device, under keys Delete my data clears', () => {
    saveInterviewChoice({ officeId: 'houston-tx', filed: '2026-10' });
    expect(store).toEqual({ [OFFICE_KEY]: 'houston-tx', [FILED_KEY]: '2026-10' });
    expect(loadInterviewChoice()).toEqual({ officeId: 'houston-tx', filed: '2026-10' });
    for (const k of [OFFICE_KEY, FILED_KEY]) expect(k.startsWith('pathways_')).toBe(true);
  });

  it('keeps only a month or "not filed", and removes on null', () => {
    saveInterviewChoice({ filed: 'March 3rd' });
    expect(loadInterviewChoice().filed).toBeNull();
    saveInterviewChoice({ filed: NOT_FILED, officeId: null });
    expect(loadInterviewChoice()).toEqual({ officeId: null, filed: NOT_FILED });
  });

  it('works when storage is blocked', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem: () => { throw new Error('blocked'); } };
    expect(() => saveInterviewChoice({ officeId: 'a', filed: '2026-01' })).not.toThrow();
    expect(loadInterviewChoice()).toEqual({ officeId: null, filed: null });
  });
});
