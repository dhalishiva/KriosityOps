import { createClient } from '@supabase/supabase-js';
import { ENV } from './config';

export const supabase = createClient(ENV.supabaseUrl, ENV.supabaseKey, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

/** Turn a Supabase/Postgres error into a sentence a user can act on. */
export function friendlyError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (msg.includes('FREE_LIMIT')) return 'The free plan includes 2 apps. Upgrade to Pro to add more.';
  if (/duplicate key/i.test(msg)) return 'That one already exists.';
  if (/rate limit|too many/i.test(msg)) return 'Too many attempts. Wait a minute and try again.';
  if (/Token has expired|invalid.*otp|otp.*invalid/i.test(msg)) return 'That code is wrong or has expired. Request a new one.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return 'Could not reach the server. Check your connection and try again.';
  return msg.replace(/^.*?:\s(?=[A-Z])/, '');
}
