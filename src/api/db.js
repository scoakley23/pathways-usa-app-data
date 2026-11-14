// Shared pieces for the src/api data modules (Standalone Step 3).
//
// The switch is the same one as sign-in (src/api/auth.js): with
// VITE_AUTH_PROVIDER=supabase every moved area reads and writes Supabase;
// otherwise it keeps Base44, so `standalone` keeps working while the areas
// move one PR at a time. Screens never import Base44 or Supabase for data;
// they call the module for their area (content.js, …).
import { AUTH_PROVIDER } from '@/api/auth';

export const DATA_PROVIDER = AUTH_PROVIDER;

// PostgREST returns at most 1,000 rows per request; read past that in pages.
export const PAGE_SIZE = 1000;

// A plain error a screen can show. Keeps Supabase's code for callers that
// need it (e.g. '42501' = not allowed).
export function dbError(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return null;
  const e = new Error(error.message || fallback);
  e.code = error.code;
  e.status = error.status;
  return e;
}

// Runs a Supabase query and throws a plain error if it failed.
export async function run(query) {
  const { data, error, count } = await query;
  if (error) throw dbError(error);
  return count !== undefined && count !== null && data === null ? count : data;
}

// Base44 sort strings ('order', '-order', 'name') → Supabase order(), using
// the table's column names.
export function applySort(query, sort, renames = {}) {
  if (!sort || typeof sort !== 'string') return query;
  const desc = sort.startsWith('-');
  const field = desc ? sort.slice(1) : sort;
  return query.order(renames[field] || field, { ascending: !desc, nullsFirst: false });
}

// Every row of a query, in pages of PAGE_SIZE. `build()` returns a fresh
// query each time (Supabase queries can't be reused once run).
export async function selectAll(build, { limit } = {}) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const want = limit ? Math.min(PAGE_SIZE, limit - rows.length) : PAGE_SIZE;
    if (want <= 0) break;
    const page = await run(build().range(from, from + want - 1));
    rows.push(...(page || []));
    if (!page || page.length < want) break;
  }
  return rows;
}
