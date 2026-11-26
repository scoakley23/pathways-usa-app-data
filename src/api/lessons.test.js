// Lesson progress and notes through src/api/lessons.js (Standalone Step 3,
// PR 4), with fake clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createLessonsApi, LESSON_PROGRESS_COLUMNS, LESSON_NOTE_COLUMNS, PASS_SCORE } = await import('./lessons');
const { fakeSupabase } = await import('./testing/fakeSupabase');

const ANA = { id: 'u-ana', email: 'Ana@Example.test' };
const authAs = (user) => ({ me: vi.fn(async () => user) });

const tables = () => ({
  lesson_progress: [
    { id: 'p1', user_id: 'u-ana', lesson_id: 'l1', completed: true, best_score: 80, last_attempt_date: '2026-11-10T10:00:00Z' },
    { id: 'p2', user_id: 'u-ana', lesson_id: 'l2', completed: true, best_score: 60, last_attempt_date: '2026-11-12T10:00:00Z' },
    { id: 'p3', user_id: 'u-ana', lesson_id: 'l3', completed: false, best_score: 90, last_attempt_date: '2026-11-13T10:00:00Z' },
    { id: 'p4', user_id: 'u-ben', lesson_id: 'l1', completed: true, best_score: 100, last_attempt_date: '2026-11-14T10:00:00Z' },
  ],
  lesson_notes: [
    { id: 'n1', user_id: 'u-ana', lesson_id: 'l1', lesson_title: 'Congress', content: 'Two parts: Senate and House.', updated_at: '2026-11-10T10:00:00Z' },
    { id: 'n2', user_id: 'u-ben', lesson_id: 'l1', lesson_title: 'Congress', content: 'Ben\'s note', updated_at: '2026-11-11T10:00:00Z' },
  ],
});

const setup = () => {
  const sb = fakeSupabase(tables());
  return { sb, ...createLessonsApi({ provider: 'supabase', supabase: sb, auth: authAs(ANA) }) };
};

describe('lesson progress on Supabase', () => {
  it('lists only the learner\'s own rows, sorted, in the old shape', async () => {
    const { lessonProgress } = setup();
    const rows = await lessonProgress.list({ sort: '-last_attempt_date', limit: 20 });
    expect(rows.map((r) => r.id)).toEqual(['p3', 'p2', 'p1']);
    expect(rows[0].user_email).toBe('ana@example.test');
  });

  it('get() one lesson; countPassed() = finished with a best score of 70 or more', async () => {
    const { lessonProgress, sb } = setup();
    expect((await lessonProgress.get('l2')).id).toBe('p2');
    expect(await lessonProgress.get('l9')).toBeNull();
    expect(PASS_SCORE).toBe(70);
    expect(await lessonProgress.countPassed()).toBe(1);
    expect(sb.calls.at(-1).filters).toEqual([['user_id', 'eq', 'u-ana'], ['completed', 'eq', true], ['best_score', 'gte', 70]]);
  });

  it('opening a new lesson makes one row per lesson (keyed by the login), dropping user_email', async () => {
    const { lessonProgress, sb } = setup();
    await lessonProgress.save(null, { user_email: 'ana@example.test', lesson_id: 'l4', topic: 'Government', completed: false, quiz_attempts: 0 });
    await lessonProgress.save(null, { lesson_id: 'l4', topic: 'Government', completed: false, quiz_attempts: 1 });
    const mine = sb.tables.lesson_progress.filter((r) => r.lesson_id === 'l4');
    expect(mine).toHaveLength(1);
    expect(mine[0]).toMatchObject({ user_id: 'u-ana', quiz_attempts: 1 });
    expect(mine[0]).not.toHaveProperty('user_email');
  });

  it('finishing a lesson updates the learner\'s own row only', async () => {
    const { lessonProgress, sb } = setup();
    const row = await lessonProgress.get('l1');
    await lessonProgress.save(row, { lesson_id: 'l1', best_score: 95, last_score: 95, completed: true });
    expect(sb.tables.lesson_progress.find((r) => r.id === 'p1').best_score).toBe(95);
    expect(sb.tables.lesson_progress.find((r) => r.id === 'p4').best_score).toBe(100);
  });
});

