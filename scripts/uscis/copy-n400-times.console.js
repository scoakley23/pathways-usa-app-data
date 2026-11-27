// Built by scripts/uscis/build-bookmarklet.mjs. Do not edit; edit the sources and rebuild.
(function () {
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
function objectsIn(value, out = []) {
  if (Array.isArray(value)) value.forEach((v) => objectsIn(v, out));
  else if (value && typeof value === 'object') {
    out.push(value);
    Object.values(value).forEach((v) => objectsIn(v, out));
  }
  return out;
}

/** Every string inside a JSON value. */
function stringsIn(value, out = []) {
  if (typeof value === 'string') out.push(value);
  else if (value && typeof value === 'object') Object.values(value).forEach((v) => stringsIn(v, out));
  return out;
}

const STATE_AT_END = /^(.*\S)[\s,]+([A-Z]{2})$/;

/** "Chicago IL" / "Chicago, IL" → { name: 'Chicago', state: 'IL' }; null if there's no state at the end. */
function splitOfficeName(text) {
  const m = STATE_AT_END.exec(String(text || '').trim());
  return m ? { name: m[1].replace(/,$/, '').trim(), state: m[2] } : null;
}

/** "Minneapolis-St. Paul" + "MN" → "minneapolis-st-paul-mn" (the app's office ids). */
function officeId(name, state) {
  return `${name}-${state}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/** Same office? Compares "name state" with case, commas, dots and spaces ignored. */
const sameOffice = (a, b) => {
  const key = (o) => `${o.name} ${o.state}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return key(a) === key(b);
};

/**
 * The field offices in a USCIS "offices" answer: objects with a code and a
 * "City ST" description. Returns [{ code, label, name, state }], or [] when
 * nothing looks like an office.
 */
function findOffices(json) {
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
function findSubtypes(json) {
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
function findMonths(json) {
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
const okMonths = (n) => typeof n === 'number' && Number.isInteger(n * 2) && n >= 1 && n <= 60;

// "Pathways: copy N-400 times" — the owner's monthly helper.
//
// Runs ONLY in the owner's own browser, on https://egov.uscis.gov/processing-times/,
// started by hand from a bookmark (or pasted into the browser console). It
// asks USCIS the same questions the page asks when you click through it
// (form N-400 → the field offices → each office's time), one office every
// 3 seconds, and shows a table to spot-check and copy. It sends nothing
// anywhere else, saves nothing, and needs no sign-in. Never run it from a
// server or put it in the app: learners' devices never contact USCIS.
//
// The functions objectsIn, stringsIn, splitOfficeName, findOffices,
// findSubtypes, findMonths and okMonths come from src/lib/uscisTimesParse.js;
// scripts/uscis/build-bookmarklet.mjs puts both files together
// (npm run uscis:bookmarklet). USCIS's data format isn't documented, so when
// something doesn't look as expected the helper stops and shows what it saw:
// paste that to a developer.

async function copyN400Times() {
  const FORM = 'N-400';
  const API = '/processing-times/api/';
  const WAIT_MS = 3000;
  const MAX_ERRORS_IN_A_ROW = 3;

  if (location.hostname !== 'egov.uscis.gov') {
    alert('Open https://egov.uscis.gov/processing-times/ first, then click the bookmark again.');
    return;
  }
  if (document.getElementById('pathways-n400-helper')) return;

  // ---- The panel (plain DOM; every value is set as text, never as HTML) ----
  const el = (tag, style, text) => {
    const e = document.createElement(tag);
    if (style) e.style.cssText = style;
    if (text != null) e.textContent = text;
    return e;
  };
  const panel = el('div', 'position:fixed;top:12px;right:12px;bottom:12px;width:min(560px,calc(100vw - 24px));z-index:2147483647;background:#fff;color:#1f2a44;border:2px solid #1f2a44;border-radius:12px;font:14px/1.4 system-ui,sans-serif;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,.25)');
  panel.id = 'pathways-n400-helper';
  const head = el('div', 'padding:12px 14px;border-bottom:1px solid #d9d2c3;display:flex;gap:8px;align-items:center');
  head.append(el('strong', 'flex:1', 'Pathways: copy N-400 times'));
  const stopBtn = el('button', 'padding:6px 10px', 'Stop');
  const closeBtn = el('button', 'padding:6px 10px', 'Close');
  head.append(stopBtn, closeBtn);
  const status = el('div', 'padding:10px 14px;border-bottom:1px solid #d9d2c3');
  const body = el('div', 'flex:1;overflow:auto;padding:0 14px');
  const table = el('table', 'width:100%;border-collapse:collapse;font-size:13px');
  body.append(table);
  const foot = el('div', 'padding:10px 14px;border-top:1px solid #d9d2c3;display:flex;flex-direction:column;gap:8px');
  const out = el('textarea', 'width:100%;height:90px;font:12px monospace');
  out.readOnly = true;
  out.placeholder = 'The result appears here when the run is done.';
  const copyBtn = el('button', 'padding:8px 12px;font-weight:bold', 'Copy result');
  copyBtn.disabled = true;
  foot.append(out, copyBtn);
  panel.append(head, status, body, foot);
  document.body.append(panel);

  let stopped = false;
  stopBtn.onclick = () => { stopped = true; say('Stopped. Nothing was copied.'); };
  closeBtn.onclick = () => { stopped = true; panel.remove(); };
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(out.value); copyBtn.textContent = 'Copied'; } catch { out.select(); document.execCommand('copy'); copyBtn.textContent = 'Copied'; }
  };
  const say = (text) => { status.textContent = text; };
  const row = (cells, bold) => {
    const tr = el('tr', 'border-bottom:1px solid #eee');
    cells.forEach((c) => tr.append(el(bold ? 'th' : 'td', 'text-align:left;padding:4px 6px;vertical-align:top', c)));
    table.append(tr);
    tr.scrollIntoView({ block: 'nearest' });
    return tr;
  };

  // Shows what USCIS answered and stops, so the owner can paste it to a developer.
  const stopWith = (step, url, detail) => {
    stopped = true;
    say(`Stopped at "${step}". Copy the box below and send it to your developer; nothing was saved.`);
    out.value = JSON.stringify({ tool: 'pathways-copy-n400-times', stopped_at: step, url, detail: String(detail).slice(0, 3000) }, null, 2);
    copyBtn.disabled = false;
  };

  const get = async (path) => {
    const url = API + path;
    const res = await fetch(url, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    const text = await res.text();
    if (!res.ok) throw Object.assign(new Error(`HTTP ${res.status}`), { url, text });
    try { return JSON.parse(text); } catch { throw Object.assign(new Error('not JSON'), { url, text }); }
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---- 1. The N-400 subtype ----
  say('Step 1 of 3: asking USCIS for form N-400…');
  let subtype;
  try {
    const subtypes = findSubtypes(await get(`formtypes/${FORM}`));
    if (subtypes.length !== 1) return stopWith('form N-400', API + `formtypes/${FORM}`, `Expected one N-400 type, found: ${JSON.stringify(subtypes)}`);
    [subtype] = subtypes;
  } catch (e) { return stopWith('form N-400', e.url, `${e.message}\n${e.text || ''}`); }

  // ---- 2. The field offices ----
  await wait(WAIT_MS);
  if (stopped) return;
  say('Step 2 of 3: asking USCIS for the field offices…');
  let offices;
  try {
    const json = await get(`formoffices/${FORM}/${subtype}`);
    offices = findOffices(json);
    if (offices.length < 10) return stopWith('field offices', API + `formoffices/${FORM}/${subtype}`, `Found ${offices.length} offices.\n${JSON.stringify(json).slice(0, 2500)}`);
  } catch (e) { return stopWith('field offices', e.url, `${e.message}\n${e.text || ''}`); }

  // ---- 3. Each office's time, slowly ----
  row(['Office', 'USCIS shows', 'Months', ''], true);
  const results = [];
  let errorsInARow = 0;
  for (let i = 0; i < offices.length; i += 1) {
    if (stopped) return;
    const o = offices[i];
    const minutesLeft = Math.ceil(((offices.length - i) * WAIT_MS) / 60000);
    say(`Step 3 of 3: office ${i + 1} of ${offices.length} (about ${minutesLeft} min left). You can keep this tab open and do something else.`);
    await wait(WAIT_MS);
    const path = `processingtime/${FORM}/${o.code}/${subtype}`;
    let r;
    try {
      const found = findMonths(await get(path));
      errorsInARow = 0;
      r = found.problem
        ? { ...o, months: null, text: null, problem: `${found.problem}: ${JSON.stringify(found.seen).slice(0, 200)}` }
        : { ...o, months: found.months, text: found.text, problem: okMonths(found.months) ? null : `unexpected months: ${found.months}` };
    } catch (e) {
      errorsInARow += 1;
      if (errorsInARow >= MAX_ERRORS_IN_A_ROW) return stopWith(`office ${o.label}`, e.url, `${MAX_ERRORS_IN_A_ROW} errors in a row. Last: ${e.message}\n${e.text || ''}`);
      r = { ...o, months: null, text: null, problem: `could not read (${e.message})` };
    }
    results.push(r);
    const tr = row([r.label, r.text || '', r.months == null ? '' : String(r.months), r.problem ? 'Check' : '']);
    if (r.problem) tr.style.background = '#fff4c2';
  }

  // ---- Done ----
  const d = new Date();
  const readOn = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  out.value = JSON.stringify({
    tool: 'pathways-copy-n400-times', version: 1, form: FORM, subtype, read_on: readOn,
    source_url: 'https://egov.uscis.gov/processing-times/',
    offices: results.map(({ code, label, name, state, months, text, problem }) => ({ code, label, name, state, months, text, problem })),
  }, null, 1);
  copyBtn.disabled = false;
  const problems = results.filter((r) => r.problem).length;
  say(`Done: ${results.length} offices${problems ? `, ${problems} marked "Check"` : ''}. Spot-check two or three against the USCIS page, then "Copy result" and send it.`);
}

copyN400Times();
})();
