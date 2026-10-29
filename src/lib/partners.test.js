import { describe, it, expect, beforeEach } from 'vitest';
import {
  normalizeCode, activePartners, findActivePartner, partnersForStaff, cleanName, planJoin, memberView, canManage, programSummary,
} from '../../base44/shared/partners.js';
import { rememberProgramFromUrl, loadPendingProgram, clearPendingProgram, PENDING_PROGRAM_KEY } from './programLink';
import partnerEntity from '../../base44/entities/Partner.jsonc?raw';
import membershipEntity from '../../base44/entities/ProgramMembership.jsonc?raw';
import partnerFunction from '../../base44/functions/partner/entry.js?raw';

const parse = (src) => JSON.parse(src.replace(/^\s*\/\/.*$/gm, ''));

const harvard = { id: 'p1', name: 'Harvard Citizenship Tutoring Program', code: 'harvard-ctp', staff_emails: ['Staff@Example.org'], share_learners: true, active: true };
const hidden = { id: 'p2', name: 'Old Program', code: 'OLD', staff_emails: ['staff@example.org'], active: false };
const plain = { id: 'p3', name: 'Evening Class', code: 'EVENING', staff_emails: [] };

describe('partner programs', () => {
  it('learners see only active programs, and never the staff list', () => {
    expect(activePartners([harvard, hidden, plain])).toEqual([
      { code: 'HARVARD-CTP', name: 'Harvard Citizenship Tutoring Program', shareLearners: true },
      { code: 'EVENING', name: 'Evening Class', shareLearners: false },
    ]);
    expect(findActivePartner([harvard, hidden], ' harvard ctp ')).toMatchObject({ code: 'HARVARD-CTP' });
    expect(findActivePartner([harvard, hidden], 'OLD')).toBeNull();
    expect(normalizeCode('harvard ctp')).toBe('HARVARD-CTP');
  });

  it('staff get only their own active programs', () => {
    expect(partnersForStaff([harvard, hidden, plain], 'staff@example.org').map((p) => p.code)).toEqual(['HARVARD-CTP']);
    expect(partnersForStaff([harvard], 'learner@example.com')).toEqual([]);
    expect(partnersForStaff([harvard], '')).toEqual([]);
  });

  it('the optional name is a name only', () => {
    expect(cleanName('  Ana   María ')).toBe('Ana María');
    expect(cleanName('ana@example.com')).toBe('');
    expect(cleanName('A123456789')).toBe('');
    expect(cleanName('x'.repeat(100))).toHaveLength(60);
  });

  it('joining starts as pending; re-saving the same program keeps its status', () => {
    const p = findActivePartner([harvard], 'HARVARD-CTP');
    const fresh = planJoin(null, p, { name: 'Ana', share: true });
    expect(fresh).toMatchObject({ partner_code: 'HARVARD-CTP', status: 'pending', display_name: 'Ana', share_progress: true });
    expect(fresh.status_changed_at).toBeTruthy();

    const confirmed = { partner_code: 'HARVARD-CTP', status: 'confirmed' };
    const again = planJoin(confirmed, p, { name: 'Ana P.' });
    expect(again).toEqual({ partner_code: 'HARVARD-CTP', status: 'confirmed', display_name: 'Ana P.', share_progress: false });
  });

  it('a program that said "not ours" is asked again; a new program starts over', () => {
    const p = findActivePartner([harvard, plain], 'HARVARD-CTP');
    expect(planJoin({ partner_code: 'HARVARD-CTP', status: 'removed' }, p).status).toBe('pending');
    expect(planJoin({ partner_code: 'EVENING', status: 'confirmed' }, p).status).toBe('pending');
  });

  it('sharing progress only where the program allows it', () => {
    const p = findActivePartner([plain], 'EVENING');
    expect(planJoin(null, p, { share: true }).share_progress).toBe(false);
  });

  it('staff see the name or the email, and the status: nothing else', () => {
    const row = { id: 'm1', user_email: 'Ana@Example.com', partner_code: 'HARVARD-CTP', status: 'pending', share_progress: true, created_date: '2026-10-27T00:00:00Z' };
    expect(memberView(row)).toEqual({ id: 'm1', name: 'ana@example.com', status: 'pending', since: '2026-10-27T00:00:00Z' });
    expect(memberView({ ...row, display_name: 'Ana' }).name).toBe('Ana');
  });

  it('staff manage only their own program\'s learners', () => {
    const staff = partnersForStaff([harvard, plain], 'staff@example.org');
    expect(canManage({ partner_code: 'HARVARD-CTP' }, staff)).toBe(true);
    expect(canManage({ partner_code: 'EVENING' }, staff)).toBe(false);
    expect(canManage(null, staff)).toBe(false);
  });
});

