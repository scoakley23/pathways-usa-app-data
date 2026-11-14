// Shared content through src/api/content.js (Standalone Step 3, PR 1), with
// fake Base44 and Supabase clients. Content only: no learner data here.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ AUTH_PROVIDER: 'base44' }));

const { createContentApi, CONTENT_TABLES, RENAMES, toRow, fromRow } = await import('./content');
const { TABLES } = await import('../../scripts/supabase/build-content-migration.mjs');

// A small stand-in for supabase-js's query builder over in-memory tables.
function fakeSupabase(tables) {
  const calls = [];
  const from = (table) => {
    const state = { table, op: 'select', filters: [], order: [], range: null, payload: null, head: false, single: false };
    const q = {
      select(_cols, opts) { if (opts?.head) { state.head = true; state.count = opts.count; } return q; },
      eq(col, val) { state.filters.push([col, val]); return q; },
      order(col, { ascending }) { state.order.push([col, ascending]); return q; },
      range(a, b) { state.range = [a, b]; return q; },
      insert(payload) { state.op = 'insert'; state.payload = payload; return q; },
      update(payload) { state.op = 'update'; state.payload = payload; return q; },
      delete() { state.op = 'delete'; return q; },
      single() { state.single = true; return q; },
      then(resolve, reject) { return Promise.resolve(exec()).then(resolve, reject); },
    };
    const exec = () => {
      calls.push({ ...state, filters: [...state.filters], order: [...state.order] });
      const rows = tables[table] || (tables[table] = []);
      const match = (r) => state.filters.every(([c, v]) => r[c] === v);
      if (state.op === 'insert') {
        const list = (Array.isArray(state.payload) ? state.payload : [state.payload]).map((r, i) => ({ id: r.id || `new-${rows.length + i}`, ...r }));
        rows.push(...list);
        return { data: state.single ? list[0] : list, error: null };
      }
      if (state.op === 'update') {
        const hit = rows.filter(match);
        hit.forEach((r) => Object.assign(r, state.payload));
        return { data: state.single ? hit[0] : hit, error: null };
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
      return { data: out, error: null };
    };
    return q;
  };
  return { from, calls, tables };
}

const sbApi = (tables) => {
  const sb = fakeSupabase(tables);
  return { sb, api: createContentApi({ provider: 'supabase', supabase: sb, base44: { entities: {} } }) };
};

describe('the table map matches the Step 1 database', () => {
  it('same tables and columns as the content migration builder', () => {
    for (const [table, , cols] of TABLES) {
      const entry = Object.values(CONTENT_TABLES).find((t) => t.table === table);
      expect(entry, table).toBeTruthy();
      const fromBuilder = cols.map(([sql, field]) => [sql, field]);
      const fromMap = entry.columns.map((field) => [RENAMES[field] || field, field]);
      expect(fromMap).toEqual(fromBuilder);
    }
  });

  it('every table exists in the schema migration', () => {
    const schema = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261114000001_schema.sql'), 'utf8');
    for (const { table } of Object.values(CONTENT_TABLES)) {
      expect(schema).toContain(`create table public.${table} (`);
    }
  });
});

describe('reading content from Supabase', () => {
  it('civics questions by version and topic, in the old shape', async () => {
    const { sb, api } = sbApi({
      civics_questions: [
        { id: 'q1', version: '2025', category: 'Government', question: 'Q1?', answer: 'A1' },
        { id: 'q2', version: '2008', category: 'Government', question: 'Q2?', answer: 'A2' },
        { id: 'q3', version: '2025', category: 'History', question: 'Q3?', answer: 'A3' },
      ],
    });
    const rows = await api.civicsQuestions({ version: '2025', category: 'Government' });
    expect(rows.map((r) => r.id)).toEqual(['q1']);
    expect(sb.calls[0].filters).toEqual([['version', '2025'], ['category', 'Government']]);
  });

  it('reads past 1,000 rows in pages', async () => {
    const many = Array.from({ length: 2500 }, (_, i) => ({ id: `p${String(i).padStart(4, '0')}`, name: `Place ${i}`, is_active: true }));
    const { sb, api } = sbApi({ community_resources: many });
    const all = await api.allPlaces();
    expect(all).toHaveLength(2500);
    expect(sb.calls.map((c) => c.range)).toEqual([[0, 999], [1000, 1999], [2000, 2999]]);
    expect(sb.calls[0].order[0]).toEqual(['name', true]);
  });

  it('stops at a limit', async () => {
    const { api } = sbApi({ reading_sentences: Array.from({ length: 30 }, (_, i) => ({ id: `r${i}`, text: `S ${i}` })) });
    expect(await api.readingSentences({ limit: 10 })).toHaveLength(10);
  });

  it('sort_order comes back as order, and "-order" sorts newest first', async () => {
    const { sb, api } = sbApi({
      interview_questions: [{ id: 'a', section: 'oath', question: 'A?', sort_order: 1 }, { id: 'b', section: 'oath', question: 'B?', sort_order: 2 }],
    });
    const rows = await api.interviewQuestions({ sort: '-order', limit: 100 });
    expect(rows.map((r) => [r.id, r.order])).toEqual([['b', 2], ['a', 1]]);
    expect(rows[0]).not.toHaveProperty('sort_order');
    expect(sb.calls[0].order[0]).toEqual(['sort_order', false]);
  });

  it('lessons sorted by order; key words for one lesson; counting lessons', async () => {
    const { api } = sbApi({
      lessons: [{ id: 'l2', title: 'Two', sort_order: 2 }, { id: 'l1', title: 'One', sort_order: 1 }],
      lesson_flashcards: [{ id: 'f1', lesson_id: 'l1', term: 'Congress' }, { id: 'f2', lesson_id: 'l2', term: 'Senate' }],
    });
    expect((await api.lessons({ sort: 'order' })).map((l) => l.title)).toEqual(['One', 'Two']);
    expect((await api.lessonFlashcards('l1')).map((f) => f.term)).toEqual(['Congress']);
    expect(await api.lessonCount()).toBe(2);
  });

  it('the reading-sentence seed never runs on Supabase', async () => {
    const { sb, api } = sbApi({ reading_sentences: [] });
    expect(await api.seedReadingSentencesIfEmpty([{ text: 'Who was George Washington?' }])).toBe(false);
    expect(sb.calls).toEqual([]);
  });

  it('a failed read throws a plain error', async () => {
    const broken = { from: () => ({ select: () => broken.q, order: () => broken.q, range: () => Promise.resolve({ data: null, error: { message: 'permission denied', code: '42501' } }) }) };
    broken.q = broken.from();
    const api = createContentApi({ provider: 'supabase', supabase: broken });
    await expect(api.vocabularyWords()).rejects.toMatchObject({ message: 'permission denied', code: '42501' });
  });
});

describe('admin editing on Supabase', () => {
  it('create keeps only real columns and renames order', async () => {
    const { sb, api } = sbApi({ lessons: [] });
    await api.contentAdmin('Lesson').create({ title: 'New', order: 3, created_date: 'x', created_by: 'admin@example.test', id: '' });
    expect(sb.calls[0].payload).toEqual({ title: 'New', sort_order: 3 });
  });

  it('update changes only what was sent, never the id', async () => {
    const { sb, api } = sbApi({ community_resources: [{ id: 'p1', name: 'Library', is_active: true }] });
    const row = await api.contentAdmin('CommunityResource').update('p1', { id: 'other', is_active: false, relevance_note: 'Checked: not relevant' });
    expect(sb.calls[0].payload).toEqual({ is_active: false, relevance_note: 'Checked: not relevant' });
    expect(row).toMatchObject({ id: 'p1', is_active: false });
  });

  it('bulk update goes row by row (partial changes); bulk create inserts all', async () => {
    const { sb, api } = sbApi({ community_resources: [{ id: 'p1', name: 'A' }, { id: 'p2', name: 'B' }] });
    const admin = api.contentAdmin('CommunityResource');
    await admin.bulkUpdate([{ id: 'p1', phone: '555-0100' }, { id: 'p2', hours: 'Mon' }]);
    expect(sb.tables.community_resources).toEqual([{ id: 'p1', name: 'A', phone: '555-0100' }, { id: 'p2', name: 'B', hours: 'Mon' }]);
    await admin.bulkCreate([{ name: 'C', external_id: 'nld:1' }, { name: 'D' }]);
    expect(sb.tables.community_resources).toHaveLength(4);
  });

  it('remove deletes by id; unknown content is refused', async () => {
    const { sb, api } = sbApi({ vocabulary_words: [{ id: 'w1', word: 'vote' }] });
    await api.contentAdmin('VocabularyWord').remove('w1');
    expect(sb.tables.vocabulary_words).toEqual([]);
    expect(() => api.contentAdmin('UserProgress')).toThrow();
  });
});

describe('Base44 (switch off) makes the same calls as before', () => {
  const fakeEntity = () => ({
    list: vi.fn(async () => []), filter: vi.fn(async () => []), count: vi.fn(async () => 7),
    bulkCreate: vi.fn(async () => []), create: vi.fn(), update: vi.fn(), delete: vi.fn(), bulkUpdate: vi.fn(),
  });
  const setup = () => {
    const entities = Object.fromEntries(Object.keys(CONTENT_TABLES).map((k) => [k, fakeEntity()]));
    return { entities, api: createContentApi({ provider: 'base44', base44: { entities } }) };
  };

  it('filter(where, null, limit) with a filter, list(sort, limit) without', async () => {
    const { entities, api } = setup();
    await api.civicsQuestions({ version: '2025', limit: 300 });
    expect(entities.CivicsQuestion.filter).toHaveBeenCalledWith({ version: '2025' }, null, 300);
    await api.interviewQuestions({ sort: '-order', limit: 100 });
    expect(entities.InterviewQuestion.list).toHaveBeenCalledWith('-order', 100);
    await api.lessonFlashcards('l1', { limit: 200 });
    expect(entities.LessonFlashcard.filter).toHaveBeenCalledWith({ lesson_id: 'l1' }, null, 200);
    expect(await api.lessonCount()).toBe(7);
  });

  it('places in cursor pages', async () => {
    const { entities, api } = setup();
    entities.CommunityResource.list
      .mockResolvedValueOnce({ items: [{ id: 'a' }], has_more: true, next_cursor: 'c1' })
      .mockResolvedValueOnce({ items: [{ id: 'b' }], has_more: false });
    expect(await api.allPlaces()).toEqual([{ id: 'a' }, { id: 'b' }]);
    expect(entities.CommunityResource.list).toHaveBeenLastCalledWith({ cursor: 'c1', limit: 1000 });
  });

  it('the reading seed runs only when there are no sentences', async () => {
    const { entities, api } = setup();
    expect(await api.seedReadingSentencesIfEmpty([{ text: 'Who was George Washington?' }])).toBe(true);
    entities.ReadingSentence.list.mockResolvedValueOnce([{ id: 'r1' }]);
    expect(await api.seedReadingSentencesIfEmpty([{ text: 'x' }])).toBe(false);
    expect(entities.ReadingSentence.bulkCreate).toHaveBeenCalledTimes(1);
  });
});

describe('helpers', () => {
  it('toRow / fromRow', () => {
    expect(toRow('Lesson', { order: 1, title: 'T', extra: 1 })).toEqual({ sort_order: 1, title: 'T' });
    expect(fromRow({ sort_order: 1, title: 'T' })).toEqual({ order: 1, title: 'T' });
  });
});

describe('screens read content only through src/api', () => {
  it('no file outside src/api calls a content entity directly', () => {
    const SRC = path.resolve(__dirname, '..');
    const hits = [];
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) { if (name !== 'api') walk(full); continue; }
        if (!/\.(js|jsx)$/.test(name) || /\.test\.js$/.test(name)) continue;
        const text = fs.readFileSync(full, 'utf8');
        for (const entity of Object.keys(CONTENT_TABLES)) {
          if (new RegExp(`entities\\.${entity}\\b`).test(text)) hits.push(`${path.relative(SRC, full)}: ${entity}`);
        }
      }
    };
    walk(SRC);
    expect(hits).toEqual([]);
  });
});
