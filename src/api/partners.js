// Partner programs (Standalone Step 3, PR 7), the parts not already in
// src/api/programs.js: the staff screen (members, confirm or "not ours",
// totals), the learner's own program (see it, leave it), and Admin →
// Partners. Screens reach these through src/lib/partners.js.
//
// Switch off: Base44's `partner` function, `ProgramMembership` and `Partner`.
// Switch on: Step 1's Supabase functions (program_members,
// set_member_status, program_summary: each checks the caller is on that
// program's staff list) and tables (program_memberships: a learner reads and
// deletes only their own row; partners: admins only).
//
// Staff see the name the learner gave (or their email), the status, counts
// and levels. Never answers, notes, chats, pilot answers or N-400 section
// names (the database functions return nothing else).
import { DATA_PROVIDER, run } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';
import { listPrograms, myStaffPrograms, joinProgramByCode } from '@/api/programs';

export const PARTNER_COLUMNS = ['name', 'code', 'staff_emails', 'share_learners', 'active'];

const lower = (email) => (email || '').toLowerCase().trim();
const only = (data) => Object.fromEntries(Object.entries(data).filter(([k, v]) => PARTNER_COLUMNS.includes(k) && v !== undefined));

export function createPartnersApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';

  // Base44's partner function, with its plain error messages.
  async function invoke(payload) {
    try {
      const res = await b44.functions.invoke('partner', payload);
      return res.data;
    } catch (err) {
      const error = new Error(err?.response?.data?.error || 'Something went wrong. Please try again.');
      error.status = err?.response?.status;
      throw error;
    }
  }
  const rpc = async (name, args) => {
    const { data, error } = await sb().rpc(name, args);
    if (error) {
      const e = new Error(error.code === '42501' ? 'You are not on this program\'s staff list.' : 'Something went wrong. Please try again.');
      e.code = error.code;
      throw e;
    }
    return data;
  };

  return {
    // Active programs a learner can pick: [{ code, name, shareLearners }]
    async list() {
      if (!onSupabase) return (await invoke({ action: 'list' })).partners || [];
      return listPrograms(sb());
    },

    // The learner picks (or re-picks) a program by its code.
    async join(code, { name, share } = {}) {
      if (!onSupabase) return (await invoke({ action: 'join', code, name, share })).membership;
      try {
        return await joinProgramByCode(sb(), code, { name, share });
      } catch (err) {
        const e = new Error(err?.code === 'P0002' ? 'We could not find that program.' : 'Something went wrong. Please try again.');
        e.code = err?.code;
        throw e;
      }
    },

    // The programs whose staff list has the signed-in email.
    async staffPrograms() {
      if (!onSupabase) return (await invoke({ action: 'staff' })).partners || [];
      return myStaffPrograms(sb());
    },

    // Staff: [{ id, name, status, since }]
    async members(code) {
      if (!onSupabase) return (await invoke({ action: 'members', code })).members || [];
      return ((await rpc('program_members', { p_code: code })) || [])
        .map((m) => ({ id: m.user_id, name: m.name, status: m.status, since: m.since }));
    },

    // Staff: confirm, "not ours" (removed) or back to pending. `member` is a
    // row from members(). Returns { id, status }.
    async setStatus(code, member, status) {
      if (!onSupabase) return (await invoke({ action: 'setStatus', id: member.id, status })).member;
      await rpc('set_member_status', { p_code: code, p_user_id: member.id, p_status: status });
      return { id: member.id, status };
    },

    // Staff: { totals, learners } over the program's confirmed learners.
    async summary(code) {
      if (!onSupabase) return invoke({ action: 'summary', code });
      return rpc('program_summary', { p_code: code });
    },

    // The learner's own program (or null).
    async myMembership() {
      const user = await auth.me();
      if (!onSupabase) {
        const rows = await b44.entities.ProgramMembership.filter({ user_email: lower(user.email) }, '-created_date', 10);
        return rows[0] || null;
      }
      const row = await run(sb().from('program_memberships').select('*').eq('user_id', user.id).maybeSingle());
      return row ? { ...row, id: row.user_id, created_date: row.created_at } : null;
    },

    // The learner leaves their program.
    async leave() {
      const user = await auth.me();
      if (!onSupabase) {
        const rows = await b44.entities.ProgramMembership.filter({ user_email: lower(user.email) }, null, 10);
        await Promise.all(rows.map((r) => b44.entities.ProgramMembership.delete(r.id)));
        return;
      }
      await run(sb().from('program_memberships').delete().eq('user_id', user.id));
    },

    // Admin → Partners (admins only on both sides).
    admin: {
      list: async () => {
        if (!onSupabase) return b44.entities.Partner.list('name', 500);
        return (await run(sb().from('partners').select('*').order('name', { ascending: true }))) || [];
      },
      create: async (data) => {
        if (!onSupabase) return b44.entities.Partner.create(data);
        return run(sb().from('partners').insert(only(data)).select('*').single());
      },
      update: async (id, data) => {
        if (!onSupabase) return b44.entities.Partner.update(id, data);
        return run(sb().from('partners').update(only(data)).eq('id', id).select('*').single());
      },
    },
  };
}

export const partnersApi = createPartnersApi();
export default partnersApi;
