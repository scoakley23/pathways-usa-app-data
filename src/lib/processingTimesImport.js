// Turns the result of the owner's "copy N-400 times" helper
// (scripts/uscis/copy-n400-times.js, run by hand in the owner's browser) into
// a new content/uscis/n400-processing-times.json. Pure: no files, no network.
// Used by scripts/uscis/apply-times.mjs (npm run uscis:apply -- <file>).
//
// Rules:
// - Office ids never change (they're saved on learners' phones). Offices are
//   matched by name and state ("Chicago" + "IL" = USCIS "Chicago IL").
// - Months are taken exactly as USCIS shows them (whole or half), one number
//   per office (min = max); anything else blocks the update.
// - A new office gets a new id and is listed; an office USCIS no longer lists
//   blocks the update unless the owner says to remove it (removeMissing),
//   because the file's new checked_on would otherwise make its old numbers
//   look freshly checked.
// - checked_on becomes the day the owner ran the helper (read_on).
import { officeId, okMonths, sameOffice } from './uscisTimesParse.js';

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @returns {{ ok: boolean, blockers: string[], data: object|null,
 *   changed: object[], unchanged: number, added: object[], missing: object[] }}
 */
export function planTimesUpdate(current, result, { removeMissing = false } = {}) {
  const blockers = [];
  if (!result || result.tool !== 'pathways-copy-n400-times') blockers.push('This is not the helper\'s result (no "tool": "pathways-copy-n400-times").');
  else if (result.stopped_at) blockers.push(`The helper stopped at "${result.stopped_at}": ${String(result.detail || '').slice(0, 300)}`);
  if (blockers.length) return { ok: false, blockers, data: null, changed: [], unchanged: 0, added: [], missing: [] };

  if (result.form !== 'N-400') blockers.push(`form is ${result.form}, not N-400`);
  if (!DATE.test(result.read_on || '')) blockers.push('read_on must be a date (YYYY-MM-DD)');
  const read = Array.isArray(result.offices) ? result.offices : [];
  if (read.length < 10) blockers.push(`only ${read.length} offices in the result`);

  for (const r of read) {
    const label = r.label || `${r.name} ${r.state}`;
    if (!r.name || !/^[A-Z]{2}$/.test(r.state || '')) blockers.push(`${label}: no office name and state`);
    else if (r.problem) blockers.push(`${label}: marked "Check" by the helper (${r.problem})`);
    else if (!okMonths(r.months)) blockers.push(`${label}: months must be whole or half, 1–60 (got ${r.months})`);
  }

  const real = (current.offices || []).filter((o) => !o.sample);
  const changed = [];
  const added = [];
  let unchanged = 0;
  const offices = [];
  const usedIds = new Set();

  for (const r of read) {
    const old = real.find((o) => sameOffice(o, r));
    if (old) {
      usedIds.add(old.id);
      const { needs_owner_check: _n, copied_on: _c, ...kept } = old; // the owner ran the helper: checked
      offices.push({ ...kept, min_months: r.months, max_months: r.months });
      if (old.min_months !== r.months || old.max_months !== r.months) changed.push({ id: old.id, from: old.max_months, to: r.months });
      else unchanged += 1;
    } else {
      let id = officeId(r.name, r.state);
      if (real.some((o) => o.id === id) || usedIds.has(id)) id = `${id}-2`;
      usedIds.add(id);
      offices.push({ id, name: r.name, state: r.state, min_months: r.months, max_months: r.months, sample: false });
      added.push({ id, name: r.name, state: r.state, months: r.months });
    }
  }

  const missing = real.filter((o) => !usedIds.has(o.id)).map(({ id, name, state }) => ({ id, name, state }));
  if (missing.length && !removeMissing) {
    blockers.push(`USCIS no longer lists ${missing.map((o) => o.id).join(', ')}. Check the USCIS page; to remove them, run again with --remove-missing.`);
  }

  const ok = blockers.length === 0;
  const data = ok ? {
    ...current,
    checked_on: result.read_on,
    offices: offices.sort((a, b) => `${a.state} ${a.name}`.localeCompare(`${b.state} ${b.name}`)),
  } : null;
  return { ok, blockers, data, changed, unchanged, added, missing };
}

/** The file as written to disk: one office per line, like the hand-made one. */
export function formatTimesFile(data) {
  const s = JSON.stringify(data, null, 2);
  return `${s.replace(/\{\n\s+("id"[\s\S]*?)\n\s+\}/g, (_, inner) => `{ ${inner.replace(/,\n\s+/g, ', ')} }`)}\n`;
}
