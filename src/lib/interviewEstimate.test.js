import { describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  PROCESSING_TIMES, FILED_KEY, OFFICE_KEY, NOT_FILED, estimateRange, hasRealOffices, loadInterviewChoice,
  officeById, processingProblems, recentMonths, saveInterviewChoice, visibleOffices, USCIS_PROCESSING_URL,
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

  it('finds offices by id, hiding samples from learners', () => {
    const data = { offices: [office, { ...office, id: 'sample-a', sample: true }] };
    expect(officeById('x', data)).toBe(office);
    expect(officeById('sample-a', data)).toBeNull();
    expect(officeById('sample-a', data, { showSamples: true })).not.toBeNull();
    expect(hasRealOffices({ offices: [{ ...office, sample: true }] })).toBe(false);
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
