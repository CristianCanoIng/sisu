import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

export const SUPABASE_URL = 'https://egaaljrvcvtsfmwjifsl.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_6GCzhkK02OYXPYObAeQdUg_NYVrxWnH';

export const isConfigured = true;

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export function assertSupabaseConfigured() {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error('Supabase no está configurado.');
  }
}
