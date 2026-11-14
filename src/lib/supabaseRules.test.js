import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { makeDb, addUser, as } from '../../supabase/tests/db';

// The Supabase data rules (supabase/migrations), checked in PGlite with a
// small stand-in for Supabase's auth (supabase/tests/supabase-shim.sql).
// Fake accounts only (@example.test).

// One sample row per learner table (user_id is filled in by default).
const LEARNER_ROWS = {
  user_progress: { content_id: 'q1', content_type: 'civics_question', status: 'learning' },
  lesson_progress: { lesson_id: 'l1', completed: true, steps_done: 5, stars: 3 },
  checkpoint_results: { section_id: 's1', correct: 6, total: 7 },
  review_items: { question_id: 'q1', box: 1 },
  lesson_notes: { lesson_id: 'l1', content: 'Fake note' },
  n400_section_progress: { section_id: 'basics', completed: true },
  interview_sessions: { overall_score: 80, passed: true },
  ai_study_logs: { question: 'Fake question?', answer: 'Fake answer.' },
  notifications: { title: 'Fake', message: 'Fake reminder' },
  activity_days: { date: '2026-11-13' },
  outcome_checkins: { kind: 'signup', stage: 'prefer_not' },
  saved_places: { resource_id: 'place-1' },
};

const insert = (q, table, row) => {
  const cols = Object.keys(row);
  return q(`insert into public.${table} (${cols.join(', ')}) values (${cols.map((_, i) => `$${i + 1}`).join(', ')}) returning *`, Object.values(row));
};
const fails = async (promise, pattern = /row-level security|permission denied|not staff|sign in/) => {
  await expect(promise).rejects.toThrow(pattern);
};

let db;
let ana;
let ben;
let admin;
let staff;

beforeAll(async () => {
  db = await makeDb();
  ana = await addUser(db, 'ana@example.test');
  ben = await addUser(db, 'ben@example.test');
  admin = await addUser(db, 'admin@example.test', { admin: true });
  staff = await addUser(db, 'staff@example.test');
  await as(db, 'service', (q) => q("insert into public.community_resources (id, name, is_active) values ('place-1', 'Fake Library', true), ('place-hidden', 'Fake Hidden', false)"));
}, 60000);

describe('every table', () => {
  it('has row-level security turned on', async () => {
    const rows = await db.query("select tablename from pg_tables where schemaname = 'public' and not rowsecurity");
    expect(rows.rows).toEqual([]);
  });

  it('is covered by these tests if it holds learner rows (add new learner tables to LEARNER_ROWS)', async () => {
    const { rows } = await db.query(`select table_name from information_schema.columns
      where table_schema = 'public' and column_name = 'user_id' order by table_name`);
    const special = ['profiles', 'program_memberships', 'check_in_reminders']; // tested on their own below
    expect(rows.map((r) => r.table_name).filter((t) => !special.includes(t)).sort()).toEqual(Object.keys(LEARNER_ROWS).sort());
  });
});

describe('content', () => {
  it('anyone, even signed out, can read it', async () => {
    await as(db, 'service', (q) => q("insert into public.civics_questions (id, version, question, answer) values ('cq1', '2025', 'Fake question?', 'Fake answer')"));
    expect(await as(db, 'anon', (q) => q('select id from public.civics_questions'))).toEqual([{ id: 'cq1' }]);
  });

  it('only admins can change it', async () => {
    await fails(as(db, 'anon', (q) => q("insert into public.lessons (title) values ('x')")));
    await fails(as(db, ana, (q) => q("insert into public.lessons (title) values ('x')")));
    const changed = await as(db, ana, (q) => q("update public.civics_questions set answer = 'changed' returning id"));
    expect(changed).toEqual([]);
    await as(db, admin, (q) => q("insert into public.lessons (id, title) values ('les-admin', 'Fake lesson')"));
    expect(await as(db, 'anon', (q) => q("select id from public.lessons where id = 'les-admin'"))).toHaveLength(1);
  });

  it('hides hidden places from everyone but admins (the audit fix: learners can no longer change places)', async () => {
    const seen = (p) => as(db, p, (q) => q('select id from public.community_resources order by id'));
    expect(await seen('anon')).toEqual([{ id: 'place-1' }]);
    expect(await seen(ana)).toEqual([{ id: 'place-1' }]);
    expect(await seen(admin)).toEqual([{ id: 'place-1' }, { id: 'place-hidden' }]);
    await fails(as(db, ana, (q) => q("insert into public.community_resources (name) values ('Fake')")));
  });
});

