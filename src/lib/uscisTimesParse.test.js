import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  findMonths, officeId, officesFromExample, okMonths, parseRsc, sameOffice, splitOfficeName,
} from './uscisTimesParse';
import { isUscisMonths } from './interviewEstimate';
import { buildBundle, bookmarkFor, OUT_BOOKMARK, OUT_CONSOLE } from '../../scripts/uscis/build-bookmarklet.mjs';

// The form-type reply below is the one the owner copied from the real page
// (Nov 26, 2026). The office and time replies are made up: their real shape
// isn't known yet, so these are the shapes the helper is written to find.
const REAL_FORM_REPLY = '0:{"a":"$@1","q":"","i":false,"b":"t6rfNxRVe-eJO4kiWpr_q"}\n1:{"data":{"items":[{"formKey":"160A","formType":"160A","formTypeDescriptionEn":"Application for Naturalization","formTypeDescriptionEs":"Solicitud de Naturalización"}],"errorMessage":null},"status":200,"actionErrorMessage":null,"actionErrorData":null}';

describe('reading USCIS answers', () => {
  it('splits "City ST" office names and makes the app\'s ids', () => {
    expect(splitOfficeName('Chicago IL')).toEqual({ name: 'Chicago', state: 'IL' });
    expect(splitOfficeName('Minneapolis-St. Paul, MN')).toEqual({ name: 'Minneapolis-St. Paul', state: 'MN' });
    expect(splitOfficeName('National Benefits Center')).toBeNull();
    expect(officeId('Minneapolis-St. Paul', 'MN')).toBe('minneapolis-st-paul-mn');
    expect(sameOffice({ name: 'Minneapolis-St. Paul', state: 'MN' }, { name: 'Minneapolis St Paul', state: 'MN' })).toBe(true);
    expect(sameOffice({ name: 'Portland', state: 'OR' }, { name: 'Portland', state: 'ME' })).toBe(false);
  });

  it('reads the page\'s Next.js replies', () => {
    const parsed = parseRsc(REAL_FORM_REPLY);
    expect(parsed).toHaveLength(2);
    expect(parsed[1].data.items[0].formKey).toBe('160A');
    expect(parseRsc('{"a":1}')).toEqual([{ a: 1 }]);
    expect(parseRsc('2:I["x"]\nnot a line')).toEqual([]);
  });

  it('learns the office list from the one office the owner picked', () => {
    const reply = [{ data: { items: [
      { officeCode: 'BOS', officeDescription: 'Boston MA' },
      { officeCode: 'CHI', officeDescription: 'Chicago IL' },
      { officeCode: 'CHI', officeDescription: 'Chicago IL' },
      { officeCode: 'NBC', officeDescription: 'National Benefits Center' },
    ] } }];
    expect(officesFromExample(reply, ['N-400', '160A', 'BOS'])).toEqual({
      codeIndex: 2,
      offices: [
        { code: 'BOS', label: 'Boston MA', name: 'Boston', state: 'MA' },
        { code: 'CHI', label: 'Chicago IL', name: 'Chicago', state: 'IL' },
      ],
    });
    expect(officesFromExample(parseRsc(REAL_FORM_REPLY), ['N-400', '160A', 'BOS'])).toBeNull(); // the form list isn't an office list
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

// A tiny stand-in for the browser page and its Next.js server actions.
const OFFICES = Array.from({ length: 12 }, (_, i) => ({ officeCode: `F${i}`, officeDescription: `Fake City ${i} TX` }));
const reply = (body) => {
  const args = JSON.parse(body);
  if (args.length === 1) return REAL_FORM_REPLY;
  if (args.length === 2) return `0:{"a":"$@1"}\n1:${JSON.stringify({ data: { items: OFFICES } })}`;
  const i = Number(String(args[2]).slice(1));
  return `0:{"a":"$@1"}\n1:${JSON.stringify({ data: { processingTime: { range: [{ value: 10 + i / 2, unit: 'Months' }] } } })}`;
};
const response = (text) => ({ ok: true, status: 200, text: async () => text, clone: () => response(text) });

function fakePage({ click = true } = {}) {
  const made = [];
  const node = (tag) => {
    const n = { tag, style: {}, textContent: '', value: '', disabled: false, append() {}, remove() {}, scrollIntoView() {}, select() {} };
    made.push(n);
    return n;
  };
  const asked = [];
  const window = {
    fetch: async (url, init) => { asked.push({ url, init }); return response(reply(init.body)); },
  };
  const env = {
    window,
    document: { createElement: node, getElementById: () => null, body: { append() {} }, execCommand() {} },
    location: { hostname: 'egov.uscis.gov', href: 'https://egov.uscis.gov/processing-times' },
    alert: (m) => { throw new Error(`alert: ${m}`); },
    navigator: { clipboard: { writeText: async () => {} } },
    setTimeout: (fn) => setTimeout(fn, 0),
    URL,
  };
  return async () => {
    const source = buildBundle().replace(/copyN400Times\(\);\n\}\)\(\);\n$/, 'return copyN400Times();\n})();\n');
    // eslint-disable-next-line no-new-func
    const running = new Function(...Object.keys(env), `return ${source.replace(/^\/\/.*\n\(function/, '(function')}`)(...Object.values(env));
    if (click) {
      // The owner picks N-400, the category and Fake City 3, then "Get processing time".
      const headers = { 'Next-Action': 'abc123', Accept: 'text/x-component', Cookie: 'secret' };
      for (const args of [['N-400'], ['N-400', '160A'], ['N-400', '160A', 'F3']]) {
        await window.fetch('', { method: 'POST', headers, body: JSON.stringify(args) });
      }
    }
    await running;
    const out = made.find((n) => n.tag === 'textarea');
    return { result: JSON.parse(out.value), asked, window };
  };
}

describe('the helper (run against a fake USCIS page)', () => {
  it('learns from the owner\'s one click, then asks the same way for every office', async () => {
    const { result, asked } = await fakePage()();
    expect(result.tool).toBe('pathways-copy-n400-times');
    expect(result.offices).toHaveLength(12);
    expect(result.offices[1]).toMatchObject({ name: 'Fake City 1', state: 'TX', months: 10.5, problem: null });
    const own = asked.slice(3);
    expect(own).toHaveLength(12);
    for (const a of own) {
      expect(a.url).toBe('https://egov.uscis.gov/processing-times'); // the page's own address only
      expect(a.init.headers['Next-Action']).toBe('abc123');
      expect(a.init.headers.Cookie).toBeUndefined(); // never copies cookies
    }
    expect(JSON.parse(own[5].init.body)).toEqual(['N-400', '160A', 'F5']);
  });

  it('stops and says what to do when the owner never asks for an office', async () => {
    const { result } = await fakePage({ click: false })();
    expect(result.stopped_at).toBe('watching');
    expect(result.detail).toMatch(/Get processing time/);
  });

  it('gives the page its own fetch back once it has learned', async () => {
    const page = fakePage();
    const { window } = await page();
    expect(window.fetch.name).not.toBe('watchedFetch');
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
