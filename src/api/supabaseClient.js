// The one Supabase client for the browser (Standalone Step 2). Only files in
// src/api may import it; screens go through src/api/auth.js (and, from Step
// 3, the other src/api modules).
//
// It uses the PUBLIC anon key only. The service-role key never goes in
// browser code. Safety comes from the row-level security in supabase/.
import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConfigured = () => Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let client = null;

export function getSupabase() {
  if (!supabaseConfigured()) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true, // stay signed in on this device
        autoRefreshToken: true, // renew the login quietly
        detectSessionInUrl: false, // we sign in with a code, never a link
        storageKey: 'pathways_auth',
      },
    });
  }
  return client;
}
