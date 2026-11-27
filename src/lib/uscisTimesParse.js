// Pure helpers for the owner's monthly "copy N-400 times" bookmark
// (scripts/uscis/copy-n400-times.js). They read the JSON that the USCIS
// processing-times page itself loads, in the owner's own browser. This file
// has NO imports and uses no browser or Node APIs: the bookmark build
// (scripts/uscis/build-bookmarklet.mjs) inlines it as-is, minus `export`.
//
// The app never runs this against USCIS: learners' devices only read the
// bundled content/uscis/n400-processing-times.json.
//
// USCIS's data format isn't documented, so these look for shapes instead of
// fixed field names, and say plainly when they can't tell (the bookmark then
// stops and shows what it saw, for the owner to send to a developer).

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
 * The field offices in a USCIS "offices" answer: objects with a code and a
 * "City ST" description. Returns [{ code, label, name, state }], or [] when
 * nothing looks like an office.
 */
export function findOffices(json) {
  const seen = new Set();
  const out = [];
  for (const o of objectsIn(json)) {
    const entries = Object.entries(o).filter(([, v]) => typeof v === 'string');
    const code = entries.find(([k, v]) => /code|id$/i.test(k) && /^[A-Z0-9]{2,6}$/.test(v));
    const label = entries.find(([k, v]) => /desc|name|label/i.test(k) && splitOfficeName(v));
    if (!code || !label || seen.has(code[1])) continue;
    seen.add(code[1]);
    out.push({ code: code[1], label: label[1], ...splitOfficeName(label[1]) });
  }
  return out;
}

/**
 * The N-400 form subtype codes in a USCIS "form types" answer (the page asks
 * for times per form, office and subtype). Returns the distinct codes found
 * under a key that names a form type or subtype.
 */
export function findSubtypes(json) {
  const codes = new Set();
  for (const o of objectsIn(json)) {
    for (const [k, v] of Object.entries(o)) {
      if (typeof v === 'string' && /form_?type|sub_?type|subtype_?code|form_?key/i.test(k) && /^[0-9A-Z][0-9A-Z-]{1,20}$/.test(v) && v !== 'N-400') codes.add(v);
    }
  }
  return [...codes];
}

const WITHIN = /within\s+(\d+(?:\.\d+)?)\s+months?/i;

/**
 * The months in one office's USCIS answer. Prefers the sentence USCIS shows
 * ("80% of cases are completed within 14.5 months"); otherwise numbers marked
 * as months ({ value: 14.5, unit: 'Months' }). Returns
 * { months, text } when there is exactly one answer, else { problem, seen }.
 */
export function findMonths(json) {
  const sentences = [...new Set(stringsIn(json).filter((s) => WITHIN.test(s)).map((s) => s.trim()))];
  const fromText = [...new Set(sentences.map((s) => Number(WITHIN.exec(s)[1])))];
  if (fromText.length === 1) return { months: fromText[0], text: sentences[0] };
  if (fromText.length > 1) return { problem: 'more than one "within N months" sentence', seen: sentences };

  const values = [];
  for (const o of objectsIn(json)) {
    const unit = Object.entries(o).find(([k, v]) => /unit/i.test(k) && typeof v === 'string');
    const value = Object.entries(o).find(([k, v]) => /value|time|range/i.test(k) && (typeof v === 'number' || /^\d+(\.\d+)?$/.test(String(v))));
    if (unit && /month/i.test(unit[1]) && value) values.push(Number(value[1]));
  }
  const distinct = [...new Set(values)];
  if (distinct.length === 1) return { months: distinct[0], text: null };
  if (distinct.length > 1) return { problem: 'more than one number of months', seen: distinct };
  return { problem: 'no months found', seen: [] };
}

/** Whole or half months, 1–60: what the app accepts (same rule as isUscisMonths()). */
export const okMonths = (n) => typeof n === 'number' && Number.isInteger(n * 2) && n >= 1 && n <= 60;
