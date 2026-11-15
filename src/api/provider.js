// The switch (Standalone Steps 2-4), in one place with no Base44 imports, so
// any module can ask which side is on: 'supabase' when VITE_AUTH_PROVIDER is
// "supabase" and the Supabase URL and anon key are set; otherwise 'base44'.
import { supabaseConfigured } from '@/api/supabaseClient';

export const WANTS_SUPABASE = import.meta.env.VITE_AUTH_PROVIDER === 'supabase';
export const PROVIDER = WANTS_SUPABASE && supabaseConfigured() ? 'supabase' : 'base44';
