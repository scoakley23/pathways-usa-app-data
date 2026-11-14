// Shared content (Standalone Step 3, PR 1): civics questions, reading and
// writing sentences, vocabulary, lessons and their key words, interview
// questions, and Resource Hub places. Learners only read it; admins change
// it (the admin content tabs use `contentAdmin()`).
//
// Rows come back in today's (Base44) shape on both sides, so screens don't
// change: Supabase's `sort_order` is `order` again. Writes keep only the
// table's real columns (Base44's id/created_date/… extras are dropped).
//
// `createContentApi({ provider, base44, supabase })` takes its clients so
// tests can pass fakes; the app uses the `content` export.
import { DATA_PROVIDER, applySort, run, selectAll } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';

// Base44 entity → Supabase table and columns. Must match the Step 1 tables
// and scripts/supabase/build-content-migration.mjs (content.test.js checks).
export const CONTENT_TABLES = {
  CivicsQuestion: { table: 'civics_questions', columns: ['id', 'version', 'question', 'answer', 'category', 'difficulty'] },
  InterviewQuestion: { table: 'interview_questions', columns: ['id', 'section', 'question', 'expected_response', 'response_type', 'order', 'tips'] },
  ReadingSentence: { table: 'reading_sentences', columns: ['id', 'text', 'difficulty'] },
  Sentence: { table: 'writing_sentences', columns: ['id', 'text', 'category', 'difficulty'] },
  VocabularyWord: { table: 'vocabulary_words', columns: ['id', 'word', 'category', 'definition'] },
  Lesson: { table: 'lessons', columns: ['id', 'topic', 'title', 'description', 'video_url', 'content', 'key_points', 'order'] },
  LessonFlashcard: { table: 'lesson_flashcards', columns: ['id', 'lesson_id', 'term', 'definition', 'example'] },
  CommunityResource: {
    table: 'community_resources',
    columns: ['id', 'name', 'category', 'services', 'address', 'city', 'state', 'zip', 'latitude', 'longitude',
      'location_precision', 'phone', 'website', 'logo_url', 'hours', 'languages', 'cost', 'description',
      'source', 'source_url', 'last_verified', 'external_id', 'relevance_note', 'is_active'],
  },
};

// Base44 field → Supabase column, where they differ.
export const RENAMES = { order: 'sort_order' };
const UNRENAMES = Object.fromEntries(Object.entries(RENAMES).map(([a, b]) => [b, a]));

export const fromRow = (row) => {
  if (!row) return row;
  const out = {};
  for (const [k, v] of Object.entries(row)) out[UNRENAMES[k] || k] = v;
  return out;
};

// Only the table's columns, under their Supabase names.
export function toRow(entity, data, { keepId = true } = {}) {
  const { columns } = CONTENT_TABLES[entity];
  const out = {};
  for (const field of columns) {
    if (!(field in data)) continue;
    if (field === 'id' && (!keepId || !data.id)) continue;
    out[RENAMES[field] || field] = data[field];
  }
  return out;
}

// Rows are updated one at a time (partial changes), a few at once.
const UPDATE_PARALLEL = 10;

