// A small in-memory stand-in for supabase-js's query builder, for the
// src/api tests only (never imported by the app). Supports what the data
// modules use: select (incl. count/head), eq, gte, order, range, limit,
// insert, update, upsert (onConflict, ignoreDuplicates), delete, single,
// maybeSingle, rpc. `calls` records every query that ran.
export function fakeSupabase(tables = {}, { rpc = {} } = {}) {
  const calls = [];
  let nextId = 1;
  const from = (table) => {
    const state = { table, op: 'select', filters: [], order: [], range: null, limit: null, payload: null, opts: null, head: false, single: false, maybe: false };
    const q = {
      select(_cols, opts) { if (opts?.head) state.head = true; return q; },
      eq(col, val) { state.filters.push([col, 'eq', val]); return q; },
      gte(col, val) { state.filters.push([col, 'gte', val]); return q; },
      order(col, { ascending = true } = {}) { state.order.push([col, ascending]); return q; },
      range(a, b) { state.range = [a, b]; return q; },
      limit(n) { state.limit = n; return q; },
      insert(payload) { state.op = 'insert'; state.payload = payload; return q; },
      update(payload) { state.op = 'update'; state.payload = payload; return q; },
      upsert(payload, opts = {}) { state.op = 'upsert'; state.payload = payload; state.opts = opts; return q; },
      delete() { state.op = 'delete'; return q; },
      single() { state.single = true; return q; },
      maybeSingle() { state.maybe = true; return q; },
      then(resolve, reject) { return Promise.resolve().then(exec).then(resolve, reject); },
    };
    const one = (list) => (state.single || state.maybe ? list[0] ?? null : list);
    const exec = () => {
      calls.push(JSON.parse(JSON.stringify(state)));
      const rows = tables[table] || (tables[table] = []);
      const match = (r) => state.filters.every(([c, op, v]) => (op === 'eq' ? r[c] === v : r[c] >= v));
      const withId = (r) => ({ id: r.id ?? `id-${nextId++}`, ...r });
      if (state.op === 'insert') {
        const list = (Array.isArray(state.payload) ? state.payload : [state.payload]).map(withId);
        rows.push(...list);
        return { data: one(list), error: null };
      }
      if (state.op === 'upsert') {
        const keys = (state.opts.onConflict || 'id').split(',');
        const out = [];
        for (const p of Array.isArray(state.payload) ? state.payload : [state.payload]) {
          const hit = rows.find((r) => keys.every((k) => r[k] === p[k]));
          if (hit && state.opts.ignoreDuplicates) continue;
          if (hit) { Object.assign(hit, p); out.push(hit); } else { const r = withId(p); rows.push(r); out.push(r); }
        }
        return { data: one(out), error: null };
      }
      if (state.op === 'update') {
        const hit = rows.filter(match);
        hit.forEach((r) => Object.assign(r, state.payload));
        if (state.single && hit.length !== 1) return { data: null, error: { message: 'no row', code: 'PGRST116' } };
        return { data: one(hit), error: null };
      }
      if (state.op === 'delete') {
        tables[table] = rows.filter((r) => !match(r));
        return { data: null, error: null };
      }
      let out = rows.filter(match);
      if (state.head) return { data: null, count: out.length, error: null };
      for (const [col, asc] of [...state.order].reverse()) {
        out = [...out].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
      }
      if (state.range) out = out.slice(state.range[0], state.range[1] + 1);
      if (state.limit) out = out.slice(0, state.limit);
      return { data: one(out), error: null };
    };
    return q;
  };
  return {
    from,
    calls,
    tables,
    rpc: async (name, args) => {
      calls.push({ rpc: name, args });
      const r = rpc[name];
      if (r instanceof Error) return { data: null, error: r };
      return { data: typeof r === 'function' ? r(args) : r ?? null, error: null };
    },
  };
}
