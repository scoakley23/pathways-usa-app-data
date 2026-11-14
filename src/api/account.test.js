// "Delete all my data" through src/api/account.js (Standalone Step 3, PR 8),
// with fake clients and @example.test accounts.
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/base44Client', () => ({ base44: { entities: {}, functions: {} } }));
vi.mock('@/api/supabaseClient', () => ({ getSupabase: () => null }));
vi.mock('@/api/auth', () => ({ auth: {}, AUTH_PROVIDER: 'base44' }));

const { createAccountApi } = await import('./account');
const { deleteSteps, FUNCTION_STEPS, ACCOUNT_RESET } = await import('@/lib/deleteMyData');

const ANA = { id: 'u-ana', email: 'Ana@Example.test' };
const fakeAuth = () => ({ me: vi.fn(async () => ANA), signOut: vi.fn(async () => {}), updateMe: vi.fn(async () => ANA) });

describe('on Supabase', () => {
  it('one call removes the sign-in and everything with it, then signs this device out', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    const auth = fakeAuth();
    const api = createAccountApi({ provider: 'supabase', supabase: { rpc }, auth });
    const progress = [];
    expect(api.deletesLogin).toBe(true);
    expect(await api.deleteAllMyData({ onProgress: (t) => progress.push(t) })).toEqual({ deletedLogin: true });
    expect(rpc).toHaveBeenCalledWith('delete_my_account');
    expect(auth.signOut).toHaveBeenCalled();
    expect(auth.updateMe).not.toHaveBeenCalled();
    expect(progress).toEqual(['Removing your account and all your data...']);
  });

  it('if the delete fails, nothing is signed out and the learner can try again', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'boom' } }));
    const auth = fakeAuth();
    const api = createAccountApi({ provider: 'supabase', supabase: { rpc }, auth });
    await expect(api.deleteAllMyData()).rejects.toThrow('Please try again');
    expect(auth.signOut).not.toHaveBeenCalled();
  });
});

describe('on Base44 (switch off), the same steps as before', () => {
  it('deletes every learner entity by email, forgets reminders, resets the account', async () => {
    const deleteMany = vi.fn(async () => ({}));
    const entities = new Proxy({}, { get: (_, name) => ({ deleteMany: (q) => deleteMany(name, q) }) });
    const invoke = vi.fn(async () => ({ data: {} }));
    const auth = fakeAuth();
    const api = createAccountApi({ provider: 'base44', base44: { entities, functions: { invoke } }, auth });
    expect(api.deletesLogin).toBe(false);
    expect(await api.deleteAllMyData()).toEqual({ deletedLogin: false });
    expect(deleteMany.mock.calls).toEqual(deleteSteps(ANA.email).map(([, entity, filter]) => [entity, filter]));
    expect(invoke.mock.calls).toEqual(FUNCTION_STEPS.map(([, fn, body]) => [fn, body]));
    expect(auth.updateMe).toHaveBeenCalledWith(ACCOUNT_RESET);
    expect(auth.signOut).not.toHaveBeenCalled(); // the screen signs out after clearing the device
  });
});
