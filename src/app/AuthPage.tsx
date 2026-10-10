import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { supabase, friendlyError } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { Turnstile, captchaRequired } from './Turnstile';
import { useTitle } from './useTitle';

export default function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const isSignup = mode === 'signup';
  useTitle(isSignup ? 'Create your account' : 'Log in');
  const nav = useNavigate();
  const [params] = useSearchParams();
  const { session, loading } = useAuth();
  const rawNext = params.get('next') ?? '';
  const next =
    params.get('plan') === 'pro'
      ? '/app/billing?upgrade=1'
      : /^\/(app|admin)(\/|$)/.test(rawNext)
        ? rawNext
        : '/app';

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [captcha, setCaptcha] = useState<string | null>(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (!loading && session) nav(next, { replace: true });
  }, [loading, session, nav, next]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(e?: FormEvent) {
    e?.preventDefault();
    setError('');
    if (captchaRequired() && !captcha) {
      setError('Complete the check below first.');
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        shouldCreateUser: isSignup,
        data: isSignup && name.trim() ? { full_name: name.trim() } : undefined,
        captchaToken: captcha ?? undefined,
      },
    });
    setBusy(false);
    setCaptcha(null);
    setCaptchaKey((k) => k + 1);
    if (error) {
      setError(
        /signups not allowed|user not found/i.test(error.message)
          ? 'No account uses that email yet. Create one instead.'
          : friendlyError(error),
      );
      return;
    }
    setStep('code');
    setCooldown(60);
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: 'email' });
    setBusy(false);
    if (error) {
      setError(friendlyError(error));
      return;
    }
    nav(next, { replace: true });
  }

  return (
    <div className="auth">
      <div className="auth-panel">
        <Link to="/" aria-label="KriosityOps home" className="auth-logo">
          <Logo size={30} />
        </Link>

        {step === 'email' ? (
          <form className="form" onSubmit={sendCode}>
            <div>
              <h1>{isSignup ? 'Create your account' : 'Log in'}</h1>
              <p className="auth-sub">
                {isSignup ? 'Free for 2 apps. We’ll email you a sign-in code; no password to remember.' : 'We’ll email you a sign-in code.'}
              </p>
            </div>
            {isSignup && (
              <label>
                Your name
                <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={80} />
              </label>
            )}
            <label>
              Email
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" autoFocus />
            </label>
            <Turnstile onToken={setCaptcha} resetKey={captchaKey} />
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary auth-btn" disabled={busy}>
              {busy ? 'Sending code…' : 'Email me a code'}
            </button>
            <p className="auth-switch">
              {isSignup ? (
                <>
                  Already have an account? <Link to={`/login${params.get('plan') ? '?plan=pro' : ''}`}>Log in</Link>
                </>
              ) : (
                <>
                  New here? <Link to="/signup">Create a free account</Link>
                </>
              )}
            </p>
            {isSignup && (
              <p className="auth-fine">
                By creating an account you agree to the <a href="/terms">terms</a> and <a href="/privacy">privacy policy</a>.
              </p>
            )}
          </form>
        ) : (
          <form className="form" onSubmit={verify}>
            <div>
              <h1>Check your email</h1>
              <p className="auth-sub">
                We sent a code to <strong>{email}</strong>. It expires in 10 minutes. Check spam if it isn’t there.
              </p>
            </div>
            <label>
              Sign-in code
              <input
                className="auth-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6,8}"
                maxLength={8}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </label>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn-primary auth-btn" disabled={busy || code.length < 6}>
              {busy ? 'Checking…' : isSignup ? 'Create account' : 'Log in'}
            </button>
            <Turnstile onToken={setCaptcha} resetKey={captchaKey} />
            <div className="auth-row">
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => setStep('email')}>
                Use a different email
              </button>
              <button type="button" className="btn btn-quiet btn-sm" disabled={cooldown > 0 || busy} onClick={() => sendCode()}>
                {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
              </button>
            </div>
          </form>
        )}
      </div>
      <aside className="auth-aside" aria-hidden="true">
        <p className="auth-quote">Which Supabase account was that on?</p>
        <p className="auth-answer">Now you’ll know.</p>
      </aside>
    </div>
  );
}
