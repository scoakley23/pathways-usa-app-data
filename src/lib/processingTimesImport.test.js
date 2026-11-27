import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { planTimesUpdate, formatTimesFile } from './processingTimesImport';
import { processingProblems, PROCESSING_TIMES } from './interviewEstimate';

// Fake offices and fake helper results only.
const current = {
  note: 'n', source_url: 'https://egov.uscis.gov/processing-times/', checked_on: '2026-11-26',
  offices: Array.from({ length: 10 }, (_, i) => ({ id: `fake-${i}-tx`, name: `Fake ${i}`, state: 'TX', min_months: 12, max_months: 12, sample: false })),
};
const result = (offices, extra = {}) => ({
  tool: 'pathways-copy-n400-times', version: 1, form: 'N-400', read_on: '2026-12-20', ...extra,
  offices: offices.map((o) => ({ problem: null, text: null, code: 'X', label: `${o.name} ${o.state}`, ...o })),
});
const same = current.offices.map((o) => ({ name: o.name, state: o.state, months: 12 }));

describe('applying the helper\'s result', () => {
  it('updates months, keeps ids and sets checked_on to the day it was read', () => {
    const read = same.map((o, i) => (i === 0 ? { ...o, months: 14.5 } : o));
    const plan = planTimesUpdate(current, result(read));
    expect(plan.ok).toBe(true);
    expect(plan.changed).toEqual([{ id: 'fake-0-tx', from: 12, to: 14.5 }]);
    expect(plan.unchanged).toBe(9);
    expect(plan.data.checked_on).toBe('2026-12-20');
    expect(plan.data.offices.find((o) => o.id === 'fake-0-tx')).toMatchObject({ min_months: 14.5, max_months: 14.5 });
    expect(processingProblems(plan.data)).toEqual([]);
  });

  it('adds a new office with a new id and lists it', () => {
    const plan = planTimesUpdate(current, result([...same, { name: 'New Place', state: 'KS', months: 13 }]));
    expect(plan.ok).toBe(true);
    expect(plan.added).toEqual([{ id: 'new-place-ks', name: 'New Place', state: 'KS', months: 13 }]);
  });

  it('blocks when USCIS no longer lists an office, unless told to remove it', () => {
    const plan = planTimesUpdate(current, result(same.slice(1).concat({ name: 'Other', state: 'KS', months: 13 })));
    expect(plan.ok).toBe(false);
    expect(plan.blockers.join(' ')).toMatch(/fake-0-tx/);
    const removed = planTimesUpdate(current, result(same.slice(1).concat({ name: 'Other', state: 'KS', months: 13 })), { removeMissing: true });
    expect(removed.ok).toBe(true);
    expect(removed.data.offices.some((o) => o.id === 'fake-0-tx')).toBe(false);
  });

  it('blocks on anything the helper marked "Check", odd months, or a stopped run', () => {
    expect(planTimesUpdate(current, result(same.map((o, i) => (i ? o : { ...o, months: null, problem: 'no months found' })))).ok).toBe(false);
    expect(planTimesUpdate(current, result(same.map((o, i) => (i ? o : { ...o, months: 14.25 })))).ok).toBe(false);
    expect(planTimesUpdate(current, { tool: 'pathways-copy-n400-times', stopped_at: 'form N-400', detail: 'x' }).blockers[0]).toMatch(/stopped/);
    expect(planTimesUpdate(current, { offices: [] }).ok).toBe(false);
    expect(planTimesUpdate(current, result(same, { read_on: 'today' })).ok).toBe(false);
  });

  it('writes the file in the same layout as the hand-made one', () => {
    const file = path.resolve(__dirname, '../../content/uscis/n400-processing-times.json');
    expect(formatTimesFile(PROCESSING_TIMES)).toBe(fs.readFileSync(file, 'utf8'));
  });
});
