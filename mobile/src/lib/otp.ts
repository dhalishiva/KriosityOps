import { friendlyError } from './catalog';
import { supabase } from './supabase';

export type Mode = 'login' | 'signup';

/** Same flow as ops.kriosity.in: no passwords, a 6-digit code by email. */
export async function sendCode(email: string, mode: Mode, name?: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: mode === 'signup',
      data: mode === 'signup' && name?.trim() ? { full_name: name.trim() } : undefined,
    },
  });
  if (!error) return null;
  if (/signups not allowed|user not found/i.test(error.message)) return 'No account uses that email yet. Create one instead.';
  if (/captcha/i.test(error.message)) return 'Sign-in from the app is blocked by the captcha setting. Turn off Captcha in Supabase Auth, or log in on ops.kriosity.in.';
  return friendlyError(error);
}