describe('profiles', () => {
  it('are made with the login, and each learner sees only their own', async () => {
    const mine = await as(db, ana, (q) => q('select user_id from public.profiles'));
    expect(mine).toEqual([{ user_id: ana.id }]);
  });

  it("can't have their pilot_id or the admins' test field changed by the learner", async () => {
    const [before] = await as(db, ana, (q) => q('select pilot_id from public.profiles'));
    const [after] = await as(db, ana, (q) => q("update public.profiles set pilot_id = 'mine', pilot_test_months_ago = 6, display_name = 'Ana' returning pilot_id, pilot_test_months_ago, display_name"));
    expect(after).toEqual({ pilot_id: before.pilot_id, pilot_test_months_ago: null, display_name: 'Ana' });
    const [adminRow] = await as(db, admin, (q) => q('update public.profiles set pilot_test_months_ago = 3 returning pilot_test_months_ago'));
    expect(adminRow.pilot_test_months_ago).toBe(3);
  });

  it("can't be read or changed by another learner", async () => {
    const changed = await as(db, ben, (q) => q("update public.profiles set display_name = 'hacked' where user_id = $1 returning user_id", [ana.id]));
    expect(changed).toEqual([]);
  });
});

describe('learner tables', () => {
  for (const [table, row] of Object.entries(LEARNER_ROWS)) {
    it(`${table}: a learner reads and writes only their own rows`, async () => {
      const [made] = await as(db, ana, (q) => insert(q, table, row));
      expect(made.user_id).toBe(ana.id);
      expect(await as(db, ben, (q) => q(`select * from public.${table}`))).toEqual([]);
      await fails(as(db, ben, (q) => insert(q, table, { ...row, user_id: ana.id })));
      await fails(as(db, 'anon', (q) => q(`select * from public.${table}`)));
    });
  }

  it("admins and partner staff can't read learner rows either", async () => {
    for (const person of [admin, staff]) {
      for (const table of ['lesson_notes', 'ai_study_logs', 'outcome_checkins', 'lesson_progress', 'checkpoint_results', 'review_items', 'n400_section_progress']) {
        expect(await as(db, person, (q) => q(`select * from public.${table}`)), `${person.email} ${table}`).toEqual([]);
      }
    }
  });

  it('only accepts course values in range', async () => {
    await expect(as(db, ana, (q) => insert(q, 'lesson_progress', { lesson_id: 'l9', stars: 4 }))).rejects.toThrow(/check/);
    await expect(as(db, ana, (q) => insert(q, 'review_items', { question_id: 'q9', box: 6 }))).rejects.toThrow(/check/);
    await expect(as(db, ana, (q) => insert(q, 'lesson_progress', { lesson_id: 'l8', steps_done: 6 }))).rejects.toThrow(/check/);
  });

  it('has one review schedule: the old spaced-review fields are gone from user_progress', async () => {
    const { rows } = await db.query(`select column_name from information_schema.columns
      where table_schema = 'public' and table_name = 'user_progress'`);
    const cols = rows.map((r) => r.column_name);
    expect(cols).not.toContain('ease_factor');
    expect(cols).not.toContain('interval');
    expect(cols).toEqual(expect.arrayContaining(['status', 'last_result', 'best_score']));
  });
});

describe('Write it levels (Prompt 4)', () => {
  const level = async (person) => (await as(db, person, (q) => q('select write_level, write_level1_passes from public.profiles where user_id = auth.uid()')))[0];
  it('two passes at level 1 move the learner to level 2, and the count stays 0-2', async () => {
    const dee = await addUser(db, 'dee@example.test');
    expect(await level(dee)).toEqual({ write_level: 1, write_level1_passes: 0 });
    await as(db, dee, (q) => q('update public.profiles set write_level1_passes = 1 where user_id = auth.uid()'));
    expect(await level(dee)).toEqual({ write_level: 1, write_level1_passes: 1 });
    await as(db, dee, (q) => q('update public.profiles set write_level1_passes = 2 where user_id = auth.uid()'));
    expect(await level(dee)).toEqual({ write_level: 2, write_level1_passes: 2 });
    await expect(as(db, dee, (q) => q('update public.profiles set write_level1_passes = 3 where user_id = auth.uid()'))).rejects.toThrow(/check/);
    await expect(as(db, dee, (q) => q('update public.profiles set lessons_per_day = 4 where user_id = auth.uid()'))).rejects.toThrow(/check/);
  });
});

