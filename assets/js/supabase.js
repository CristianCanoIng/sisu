import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
export const SUPABASE_URL='https://TU-PROYECTO.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY='TU_PUBLISHABLE_KEY';
export const isConfigured=!SUPABASE_URL.includes('TU-PROYECTO')&&!SUPABASE_PUBLISHABLE_KEY.includes('TU_PUBLISHABLE_KEY');
export const supabase=createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
export function assertSupabaseConfigured(){if(!isConfigured)throw new Error('Falta configurar SUPABASE_URL y SUPABASE_PUBLISHABLE_KEY en assets/js/supabase.js')}