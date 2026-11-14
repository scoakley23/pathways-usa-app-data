// Partner programs on Supabase, the parts that go with signing in (Step 2):
// the programs a learner can pick, joining one by code, and whether the
// signed-in email is on a program's staff list. Same shapes as Base44's
// `partner` function (base44/shared/partners.js publicPartner). The staff
// screen's member lists and totals move in Step 3.
//
// `client` is passed in so tests can use a fake one.

const publicPartner = (p) => ({ code: p.code, name: p.name || '', shareLearners: p.share_learners === true });

async function rpc(client, name, args) {
  const { data, error } = await client.rpc(name, args);
  if (error) throw error;
  return data;
}

export const listPrograms = async (client) => (await rpc(client, 'active_programs') || []).map(publicPartner);

export const myStaffPrograms = async (client) => (await rpc(client, 'my_staff_programs') || []).map(publicPartner);

export const joinProgramByCode = (client, code, { name, share } = {}) =>
  rpc(client, 'join_program', { p_code: code, p_name: name ?? null, p_share: share === true });

// Bound to the app's client, for src/lib/partners.js.
export function supabasePrograms(getClient) {
  return {
    list: () => listPrograms(getClient()),
    staff: () => myStaffPrograms(getClient()),
    join: (code, opts) => joinProgramByCode(getClient(), code, opts),
  };
}