describe('pilot reminder records', () => {
  it('are written by the server, readable by admins only', async () => {
    await as(db, 'service', (q) => q("insert into public.check_in_reminders (user_id, kind) values ($1, 'three_month')", [ana.id]));
    expect(await as(db, ana, (q) => q('select * from public.check_in_reminders'))).toEqual([]);
    expect(await as(db, admin, (q) => q('select kind from public.check_in_reminders'))).toEqual([{ kind: 'three_month' }]);
    await fails(as(db, admin, (q) => q("insert into public.check_in_reminders (user_id, kind) values ($1, 'x')", [ana.id])));
  });
});

describe('partner programs', () => {
  beforeAll(async () => {
    await as(db, admin, (q) => q(`insert into public.partners (name, code, staff_emails, share_learners) values
      ('Fake Class', 'FAKE-CLASS', array['STAFF@example.test '], true),
      ('Other Class', 'OTHER', array['someone@example.test'], false)`));
  });

  it("learners see programs' names and codes, never the staff list", async () => {
    expect(await as(db, ana, (q) => q('select * from public.partners'))).toEqual([]);
    const programs = await as(db, ana, (q) => q('select * from public.active_programs()'));
    expect(programs.map((p) => Object.keys(p).sort())).toEqual([['code', 'name', 'share_learners'], ['code', 'name', 'share_learners']]);
    await fails(as(db, 'anon', (q) => q('select * from public.active_programs()')));
  });

  it('joining makes a pending membership, only through the function', async () => {
    await fails(as(db, ana, (q) => q("insert into public.program_memberships (partner_code) values ('FAKE-CLASS')")));
    const [m] = await as(db, ana, (q) => q("select * from public.join_program('fake class', 'Ana', true)"));
    expect(m).toMatchObject({ partner_code: 'FAKE-CLASS', status: 'pending', display_name: 'Ana', share_progress: true });
    const [b] = await as(db, ben, (q) => q("select * from public.join_program('OTHER', 'ben@example.test 555-1234', true)"));
    expect(b).toMatchObject({ status: 'pending', display_name: null, share_progress: false }); // no email/number as a name; OTHER doesn't allow sharing
  });

  it("staff see their program's members (name or email + status) and nothing of other programs", async () => {
    const members = await as(db, staff, (q) => q("select name, status from public.program_members('FAKE-CLASS')"));
    expect(members).toEqual([{ name: 'Ana', status: 'pending' }]);
    await fails(as(db, staff, (q) => q("select * from public.program_members('OTHER')")));
    await fails(as(db, ana, (q) => q("select * from public.program_members('FAKE-CLASS')")));
    expect(await as(db, staff, (q) => q('select code from public.my_staff_programs()'))).toEqual([{ code: 'FAKE-CLASS' }]);
  });

  it('staff confirm a member; re-joining keeps the status; "not ours" asks again', async () => {
    await as(db, staff, (q) => q("select public.set_member_status('FAKE-CLASS', $1, 'confirmed')", [ana.id]));
    const [again] = await as(db, ana, (q) => q("select * from public.join_program('FAKE-CLASS', 'Ana', true)"));
    expect(again.status).toBe('confirmed');
    await fails(as(db, staff, (q) => q("select public.set_member_status('OTHER', $1, 'confirmed')", [ben.id])));
    await as(db, staff, (q) => q("select public.set_member_status('FAKE-CLASS', $1, 'removed')", [ana.id]));
    const [rejoin] = await as(db, ana, (q) => q("select * from public.join_program('FAKE-CLASS', 'Ana', true)"));
    expect(rejoin.status).toBe('pending');
    await as(db, staff, (q) => q("select public.set_member_status('FAKE-CLASS', $1, 'confirmed')", [ana.id]));
  });

  it('the summary counts confirmed learners exactly, and shares only what the learner chose', async () => {
    await as(db, ana, (q) => q("update public.profiles set skill_levels = '{\"civics\":\"strong\",\"reading\":\"getting_there\"}'"));
    const [{ program_summary: s }] = await as(db, staff, (q) => q("select public.program_summary('FAKE-CLASS', '2026-11-14')"));
    expect(s.totals).toMatchObject({
      learners: 1, activeWeek: 1, quickCheckDone: 1, lessonsCompleted: 1, stars: 3, n400SectionsRead: 1,
    });
    expect(s.totals.levels.civics.strong).toBe(1);
    expect(s.learners).toEqual([expect.objectContaining({ name: 'Ana', lessonsCompleted: 1, stars: 3, n400SectionsRead: 1 })]);
    const text = JSON.stringify(s);
    for (const secret of ['Fake note', 'Fake question', 'signup', 'basics', 'pilot']) expect(text).not.toContain(secret);
    await fails(as(db, ana, (q) => q("select public.program_summary('FAKE-CLASS')")));
  });

  it('a learner can leave their program', async () => {
    await as(db, ben, (q) => q('delete from public.program_memberships'));
    expect(await as(db, ben, (q) => q('select * from public.program_memberships'))).toEqual([]);
  });
});

