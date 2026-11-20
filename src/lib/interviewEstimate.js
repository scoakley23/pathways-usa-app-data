// "When's my interview?" (Amio v2, frame WhenInterview). Pure functions over
// the hand-checked USCIS processing times (content/uscis/n400-processing-
// times.json) and the learner's two answers, which stay on this device only:
// the field office and the filing month (browser storage, cleared by Delete
// my data; never in the database, a URL, the AI or any server). Nothing is
// ever fetched from USCIS. The months are when USCIS usually FINISHES an
// N-400 at that office, not the interview date; the interview usually comes
// before that. Always shown with "Estimate only. Not legal advice."
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

/** Offices a learner may pick: real ones only; samples just for admins and dev. */
export function visibleOffices(data = TIMES, { showSamples = false } = {}) {
  return (data.offices || [])
    .filter((o) => showSamples || !o.sample)
    .sort((a, b) => `${a.state} ${a.name}`.localeCompare(`${b.state} ${b.name}`));
}

export const hasRealOffices = (data = TIMES) => visibleOffices(data).length > 0;

export function officeById(id, data = TIMES, opts = {}) {
  return visibleOffices(data, opts).find((o) => o.id === id) || null;
}

const addMonths = (y, m, n) => new Date(y, m - 1 + n, 15, 12);

/** { from, to } (dates mid-month) when the case is usually finished, or null. */
export function estimateRange(office, filed) {
  const m = MONTH.exec(filed || '');
  if (!office || !m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return { from: addMonths(y, mo, office.min_months), to: addMonths(y, mo, office.max_months), min: office.min_months, max: office.max_months };
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
  const real = offices.filter((o) => !o.sample);
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
    const ok = Number.isInteger(o.min_months) && Number.isInteger(o.max_months) && o.min_months > 0 && o.max_months >= o.min_months && o.max_months <= 60;
    if (!ok) out.push(`${name}: min_months / max_months must be whole months, 1–60, max ≥ min`);
  }
  return out;
}

/** Admins (and a developer running the app locally) also see the sample offices. */
export function canSeeSampleOffices(user, env = import.meta.env) {
  return user?.role === 'admin' || !!env?.DEV;
}
