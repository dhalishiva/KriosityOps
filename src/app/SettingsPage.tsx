import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../lib/auth';
import { supabase, friendlyError } from '../lib/supabase';
import { SITE } from '../lib/config';
import { useTitle } from './useTitle';

export default function SettingsPage() {
  useTitle('Settings');
  const { profile, session, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => setName(profile?.full_name ?? ''), [profile]);

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const { error } = await supabase.from('profiles').update({ full_name: name.trim() || null }).eq('id', session!.user.id);
    setBusy(false);
    if (error) return setError(friendlyError(error));
    await refreshProfile();
    setMsg('Saved.');
    setTimeout(() => setMsg(''), 2000);
  }

  const del = `mailto:${SITE.supportEmail}?subject=${encodeURIComponent('Delete my KriosityOps account')}&body=${encodeURIComponent(
    `Please delete my account and all its data: ${session?.user.email}`,
  )}`;

  return (
    <div className="page page-narrow">
      <h1>Settings</h1>
      <section className="panel">
        <h2>Your details</h2>
        <form className="form" onSubmit={save}>
          <label>
            Name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} autoComplete="name" />
          </label>
          <label>
            Email
            <input value={session?.user.email ?? ''} disabled />
            <span className="hint">You sign in with codes sent to this address.</span>
          </label>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </button>
            {msg && (
              <span className="saved" role="status">
                {msg}
              </span>
            )}
          </div>
        </form>
      </section>
      <section className="panel">
        <h2>Delete your account</h2>
        <p className="page-sub">This removes every app, registry entry and post log. Email us from your account address and it’s done within 7 days.</p>
        <a className="btn btn-danger" href={del}>
          Request deletion
        </a>
      </section>
    </div>
  );
}
