import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  findMonths, findOffices, findSubtypes, officeId, okMonths, sameOffice, splitOfficeName,
} from './uscisTimesParse';
import { isUscisMonths } from './interviewEstimate';
import { buildBundle, bookmarkFor, OUT_BOOKMARK, OUT_CONSOLE } from '../../scripts/uscis/build-bookmarklet.mjs';

// All USCIS answers below are made up: the real format isn't documented, so
// these are the shapes the helper is written to find.

describe('reading USCIS answers', () => {
  it('splits "City ST" office names and makes the app\'s ids', () => {
    expect(splitOfficeName('Chicago IL')).toEqual({ name: 'Chicago', state: 'IL' });
    expect(splitOfficeName('Minneapolis-St. Paul, MN')).toEqual({ name: 'Minneapolis-St. Paul', state: 'MN' });
    expect(splitOfficeName('National Benefits Center')).toBeNull();
    expect(officeId('Minneapolis-St. Paul', 'MN')).toBe('minneapolis-st-paul-mn');
    expect(sameOffice({ name: 'Minneapolis-St. Paul', state: 'MN' }, { name: 'Minneapolis St Paul', state: 'MN' })).toBe(true);
    expect(sameOffice({ name: 'Portland', state: 'OR' }, { name: 'Portland', state: 'ME' })).toBe(false);
  });

  it('finds the offices and the N-400 subtype', () => {
    const offices = { data: { form_offices: { offices: [
      { office_code: 'CHI', office_description: 'Chicago IL' },
      { office_code: 'CHI', office_description: 'Chicago IL' },
      { office_code: 'NBC', office_description: 'National Benefits Center' },
      { office_code: 'POM', office_description: 'Portland ME' },
    ] } } };
    expect(findOffices(offices)).toEqual([
      { code: 'CHI', label: 'Chicago IL', name: 'Chicago', state: 'IL' },
      { code: 'POM', label: 'Portland ME', name: 'Portland', state: 'ME' },
    ]);
    expect(findSubtypes({ data: { form_types: [{ form_name: 'N-400', form_type: '111A-NATZ' }] } })).toEqual(['111A-NATZ']);
  });

  it('takes the months exactly as USCIS shows them, or says it can\'t tell', () => {
    expect(findMonths({ note: '80% of cases are completed within 14.5 months' })).toEqual({ months: 14.5, text: '80% of cases are completed within 14.5 months' });
    expect(findMonths({ data: { subtypes: [{ range: [{ value: 13, unit: 'Months' }] }] } })).toEqual({ months: 13, text: null });
    expect(findMonths({ a: 'within 12 months', b: 'within 13 months' }).problem).toMatch(/more than one/);
    expect(findMonths({ range: [{ value: 12, unit: 'Months' }, { value: 15, unit: 'Months' }] }).problem).toMatch(/more than one/);
    expect(findMonths({ range: [{ value: 40, unit: 'Days' }] }).problem).toBe('no months found');
  });

  it('accepts the same months as the app', () => {
    for (const n of [1, 11, 14.5, 60, 0.5, 14.25, 61, '14']) expect(okMonths(n), String(n)).toBe(isUscisMonths(n));
  });
});

// A tiny stand-in for the browser page, enough for the helper's panel.
function fakePage(answers) {
  const made = [];
  const node = (tag) => {
    const n = { tag, style: {}, children: [], textContent: '', value: '', disabled: false, append: (...c) => n.children.push(...c), remove() {}, scrollIntoView() {}, select() {} };
    made.push(n);
    return n;
  };
  const asked = [];
  const env = {
    document: { createElement: node, getElementById: () => null, body: { append() {} }, execCommand() {} },
    location: { hostname: 'egov.uscis.gov' },
    alert: (m) => { throw new Error(`alert: ${m}`); },
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout: (fn) => fn(),
    fetch: async (url) => {
      asked.push(url);
      const body = answers(url);
      return { ok: body !== undefined, status: body === undefined ? 404 : 200, text: async () => JSON.stringify(body ?? {}) };
    },
  };
  const run = async () => {
    const source = buildBundle().replace(/copyN400Times\(\);\n\}\)\(\);\n$/, 'return copyN400Times();\n})();\n');
    // eslint-disable-next-line no-new-func
    await new Function(...Object.keys(env), `return ${source.replace(/^\/\/.*\n\(function/, '(function')}`)(...Object.values(env));
    const out = made.find((n) => n.tag === 'textarea');
    return { result: JSON.parse(out.value), asked };
  };
  return run;
}

describe('the helper (run against a fake USCIS page)', () => {
  const answers = (url) => {
    if (url.endsWith('formtypes/N-400')) return { data: { form_types: [{ form_type: '111A-NATZ' }] } };
    if (url.endsWith('formoffices/N-400/111A-NATZ')) {
      return { data: { offices: Array.from({ length: 12 }, (_, i) => ({ office_code: `F${i}`, office_description: `Fake City ${i} TX` })) } };
    }
    const m = /processingtime\/N-400\/F(\d+)\/111A-NATZ$/.exec(url);
    if (m) return { data: { text: `80% of cases are completed within ${10 + Number(m[1]) / 2} months` } };
    return undefined;
  };

  it('asks only the USCIS page\'s own addresses and returns every office', async () => {
    const { result, asked } = await fakePage(answers)();
    expect(asked.every((u) => u.startsWith('/processing-times/api/'))).toBe(true);
    expect(result.tool).toBe('pathways-copy-n400-times');
    expect(result.offices).toHaveLength(12);
    expect(result.offices[1]).toMatchObject({ name: 'Fake City 1', state: 'TX', months: 10.5, problem: null });
    expect(result.read_on).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('stops and shows what it saw when USCIS answers something unexpected', async () => {
    const { result } = await fakePage((url) => (url.endsWith('formtypes/N-400') ? { nothing: 'here' } : undefined))();
    expect(result.stopped_at).toBe('form N-400');
    expect(result.detail).toMatch(/Expected one N-400 type/);
  });
});

describe('the built bookmark', () => {
  it('is up to date (npm run uscis:bookmarklet)', () => {
    expect(fs.readFileSync(OUT_CONSOLE, 'utf8')).toBe(buildBundle());
    expect(fs.readFileSync(OUT_BOOKMARK, 'utf8')).toBe(`${bookmarkFor(buildBundle())}\n`);
  });

  it('only ever talks to USCIS\'s own page, never another site', () => {
    const src = fs.readFileSync(path.resolve(__dirname, '../../scripts/uscis/copy-n400-times.js'), 'utf8');
    expect(src).not.toMatch(/fetch\(\s*['"`]https?:/);
    expect(src).toMatch(/location\.hostname !== 'egov\.uscis\.gov'/);
  });
});
