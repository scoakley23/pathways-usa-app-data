// Pure helpers for the owner's monthly "copy N-400 times" bookmark
// (scripts/uscis/copy-n400-times.js). They read the JSON that the USCIS
// processing-times page itself loads, in the owner's own browser. This file
// has NO imports and uses no browser or Node APIs: the bookmark build
// (scripts/uscis/build-bookmarklet.mjs) inlines it as-is, minus `export`.
//
// The app never runs this against USCIS: learners' devices only read the
// bundled content/uscis/n400-processing-times.json.
//
// The page (a Next.js app, seen Nov 26, 2026) asks for its data with
// "server actions": POSTs to the page's own address whose action code changes
// whenever USCIS updates the site. So the helper learns from one real request
// the owner makes by hand, then repeats it for each office. USCIS's data
// format isn't documented, so these look for shapes instead of fixed field
// names, and say plainly when they can't tell (the bookmark then stops and
// shows what it saw, for the owner to send to a developer).

/** Every plain object inside a JSON value, depth first. */
export function objectsIn(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => objectsIn(v, out));
  else if (value && typeof value === 'object') {
    out.push(value);
    Object.values(value).forEach((v) => objectsIn(v, out));
  }
  return out;
}

/** Every string inside a JSON value. */
export function stringsIn(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => stringsIn(v, out));
  return out;
}

const STATE_AT_END = /^(.*\S)[\s,]+([A-Z]{2})$/;

/** "Chicago IL" / "Chicago, IL" → { name: 'Chicago', state: 'IL' }; null if there's no state at the end. */
export function splitOfficeName(text) {
  const m = STATE_AT_END.exec(String(text || '').trim());
  return m ? { name: m[1].replace(/,$/, '').trim(), state: m[2] } : null;
}

/** "Minneapolis-St. Paul" + "MN" → "minneapolis-st-paul-mn" (the app's office ids). */
export function officeId(name, state) {
  return `${name}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Same office? Compares "name state" with case, commas, dots and spaces ignored. */
export const sameOffice = (a, b) => {
  const key = (o) => `${o.name} ${o.state}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return key(a) === key(b);
};

/**
 * The data in a Next.js server-action reply (what the USCIS page gets back):
 * lines like `0:{…}` and `1:{"data":{…}}`. Returns every line that is JSON,
 * as an array. Plain JSON text works too.
 */
export function parseRsc(text) {
  const t = String(text || '').trim();
  try { return [JSON.parse(t)]; } catch { /* not plain JSON: read it line by line */ }
  const out = [];
  for (const line of t.split('\n')) {
    const m = /^[0-9a-zA-Z]+:(.*)$/.exec(line);
    if (!m) continue;
    try { out.push(JSON.parse(m[1])); } catch { /* not JSON (a module reference or text) */ }
  }
  return out;
}

/**
 * Learns the office list from one real example. `args` is what the page sent
 * when the owner asked for ONE office's time (e.g. ["N-400", "160A", "BOS"]);
 * `json` is an earlier reply that listed the offices. Finds the office the
 * owner picked (an object holding one of `args` plus a "City ST" name),
 * learns which fields hold the code and the name, and reads every office the
 * same way. Returns { offices: [{ code, label, name, state }], codeIndex }
 * (where the office code sits in `args`), or null.
 */
export function officesFromExample(json, args) {
  const wanted = (Array.isArray(args) ? args : []).filter((a) => typeof a === 'string');
  for (const o of objectsIn(json)) {
    const strings = Object.entries(o).filter(([, v]) => typeof v === 'string');
    const code = strings.find(([, v]) => wanted.includes(v));
    const label = strings.find(([k, v]) => k !== code?.[0] && splitOfficeName(v));
    if (!code || !label) continue;
    const [codeKey] = code;
    const [labelKey] = label;
    const seen = new Set();
    const offices = [];
    for (const x of objectsIn(json)) {
      const c = x[codeKey];
      const l = x[labelKey];
      if (typeof c !== 'string' || typeof l !== 'string' || !splitOfficeName(l) || seen.has(c)) continue;
      seen.add(c);
      offices.push({ code: c, label: l, ...splitOfficeName(l) });
    }
    return { offices, codeIndex: args.indexOf(code[1]) };
  }
  return null;
}

const WITHIN = /within\s+(\d+(?:\.\d+)?)\s+months?/i;

/**
 * The months in one office's USCIS reply. The page (Nov 26, 2026) gets
 * `range: [{ unit: "Months", value: 18 }, { unit: "Months", value: 15.5 }]`
 * (twice: under processingTime and under the N-400 subtype) and SHOWS the last
 * value, "80% of cases are completed within 15.5 Months", which is also the
 * smallest. Rules: every range in the reply must be the same; the shown
 * number is the last one and must be the smallest; a "suppressed" office has
 * no time. Older shapes: a "within N months" sentence. Returns
 * { months, range, text } or { problem, seen }.
 */
export function findMonths(json) {
  const ranges = [];
  let suppressed = false;
  for (const o of objectsIn(json)) {
    if (o.suppressed === true) suppressed = true;
    for (const [k, v] of Object.entries(o)) {
      if (!/range/i.test(k) || !Array.isArray(v) || !v.length) continue;
      const months = v.filter((x) => x && /month/i.test(String(x.unit ?? x.unitEn ?? '')) && x.value !== null && x.value !== '' && !Number.isNaN(Number(x.value)));
      if (months.length === v.length) ranges.push(months.map((x) => Number(x.value)));
    }
  }
  if (suppressed) return { problem: 'USCIS shows no time for this office ("suppressed")', seen: [] };
  if (ranges.length) {
    if (ranges.some((r) => JSON.stringify(r) !== JSON.stringify(ranges[0]))) return { problem: 'the reply has different ranges', seen: ranges };
    const range = ranges[0];
    const shown = range[range.length - 1];
    if (shown !== Math.min(...range)) return { problem: 'the last number in the range is not the smallest', seen: range };
    return { months: shown, range, text: null };
  }
  const sentences = [...new Set(stringsIn(json).filter((x) => WITHIN.test(x)).map((x) => x.trim()))];
  const fromText = [...new Set(sentences.map((x) => Number(WITHIN.exec(x)[1])))];
  if (fromText.length === 1) return { months: fromText[0], range: null, text: sentences[0] };
  if (fromText.length > 1) return { problem: 'more than one "within N months" sentence', seen: sentences };
  return { problem: 'no months found', seen: [] };
}

/** "Last Updated: November 20, 2026" from a USCIS reply, or null. */
export function findUpdated(json) {
  const hit = stringsIn(json).find((x) => /^last updated:/i.test(x.trim()));
  return hit ? hit.trim().replace(/^last updated:\s*/i, '') : null;
}

/** Whole or half months, 1–60: what the app accepts (same rule as isUscisMonths()). */
export const okMonths = (n) => typeof n === 'number' && Number.isInteger(n * 2) && n >= 1 && n <= 60;
