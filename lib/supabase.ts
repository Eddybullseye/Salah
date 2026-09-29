import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Singleton client instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (supabaseInstance) return supabaseInstance;

  // Check custom runtime storage or env
  let runtimeUrl = supabaseUrl;
  let runtimeKey = supabaseAnonKey;

  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('salah_custom_supabase_url');
    const savedKey = localStorage.getItem('salah_custom_supabase_anon_key');
    if (savedUrl) runtimeUrl = savedUrl;
    if (savedKey) runtimeKey = savedKey;
  }

  if (runtimeUrl && runtimeKey && runtimeUrl.startsWith('http')) {
    try {
      supabaseInstance = createClient(runtimeUrl, runtimeKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Could not initialize Supabase client:', e);
      return null;
    }
  }

  return null;
}

export const isSupabaseConfigured = (): boolean => {
  return !!getSupabase();
};
