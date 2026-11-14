// "Delete all my data" (Standalone Step 3, PR 8).
//
// Switch off (Base44): deletes every learner record tied to the email
// (src/lib/deleteMyData.js lists them; its test checks every learner entity
// is covered), asks the pilot-reminders function to forget the reminder
// records, then resets the learner fields on the sign-in account, which the
// app can't delete.
//
// Switch on (Supabase): one call, delete_my_account(). It deletes the login
// itself, and every learner table is deleted with it (each one cascades from
// the login; src/lib/supabaseRules.test.js checks every table with a
// user_id). Then this device is signed out.
//
// The caller clears this device's browser storage and leaves the page.
import { DATA_PROVIDER } from '@/api/db';
import { base44 } from '@/api/base44Client';
import { getSupabase } from '@/api/supabaseClient';
import { auth as appAuth } from '@/api/auth';
import { deleteSteps, FUNCTION_STEPS, ACCOUNT_RESET } from '@/lib/deleteMyData';

export function createAccountApi({ provider = DATA_PROVIDER, base44: b44 = base44, supabase = getSupabase, auth = appAuth } = {}) {
  const sb = () => (typeof supabase === 'function' ? supabase() : supabase);
  const onSupabase = provider === 'supabase';

  return {
    // True when deleting also removes the sign-in (Supabase).
    deletesLogin: onSupabase,

    // onProgress(text) is called with what is being removed.
    async deleteAllMyData({ onProgress = () => {} } = {}) {
      const user = await auth.me();
      if (onSupabase) {
        onProgress('Removing your account and all your data...');
        const { error } = await sb().rpc('delete_my_account');
        if (error) throw new Error('Something went wrong while deleting your data. Please try again.');
        await auth.signOut();
        return { deletedLogin: true };
      }
      const steps = deleteSteps(user.email);
      for (let i = 0; i < steps.length; i++) {
        onProgress(`Removing ${steps[i][0]} (${i + 1}/${steps.length})...`);
        await b44.entities[steps[i][1]].deleteMany(steps[i][2]);
      }
      for (const [label, fn, body] of FUNCTION_STEPS) {
        onProgress(`Removing ${label}...`);
        await b44.functions.invoke(fn, body);
      }
      // The sign-in account itself can't be deleted on Base44, so reset the
      // learner fields stored on it.
      onProgress('Resetting your account details...');
      await auth.updateMe(ACCOUNT_RESET);
      return { deletedLogin: false };
    },
  };
}

export const account = createAccountApi();
export default account;
