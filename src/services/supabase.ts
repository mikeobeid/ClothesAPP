import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;
let envStatusLogged = false;

function getSupabaseEnv() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

  if (!envStatusLogged) {
    envStatusLogged = true;
    console.log(
      '[Supabase] EXPO_PUBLIC_SUPABASE_URL:',
      url.length > 0 ? 'set' : 'missing',
    );
    console.log(
      '[Supabase] EXPO_PUBLIC_SUPABASE_ANON_KEY:',
      anonKey.length > 0 ? 'set' : 'missing',
    );
  }

  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseEnv();
  return Boolean(url && anonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return null;
  }

  if (!client) {
    client = createClient(url, anonKey);
  }

  return client;
}