describe('Delete all my data', () => {
  it('removes the login and every row tied to it, and nobody else\'s', async () => {
    const cam = await addUser(db, 'cam@example.test');
    for (const [table, row] of Object.entries(LEARNER_ROWS)) await as(db, cam, (q) => insert(q, table, row));
    await as(db, cam, (q) => q("select * from public.join_program('FAKE-CLASS', 'Cam', false)"));
    await as(db, 'service', (q) => q("insert into public.check_in_reminders (user_id, kind) values ($1, 'six_month')", [cam.id]));

    await as(db, cam, (q) => q('select public.delete_my_account()'));

    // Every public table with a user_id column, so a new learner table is covered automatically.
    const { rows: tables } = await db.query(`select table_name from information_schema.columns
      where table_schema = 'public' and column_name = 'user_id' order by table_name`);
    expect(tables.length).toBeGreaterThanOrEqual(Object.keys(LEARNER_ROWS).length + 3);
    for (const { table_name: t } of tables) {
      const { rows } = await db.query(`select count(*)::int as n from public.${t} where user_id = $1`, [cam.id]);
      expect(rows[0].n, t).toBe(0);
    }
    expect((await db.query('select count(*)::int as n from auth.users where id = $1', [cam.id])).rows[0].n).toBe(0);
    expect((await db.query('select count(*)::int as n from public.lesson_progress where user_id = $1', [ana.id])).rows[0].n).toBeGreaterThan(0);
    await fails(as(db, 'anon', (q) => q('select public.delete_my_account()')));
  });
});

describe('seed.sql', () => {
  it('holds fake accounts only', () => {
    const seed = fs.readFileSync(path.resolve(__dirname, '../../supabase/seed.sql'), 'utf8');
    const emails = seed.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) || [];
    expect(emails.length).toBeGreaterThan(0);
    expect(emails.filter((e) => !e.endsWith('@example.test'))).toEqual([]);
  });
});

describe('content migration', () => {
  it('loads every exported row, with working lesson links', async () => {
    const full = await makeDb({ content: true });
    const dir = path.resolve(__dirname, '../../content/base44-export');
    const count = (f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')).length;
    const expected = {
      civics_questions: count('civics-questions-2008.json') + count('civics-questions-2025.json'),
      interview_questions: count('interview-questions.json'),
      reading_sentences: count('reading-sentences.json'),
      writing_sentences: count('writing-sentences.json'),
      vocabulary_words: count('vocabulary-words.json'),
      lessons: count('lessons.json'),
      lesson_flashcards: count('lesson-flashcards.json'),
      community_resources: count('community-resources.json'),
    };
    for (const [table, n] of Object.entries(expected)) {
      const { rows } = await full.query(`select count(*)::int as n from public.${table}`);
      expect(rows[0].n, table).toBe(n);
    }
    const { rows } = await full.query("select count(*)::int as n from public.civics_questions where version = '2025'");
    expect(rows[0].n).toBe(128);
  }, 120000);
});