describe('lesson notes on Supabase', () => {
  it('reads only the learner\'s own notes, with created_date from updated_at', async () => {
    const { lessonNotes } = setup();
    const notes = await lessonNotes.list({ limit: 200 });
    expect(notes.map((n) => n.id)).toEqual(['n1']);
    expect(notes[0]).toMatchObject({ created_date: '2026-11-10T10:00:00Z', updated_date: '2026-11-10T10:00:00Z' });
    expect((await lessonNotes.list({ lessonId: 'l1', limit: 1 }))[0].content).toBe('Two parts: Senate and House.');
  });

  it('a new note is inserted; an edit changes only the content', async () => {
    const { lessonNotes, sb } = setup();
    const created = await lessonNotes.save(null, { user_email: 'ana@example.test', lesson_id: 'l2', lesson_title: 'Senate', lesson_topic: 'Government', content: 'Six-year terms.' });
    expect(sb.tables.lesson_notes.find((n) => n.id === created.id)).toMatchObject({ user_id: 'u-ana', lesson_id: 'l2', content: 'Six-year terms.' });
    await lessonNotes.save({ id: created.id }, { content: '100 senators.' });
    expect(sb.calls.at(-1).payload).toEqual({ content: '100 senators.' });
    expect(sb.tables.lesson_notes.find((n) => n.id === created.id).content).toBe('100 senators.');
  });

  it('another learner\'s note can\'t be changed', async () => {
    const { lessonNotes } = setup();
    await expect(lessonNotes.save({ id: 'n2' }, { content: 'x' })).rejects.toBeTruthy();
  });

  it('remove() deletes only the learner\'s own note', async () => {
    const { lessonNotes, sb } = setup();
    await lessonNotes.remove('n2');
    expect(sb.tables.lesson_notes.map((n) => n.id)).toContain('n2');
    await lessonNotes.remove('n1');
    expect(sb.tables.lesson_notes.map((n) => n.id)).toEqual(['n2']);
  });
});

describe('the columns match the Step 1 tables', () => {
  const schema = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261114000001_schema.sql'), 'utf8');
  const block = (name) => schema.slice(schema.indexOf(`create table public.${name}`), schema.indexOf('\n);', schema.indexOf(`create table public.${name}`)));
  it.each([['lesson_progress', LESSON_PROGRESS_COLUMNS], ['lesson_notes', LESSON_NOTE_COLUMNS]])('%s', (name, cols) => {
    for (const col of cols) expect(block(name)).toMatch(new RegExp(`\\n\\s+${col}\\s`));
  });
});

describe('Base44 (switch off) makes the same calls as before', () => {
  const entity = () => ({
    filter: vi.fn(async () => [{ id: 'b1', lesson_id: 'l1' }]), count: vi.fn(async () => 2),
    update: vi.fn(async (id, d) => ({ id, ...d })), create: vi.fn(async (d) => ({ id: 'new', ...d })),
    delete: vi.fn(async () => ({})),
  });
  const setup44 = () => {
    const entities = { LessonProgress: entity(), LessonNotes: entity() };
    return { entities, ...createLessonsApi({ provider: 'base44', base44: { entities }, auth: authAs(ANA) }) };
  };

  it('filter by the lowercase email; the old $gte count', async () => {
    const { entities, lessonProgress } = setup44();
    await lessonProgress.list({ sort: '-last_attempt_date', limit: 20 });
    expect(entities.LessonProgress.filter).toHaveBeenCalledWith({ user_email: 'ana@example.test' }, '-last_attempt_date', 20);
    await lessonProgress.get('l1');
    expect(entities.LessonProgress.filter).toHaveBeenLastCalledWith({ user_email: 'ana@example.test', lesson_id: 'l1' }, null, 1);
    expect(await lessonProgress.countPassed()).toBe(2);
    expect(entities.LessonProgress.count).toHaveBeenCalledWith({ user_email: 'ana@example.test', completed: true, best_score: { $gte: 70 } });
  });

  it('notes: update by id, create when new', async () => {
    const { entities, lessonNotes } = setup44();
    await lessonNotes.save({ id: 'b1' }, { content: 'x' });
    expect(entities.LessonNotes.update).toHaveBeenCalledWith('b1', { content: 'x' });
    await lessonNotes.save(null, { lesson_id: 'l2', content: 'y' });
    expect(entities.LessonNotes.create).toHaveBeenCalledWith({ lesson_id: 'l2', content: 'y' });
    await lessonNotes.remove('b1');
    expect(entities.LessonNotes.delete).toHaveBeenCalledWith('b1');
  });
});