export function createContentApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);

  // Base44: filter() when there is a `where`, else list(); same arguments as
  // the screens used before.
  const b44Read = (entity, { where, sort = null, limit } = {}) => {
    const e = b44.entities[entity];
    return where && Object.keys(where).length ? e.filter(where, sort, limit) : e.list(sort, limit);
  };

  // Supabase: equal-to filters, Base44-style sort, every row unless `limit`.
  const sbRead = async (entity, { where = {}, sort, limit } = {}) => {
    const { table } = CONTENT_TABLES[entity];
    const rows = await selectAll(() => {
      let q = sb().from(table).select('*');
      for (const [k, v] of Object.entries(where)) q = q.eq(RENAMES[k] || k, v);
      q = applySort(q, sort, RENAMES);
      if (!sort) q = q.order('id', { ascending: true }); // stable pages
      return q;
    }, { limit: limit || undefined });
    return rows.map(fromRow);
  };

  const read = (entity, opts) => (provider === 'supabase' ? sbRead(entity, opts) : b44Read(entity, opts));

  const api = {
    // { version?, category?, limit? }
    civicsQuestions: ({ version, category, limit } = {}) => {
      const where = {};
      if (version) where.version = version;
      if (category) where.category = category;
      return read('CivicsQuestion', { where, limit });
    },
    readingSentences: ({ limit } = {}) => read('ReadingSentence', { limit }),
    writingSentences: ({ limit } = {}) => read('Sentence', { limit }),
    vocabularyWords: () => read('VocabularyWord'),
    lessons: ({ sort, limit } = {}) => read('Lesson', { sort, limit }),
    lessonFlashcards: (lessonId, { limit } = {}) => read('LessonFlashcard', { where: { lesson_id: lessonId }, limit }),
    // { section?, sort? ('order' | '-order'), limit? }
    interviewQuestions: ({ section, sort, limit } = {}) => read('InterviewQuestion', { where: section ? { section } : {}, sort, limit }),

    async lessonCount() {
      if (provider !== 'supabase') return b44.entities.Lesson.count();
      return run(sb().from('lessons').select('id', { count: 'exact', head: true }));
    },

    // Every Resource Hub place (admins also get hidden ones), sorted by name.
    async allPlaces() {
      if (provider === 'supabase') return sbRead('CommunityResource', { sort: 'name' });
      const all = [];
      let page = await b44.entities.CommunityResource.list({ sort: 'name', limit: 1000 });
      all.push(...page.items);
      while (page.has_more) {
        page = await b44.entities.CommunityResource.list({ cursor: page.next_cursor, limit: 1000 });
        all.push(...page.items);
      }
      return all;
    },

    // Base44 only: the old one-time reading-sentence seed. On Supabase the
    // content migration already holds the sentences (and learners can't
    // write content).
    async seedReadingSentencesIfEmpty(sentences) {
      if (provider === 'supabase') return false;
      const existing = await b44.entities.ReadingSentence.list();
      if (existing.length > 0) return false;
      await b44.entities.ReadingSentence.bulkCreate(sentences);
      return true;
    },
  };

  // Admin editing for one kind of content (row-level security allows it for
  // admins only).
  api.contentAdmin = (entity) => {
    if (!CONTENT_TABLES[entity]) throw new Error(`Unknown content: ${entity}`);
    if (provider !== 'supabase') {
      const e = b44.entities[entity];
      return {
        list: () => (entity === 'CommunityResource' ? api.allPlaces() : e.list()),
        create: (data) => e.create(data),
        update: (id, data) => e.update(id, data),
        remove: (id) => e.delete(id),
        bulkCreate: (rows) => e.bulkCreate(rows),
        bulkUpdate: (rows) => e.bulkUpdate(rows),
      };
    }
    const { table } = CONTENT_TABLES[entity];
    const update = async (id, data) => fromRow(await run(sb().from(table).update(toRow(entity, data, { keepId: false })).eq('id', id).select('*').single()));
    return {
      list: () => (entity === 'CommunityResource' ? api.allPlaces() : sbRead(entity)),
      create: async (data) => fromRow(await run(sb().from(table).insert(toRow(entity, data)).select('*').single())),
      update,
      remove: (id) => run(sb().from(table).delete().eq('id', id)),
      bulkCreate: async (rows) => (await run(sb().from(table).insert(rows.map((r) => toRow(entity, r))).select('*'))).map(fromRow),
      async bulkUpdate(rows) {
        const out = [];
        for (let i = 0; i < rows.length; i += UPDATE_PARALLEL) {
          const part = rows.slice(i, i + UPDATE_PARALLEL);
          out.push(...await Promise.all(part.map(({ id, ...changes }) => update(id, changes))));
        }
        return out;
      },
    };
  };

  return api;
}

export const content = createContentApi();
export default content;
