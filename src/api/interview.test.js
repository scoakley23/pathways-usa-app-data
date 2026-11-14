// Mock interview scores and N-400 sections read through src/api/interview.js
// (Standalone Step 3, PR 5), with fake clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createInterviewApi, SESSION_COLUMNS, RESULT_FIELDS } = await import('./interview');
const { fakeSupabase } = await import('./testing/fakeSupabase');

const ANA = { id: 'u-ana', email: 'Ana@Example.test' };
const authAs = (user) => ({ me: vi.fn(async () => user) });

const tables = () => ({
  interview_sessions: [
    { id: 's1', user_id: 'u-ana', overall_score: 60, passed: false, created_at: '2026-11-10T10:00:00Z', results: [] },
    { id: 's2', user_id: 'u-ana', overall_score: 85, passed: true, created_at: '2026-11-12T10:00:00Z', results: [] },
    { id: 's3', user_id: 'u-ben', overall_score: 95, passed: true, created_at: '2026-11-13T10:00:00Z', results: [] },
  ],
  n400_section_progress: [
    { user_id: 'u-ana', section_id: 'part-1', completed: true, completed_date: '2026-11-01' },
    { user_id: 'u-ben', section_id: 'part-2', completed: true, completed_date: '2026-11-02' },
  ],
});

const setup = () => {
  const sb = fakeSupabase(tables());
  return { sb, ...createInterviewApi({ provider: 'supabase', supabase: sb, auth: authAs(ANA) }) };
};

// What the mock interview has in memory after a question: the scores plus
// what the learner said and the AI's text about it.
const fullResult = {
  question: 'What is your name?', section: 'small_talk',
  content_score: 90, grammar_score: 80, fluency_score: 85, overall_score: 85, is_acceptable: true,
  transcript: 'My name is Test Person', feedback: 'Good answer about your name', suggested: 'My name is …',
};

describe('interview sessions on Supabase', () => {
  it('lists only the learner\'s own sessions, newest first, with created_date', async () => {
    const { interviewSessions, sb } = setup();
    const rows = await interviewSessions.list({ sort: '-created_date', limit: 50 });
    expect(rows.map((r) => r.id)).toEqual(['s2', 's1']);
    expect(rows[0].created_date).toBe('2026-11-12T10:00:00Z');
    expect(sb.calls[0].order[0]).toEqual(['created_at', false]);
  });

  it('counts passed interviews', async () => {
    const { interviewSessions } = setup();
    expect(await interviewSessions.countPassed()).toBe(1);
  });

  it('saves scores only: never what the learner said or the AI text', async () => {
    const { interviewSessions, sb } = setup();
    await interviewSessions.create({ user_email: 'x@example.test', overall_score: 85, passed: true, question_count: 1, passed_count: 1, results: [fullResult], extra: 1 });
    const row = sb.tables.interview_sessions.at(-1);
    expect(row.user_id).toBe('u-ana');
    expect(Object.keys(row).sort()).toEqual(['id', 'user_id', ...SESSION_COLUMNS].sort());
    expect(Object.keys(row.results[0]).sort()).toEqual([...RESULT_FIELDS].sort());
    expect(JSON.stringify(row)).not.toMatch(/Test Person|Good answer/);
  });
});

describe('N-400 sections read on Supabase', () => {
  it('lists only the learner\'s own sections, with the section id as id', async () => {
    const { n400Progress } = setup();
    expect(await n400Progress.list()).toEqual([
      { user_id: 'u-ana', section_id: 'part-1', completed: true, completed_date: '2026-11-01', id: 'part-1', user_email: 'ana@example.test' },
    ]);
  });

  it('marking a section read keeps the id and a date, never its title', async () => {
    const { n400Progress, sb } = setup();
    await n400Progress.markRead(null, { sectionId: 'part-9', title: 'Moral character', date: '2026-11-14T15:30:00.000Z' });
    await n400Progress.markRead({ id: 'part-9' }, { sectionId: 'part-9', title: 'Moral character', date: '2026-11-15T09:00:00.000Z' });
    const mine = sb.tables.n400_section_progress.filter((r) => r.section_id === 'part-9');
    expect(mine).toEqual([{ id: mine[0].id, user_id: 'u-ana', section_id: 'part-9', completed: true, completed_date: '2026-11-15' }]);
    expect(JSON.stringify(sb.tables.n400_section_progress)).not.toMatch(/Moral character/);
  });

  it('the Supabase table has no title column', () => {
    const schema = fs.readFileSync(path.resolve(__dirname, '../../supabase/migrations/20261114000001_schema.sql'), 'utf8');
    const start = schema.indexOf('create table public.n400_section_progress');
    expect(schema.slice(start, schema.indexOf('\n);', start))).not.toMatch(/title/);
  });
});

describe('Base44 (switch off) makes the same calls as before', () => {
  const entity = () => ({
    filter: vi.fn(async () => []), count: vi.fn(async () => 1),
    update: vi.fn(async (id, d) => ({ id, ...d })), create: vi.fn(async (d) => ({ id: 'new', ...d })),
  });
  const setup44 = () => {
    const entities = { InterviewSession: entity(), N400SectionProgress: entity() };
    return { entities, ...createInterviewApi({ provider: 'base44', base44: { entities }, auth: authAs(ANA) }) };
  };

  it('sessions: filter by the lowercase email; count passed; save scores only', async () => {
    const { entities, interviewSessions } = setup44();
    await interviewSessions.list({ sort: '-created_date', limit: 10 });
    expect(entities.InterviewSession.filter).toHaveBeenCalledWith({ user_email: 'ana@example.test' }, '-created_date', 10);
    await interviewSessions.countPassed();
    expect(entities.InterviewSession.count).toHaveBeenCalledWith({ user_email: 'ana@example.test', passed: true });
    await interviewSessions.create({ overall_score: 85, results: [fullResult] });
    const saved = entities.InterviewSession.create.mock.calls[0][0];
    expect(saved.user_email).toBe('ana@example.test');
    expect(Object.keys(saved.results[0]).sort()).toEqual([...RESULT_FIELDS].sort());
  });

  it('N-400: update an existing row, create a new one with the title as before', async () => {
    const { entities, n400Progress } = setup44();
    await n400Progress.markRead({ id: 'b1' }, { sectionId: 'part-1', title: 'Eligibility', date: '2026-11-14T00:00:00Z' });
    expect(entities.N400SectionProgress.update).toHaveBeenCalledWith('b1', { completed: true, completed_date: '2026-11-14T00:00:00Z' });
    await n400Progress.markRead(null, { sectionId: 'part-2', title: 'About you', date: '2026-11-14T00:00:00Z' });
    expect(entities.N400SectionProgress.create).toHaveBeenCalledWith({
      user_email: 'Ana@Example.test', section_id: 'part-2', section_title: 'About you', completed: true, completed_date: '2026-11-14T00:00:00Z',
    });
  });
});
