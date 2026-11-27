// "Pathways: copy N-400 times" — the owner's monthly helper.
//
// Runs ONLY in the owner's own browser, on https://egov.uscis.gov/processing-times,
// started by hand from a bookmark (or pasted into the browser console). It
// sends nothing anywhere else, saves nothing, and needs no sign-in. Never run
// it from a server or put it in the app: learners' devices never contact USCIS.
//
// How it works (the page is a Next.js app; seen Nov 26, 2026): the page asks
// for its data with "server actions", POSTs to its own address carrying an
// action code that changes whenever USCIS updates the site. So the helper
// first WATCHES while the owner picks N-400 and one office by hand and clicks
// "Get processing time"; it learns from that one request how the page asks,
// then asks the same way for every other office, one every 3 seconds, and
// shows a table to spot-check and copy.
//
// The functions objectsIn, stringsIn, splitOfficeName, parseRsc,
// officesFromExample, findMonths, findUpdated and okMonths come from
// src/lib/uscisTimesParse.js; scripts/uscis/build-bookmarklet.mjs puts both
// files together (npm run uscis:bookmarklet). When something doesn't look as
// expected the helper stops and shows what it saw: paste that to a developer.

async function copyN400Times() {
  const WAIT_MS = 3000;
  const MAX_ERRORS_IN_A_ROW = 3;

  if (location.hostname !== 'egov.uscis.gov') {
    alert('Open https://egov.uscis.gov/processing-times first, then click the bookmark again.');
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
  const panel = el('div', 'position:fixed;top:12px;right:12px;bottom:12px;width:min(520px,calc(100vw - 24px));z-index:2147483647;background:#fff;color:#1f2a44;border:2px solid #1f2a44;border-radius:12px;font:14px/1.4 system-ui,sans-serif;display:flex;flex-direction:column;box-shadow:0 8px 30px rgba(0,0,0,.25)');
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

  const say = (text) => { status.textContent = text; };
  const row = (cells, bold) => {
    const tr = el('tr', 'border-bottom:1px solid #eee');
    cells.forEach((c) => tr.append(el(bold ? 'th' : 'td', 'text-align:left;padding:4px 6px;vertical-align:top', c)));
    table.append(tr);
    tr.scrollIntoView({ block: 'nearest' });
    return tr;
  };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // ---- Watching the page's own requests (undone as soon as we've learned) ----
  const pageFetch = window.fetch;
  const seen = []; // { url, headers, body, text }
  let learned = null;
  let stopped = false;
  const unwatch = () => { if (window.fetch !== pageFetch) window.fetch = pageFetch; };

  const plainHeaders = (h) => {
    const o = {};
    if (!h) return o;
    if (typeof h.forEach === 'function' && !Array.isArray(h)) h.forEach((v, k) => { o[k] = v; });
    else if (Array.isArray(h)) h.forEach(([k, v]) => { o[k] = v; });
    else Object.assign(o, h);
    for (const k of Object.keys(o)) if (/^cookie$/i.test(k)) delete o[k];
    return o;
  };
  const isAction = (headers) => Object.keys(headers).some((k) => /^next-action$/i.test(k));

  const stopWith = (step, detail) => {
    stopped = true;
    unwatch();
    say(`Stopped at "${step}". Copy the box below and send it to your developer; nothing was saved.`);
    out.value = JSON.stringify({
      tool: 'pathways-copy-n400-times', stopped_at: step, detail: String(detail).slice(0, 3000),
      seen: seen.map((s) => ({ body: String(s.body).slice(0, 200), reply: String(s.text).slice(0, 1500) })),
    }, null, 1);
    copyBtn.disabled = false;
  };

  stopBtn.onclick = () => {
    if (stopped) return;
    if (!learned && seen.length) { stopWith('watching (Stop pressed)', 'Stopped by hand while watching.'); return; }
    stopped = true; unwatch(); say('Stopped. Nothing was copied.');
  };
  closeBtn.onclick = () => { stopped = true; unwatch(); panel.remove(); };
  copyBtn.onclick = async () => {
    try { await navigator.clipboard.writeText(out.value); } catch { out.select(); document.execCommand('copy'); }
    copyBtn.textContent = 'Copied';
  };

  // The example: the last request whose reply has a time in months, plus an
  // earlier reply that lists the offices with the picked office in it.
  const tryToLearn = () => {
    for (let t = seen.length - 1; t >= 0; t -= 1) {
      let args;
      try { args = JSON.parse(seen[t].body); } catch { continue; }
      if (!Array.isArray(args)) continue;
      const months = findMonths(parseRsc(seen[t].text));
      if (months.problem) continue;
      for (let o = t - 1; o >= 0; o -= 1) {
        const found = officesFromExample(parseRsc(seen[o].text), args);
        if (found && found.offices.length >= 10 && found.codeIndex >= 0) return { ask: seen[t], args, ...found };
      }
    }
    return null;
  };

  window.fetch = async function watchedFetch(input, init) {
    const res = await pageFetch.apply(this, arguments);
    try {
      const headers = plainHeaders(init && init.headers);
      if (!learned && init && init.method === 'POST' && isAction(headers) && typeof init.body === 'string') {
        const url = typeof input === 'string' ? new URL(input || location.href, location.href).href : String(input.url || input);
        seen.push({ url, headers, body: init.body, text: await res.clone().text() });
        say(`Watching… seen ${seen.length} request${seen.length === 1 ? '' : 's'} from the page.`);
        learned = tryToLearn();
      }
    } catch { /* watching must never break the page */ }
    return res;
  };

  say('Step 1 of 2: on this page, pick Form "N-400", the form category, ANY one field office, then click "Get processing time". (If the office was already picked, pick another one.) I\'ll watch how the page asks.');

  // Wait for the owner's example (up to 10 minutes).
  for (let i = 0; i < 600 && !learned && !stopped; i += 1) await wait(1000);
  unwatch();
  if (stopped) return;
  if (!learned) return stopWith('watching', seen.length ? 'Saw the page\'s requests but couldn\'t find an office list and a time in months.' : 'Saw no requests from the page. Did you click "Get processing time"?');

  // ---- 2. Every office, slowly, the same way the page asked ----
  const { ask, args, offices, codeIndex } = learned;
  row(['Office', 'USCIS range', 'Shown', ''], true);
  const results = [];
  let errorsInARow = 0;
  let updated = findUpdated(parseRsc(ask.text));
  for (let i = 0; i < offices.length; i += 1) {
    if (stopped) return;
    const o = offices[i];
    const minutesLeft = Math.ceil(((offices.length - i) * WAIT_MS) / 60000);
    say(`Step 2 of 2: office ${i + 1} of ${offices.length} (about ${minutesLeft} min left). You can use another tab meanwhile.`);
    await wait(WAIT_MS);
    const mine = args.slice();
    mine[codeIndex] = o.code;
    let r;
    try {
      const res = await pageFetch(ask.url, { method: 'POST', headers: ask.headers, body: JSON.stringify(mine), credentials: 'same-origin' });
      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      const parsed = parseRsc(text);
      const found = findMonths(parsed);
      updated = updated || findUpdated(parsed);
      errorsInARow = 0;
      r = found.problem
        ? { ...o, months: null, range: null, text: null, problem: `${found.problem}: ${JSON.stringify(found.seen).slice(0, 200)}` }
        : { ...o, months: found.months, range: found.range, text: found.text, problem: okMonths(found.months) ? null : `unexpected months: ${found.months}` };
    } catch (e) {
      errorsInARow += 1;
      if (errorsInARow >= MAX_ERRORS_IN_A_ROW) return stopWith(`office ${o.label}`, `${MAX_ERRORS_IN_A_ROW} errors in a row. Last: ${e.message}`);
      r = { ...o, months: null, range: null, text: null, problem: `could not read (${e.message})` };
    }
    results.push(r);
    const tr = row([r.label, r.range ? r.range.join(' / ') : (r.text || ''), r.months == null ? '' : String(r.months), r.problem ? 'Check' : '']);
    if (r.problem) tr.style.background = '#fff4c2';
  }

  // ---- Done ----
  const d = new Date();
  const readOn = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  out.value = JSON.stringify({
    tool: 'pathways-copy-n400-times', version: 3, form: 'N-400', read_on: readOn, uscis_updated: updated,
    source_url: 'https://egov.uscis.gov/processing-times/',
    offices: results.map(({ code, label, name, state, months, range, text, problem }) => ({ code, label, name, state, months, range, text, problem })),
  }, null, 1);
  copyBtn.disabled = false;
  const problems = results.filter((x) => x.problem).length;
  say(`Done: ${results.length} offices${problems ? `, ${problems} marked "Check"` : ''}. Spot-check two or three against the USCIS page, then "Copy result" and send it.`);
}