describe('program totals', () => {
  const today = new Date('2026-10-27T12:00:00Z');
  const m = (id, email, extra = {}) => ({ id, user_email: email, partner_code: 'HARVARD-CTP', status: 'confirmed', ...extra });
  const confirmed = [
    m('m1', 'ana@example.com', { display_name: 'Ana', share_progress: true }),
    m('m2', 'Bo@Example.com', { share_progress: false }),
    m('m3', 'cy@example.com', { share_progress: true }),
  ];
  const data = {
    users: [
      { email: 'ana@example.com', skill_levels: { civics: 'strong', reading: 'getting_there', writing: 'start_here', speaking: 'strong' } },
      { email: 'bo@example.com', skill_levels: { civics: 'start_here' } },
      { email: 'cy@example.com', skill_levels: null },
      { email: 'stranger@example.com', skill_levels: { civics: 'strong' } },
    ],
    lessons: [
      { user_email: 'ana@example.com', completed: true },
      { user_email: 'ana@example.com', completed: true },
      { user_email: 'bo@example.com', completed: false },
      { user_email: 'stranger@example.com', completed: true },
    ],
    sections: [{ user_email: 'cy@example.com', completed: true }],
    activity: [
      { user_email: 'ana@example.com', date: '2026-10-27' },
      { user_email: 'ana@example.com', date: '2026-10-26' },
      { user_email: 'bo@example.com', date: '2026-10-10' },
      { user_email: 'cy@example.com', date: '2026-08-01' },
      { user_email: 'stranger@example.com', date: '2026-10-27' },
    ],
  };

  it('counts exactly, over confirmed learners only', () => {
    const { totals } = programSummary(confirmed, data, { today });
    expect(totals).toMatchObject({
      learners: 3, activeWeek: 1, activeMonth: 2, quickCheckDone: 2,
      lessonsCompleted: 2, learnersWithLesson: 1, n400SectionsRead: 1, learnersWithN400: 1,
    });
    expect(totals.levels.civics).toEqual({ start_here: 1, getting_there: 0, strong: 1 });
    expect(totals.levels.writing).toEqual({ start_here: 1, getting_there: 0, strong: 0 });
  });

  it('lists only learners who chose to share, where the program allows it', () => {
    expect(programSummary(confirmed, data, { today }).learners).toEqual([]);
    const { learners } = programSummary(confirmed, data, { today, shareAllowed: true });
    expect(learners.map((l) => l.name)).toEqual(['Ana', 'cy@example.com']);
    expect(learners[0]).toEqual({
      id: 'm1', name: 'Ana',
      levels: { civics: 'strong', reading: 'getting_there', writing: 'start_here', speaking: 'strong' },
      lessonsCompleted: 2, n400SectionsRead: 0,
    });
  });

  it('never lists when someone was active', () => {
    const { learners } = programSummary(confirmed, data, { today, shareAllowed: true });
    for (const l of learners) expect(Object.keys(l).sort()).toEqual(['id', 'lessonsCompleted', 'levels', 'n400SectionsRead', 'name']);
  });
});

describe('access rules', () => {
  it('only admins read or change partner programs (staff emails stay private)', () => {
    const admin = { user_condition: { role: 'admin' } };
    expect(parse(partnerEntity).rls).toEqual({ create: admin, read: admin, update: admin, delete: admin });
  });

  it('memberships are made and changed only by the partner function', () => {
    const owner = { 'data.user_email': '{{user.email}}' };
    expect(parse(membershipEntity).rls).toEqual({ create: false, read: owner, update: false, delete: owner });
  });

  it('the partner function never reads pilot answers, Ask Vía history or learner progress', () => {
    expect(partnerFunction).not.toMatch(/OutcomeCheckIn|AIStudyLog|LessonNotes|InterviewSession|UserProgress/);
  });
});

describe('share link', () => {
  let store;
  beforeEach(() => {
    store = {};
    globalThis.localStorage = {
      getItem: (k) => (k in store ? store[k] : null),
      setItem: (k, v) => { store[k] = String(v); },
      removeItem: (k) => { delete store[k]; },
    };
  });

  it('keeps ?program= on the device until the program question', () => {
    expect(rememberProgramFromUrl('?program=harvard-ctp&x=1')).toBe('HARVARD-CTP');
    expect(store[PENDING_PROGRAM_KEY]).toBe('HARVARD-CTP');
    expect(loadPendingProgram()).toBe('HARVARD-CTP');
    clearPendingProgram();
    expect(loadPendingProgram()).toBe('');
  });

  it('ignores links without a program, and odd values', () => {
    expect(rememberProgramFromUrl('?code=4%2F0AfJohXk')).toBeNull();
    expect(rememberProgramFromUrl('?program=%3Cscript%3E')).toBeNull();
    expect(store[PENDING_PROGRAM_KEY]).toBeUndefined();
  });

  it('works when storage is blocked', () => {
    globalThis.localStorage = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); }, removeItem: () => { throw new Error('no'); } };
    expect(rememberProgramFromUrl('?program=HARVARD-CTP')).toBe('HARVARD-CTP');
    expect(loadPendingProgram()).toBe('');
    expect(() => clearPendingProgram()).not.toThrow();
  });
});
