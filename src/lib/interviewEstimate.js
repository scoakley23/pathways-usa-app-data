// "When's my interview?" (Amio v2, frame WhenInterview). Pure functions over
// the hand-checked USCIS processing times (content/uscis/n400-processing-
// times.json) and the learner's two answers, which stay on this device only:
// the field office and the filing month (browser storage, cleared by Delete
// my data; never in the database, a URL, the AI or any server). Nothing is
// ever fetched from USCIS. The months are when USCIS usually FINISHES an
// N-400 at that office, not the interview date; the interview usually comes
// before that. Always shown with "Estimate only. Not legal advice."
// Learners see the times only while the file's checked_on is at most
// STALE_DAYS old; after that they see "Coming soon" again (isStale()).
import TIMES from '../../content/uscis/n400-processing-times.json';

export { TIMES as PROCESSING_TIMES };
export const OFFICE_KEY = 'pathways_field_office';
export const FILED_KEY = 'pathways_filed_month'; // 'YYYY-MM' or 'not_filed'
export const NOT_FILED = 'not_filed';
export const USCIS_PROCESSING_URL = 'https://egov.uscis.gov/processing-times/';
export const USCIS_N400_URL = 'https://www.uscis.gov/n-400';

const MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;
const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* storage blocked */ } };

/** The learner's answers, from this device only. */
export function loadInterviewChoice() {
  const filed = get(FILED_KEY);
  return { officeId: get(OFFICE_KEY) || null, filed: filed === NOT_FILED || MONTH.test(filed || '') ? filed : null };
}

/** Saves the answers on this device only. `null` removes one. */
export function saveInterviewChoice({ officeId, filed }) {
  if (officeId !== undefined) set(OFFICE_KEY, officeId || null);
  if (filed !== undefined) set(FILED_KEY, filed === NOT_FILED || MONTH.test(filed || '') ? filed : null);
}

/**
 * True for an office learners may see: real (not a sample) and checked by the
 * owner (no `needs_owner_check`). Everything else is for admins and dev only.
 */
export const isCheckedOffice = (o) => !!o && !o.sample && o.needs_owner_check !== true;

/** How long a hand check stays good. After this, learners see "Coming soon". */
export const STALE_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * True when the file's `checked_on` is missing or more than STALE_DAYS old,
 * so learners never see old numbers if a monthly check is missed.
 */
export function isStale(data = TIMES, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(data?.checked_on || '');
  if (!m) return true;
  const checked = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12);
  return (now - checked) / DAY_MS > STALE_DAYS;
}

/**
 * Offices a learner may pick: real, checked ones only, and none while the
 * file is out of date (isStale()). `showSamples` (admins and dev) also shows
 * the sample offices, real ones still waiting for the owner's check
 * (`needs_owner_check: true`) and out-of-date ones.
 */
export function visibleOffices(data = TIMES, { showSamples = false, today = new Date() } = {}) {
  if (!showSamples && isStale(data, today)) return [];
  return (data.offices || [])
    .filter((o) => showSamples || isCheckedOffice(o))
    .sort((a, b) => `${a.state} ${a.name}`.localeCompare(`${b.state} ${b.name}`));
}

export const hasRealOffices = (data = TIMES) => visibleOffices(data).length > 0;

export function officeById(id, data = TIMES, opts = {}) {
  return visibleOffices(data, opts).find((o) => o.id === id) || null;
}

/** A month count USCIS may show: whole or half months (14.5), never rounded. */
export const isUscisMonths = (n) => typeof n === 'number' && Number.isInteger(n * 2) && n >= 1 && n <= 60;

// The filing day isn't known, so the filing month counts from its middle
// (the 15th). Whole months land mid-month; a half month lands on the last
// day of the month (middle + half a month), so 14.5 months from October 2026
// is the end of December 2027. Nothing is rounded.
const addMonths = (y, m, n) => {
  const whole = Math.floor(n);
  return n === whole
    ? new Date(y, m - 1 + whole, 15, 12)
    : new Date(y, m + whole, 0, 12); // day 0 of the next month = the last day
};

/**
 * { from, to, min, max, single } (dates mid-month) when the case is usually
 * finished, or null. `single`: USCIS shows one number (min = max), so the
 * screens say "by {month}" instead of "between … and …".
 */
export function estimateRange(office, filed) {
  const m = MONTH.exec(filed || '');
  if (!office || !m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return { from: addMonths(y, mo, office.min_months), to: addMonths(y, mo, office.max_months), min: office.min_months, max: office.max_months, single: office.min_months === office.max_months };
}

/** Today's "Case likely done" range from the saved answers, or null. */
export function savedRange(data = TIMES, opts = {}) {
  const { officeId, filed } = loadInterviewChoice();
  return estimateRange(officeById(officeId, data, opts), filed);
}

/** The last `n` months, newest first, as 'YYYY-MM' (the filing month picker). */
export function recentMonths(n = 36, today = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 15, 12);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

/** What's wrong with the processing-times file (checked by npm test). */
export function processingProblems(data = TIMES) {
  const out = [];
  const offices = data.offices || [];
  const real = offices.filter(isCheckedOffice);
  if (data.source_url !== USCIS_PROCESSING_URL) out.push('source_url must be the official USCIS processing times page');
  if (real.length && !DATE.test(data.checked_on || '')) out.push('real offices but no checked_on date (YYYY-MM-DD)');
  const ids = new Set();
  for (const o of offices) {
    const name = `office ${o.id || '(no id)'}`;
    if (!/^[a-z0-9-]+$/.test(o.id || '')) out.push(`${name}: id must be lowercase letters, numbers and dashes`);
    if (ids.has(o.id)) out.push(`${name}: duplicate id`);
    ids.add(o.id);
    if (o.sample !== true && o.sample !== false) out.push(`${name}: "sample" must be true or false`);
    if (o.sample === true && !/\(sample, not real\)/.test(o.name || '')) out.push(`${name}: a sample must say "(sample, not real)" in its name`);
    if (o.sample !== true && /sample/i.test(`${o.id} ${o.name}`)) out.push(`${name}: looks like a sample but isn't marked "sample": true`);
    if ('needs_owner_check' in o) {
      if (o.needs_owner_check !== true) out.push(`${name}: "needs_owner_check" must be true, or removed once the owner has checked it`);
      if (o.sample !== false) out.push(`${name}: an office waiting for the owner's check must be real ("sample": false)`);
      if (!DATE.test(o.copied_on || '')) out.push(`${name}: an office waiting for the owner's check needs copied_on (YYYY-MM-DD)`);
    } else if ('copied_on' in o) {
      out.push(`${name}: copied_on is only for offices waiting for the owner's check; use the file's checked_on`);
    }
    const ok = isUscisMonths(o.min_months) && isUscisMonths(o.max_months) && o.max_months >= o.min_months;
    if (!ok) out.push(`${name}: min_months / max_months must be whole or half months (e.g. 14.5), 1–60, max ≥ min`);
  }
  return out;
}

/** Admins (and a developer running the app locally) also see the sample and not-yet-checked offices. */
export function canSeeSampleOffices(user, env = import.meta.env) {
  return user?.role === 'admin' || !!env?.DEV;
}
