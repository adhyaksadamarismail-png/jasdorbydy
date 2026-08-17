import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const rawKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  rawKey &&
  !rawUrl.includes('your-supabase-project-url') &&
  !rawKey.includes('your-supabase-anon-key-here')
);

// Fallback placeholder URL/Key for build & SSR safety when env vars are unconfigured
const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Safe Supabase query execution wrapper with automatic timeout and unconfigured protection.
 * Prevents server API hanging if Supabase credentials are missing or network is unreachable.
 */
export async function safeSupabaseQuery<T>(
  queryPromise: PromiseLike<T>,
  timeoutMs = 2500
): Promise<T | null> {
  if (!isSupabaseConfigured) return null;

  let timer: any;
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), timeoutMs);
  });

  try {
    const res = (await Promise.race([Promise.resolve(queryPromise), timeoutPromise])) as T | null;
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    console.warn('[SUPABASE SAFE QUERY WARNING]', err);
    return null;
  }
}
