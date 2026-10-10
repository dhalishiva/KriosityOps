import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Board, worstSocial } from '../frames/Board';
import { useAuth } from '../lib/auth';
import { supabase, friendlyError } from '../lib/supabase';
import { APP_COLORS } from '../lib/catalog';
import { FREE_APP_LIMIT } from '../lib/config';
import type { BoardRow } from '../lib/types';
import { loadBoard } from './data';
import { Dialog } from './Dialog';
import { useTitle } from './useTitle';

export default function AppsPage() {
  useTitle('Your apps');
  const nav = useNavigate();
  const { profile } = useAuth();
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const { rows } = await loadBoard();
      setRows(rows);
    } catch (e) {
      setError(friendlyError(e));
    }
  }, []);
  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFree = profile?.plan !== 'pro';
  const atLimit = isFree && (rows?.length ?? 0) >= FREE_APP_LIMIT;
  const quiet = rows?.filter((r) => ['due', 'late'].includes(worstSocial(r)?.state ?? '')).length ?? 0;
  const locked = rows?.filter((r) => r.app.in_use_by).length ?? 0;

  return (
    <div className="page">
      <div className="page-top">
        <div>
          <h1>Your apps</h1>
          {rows && rows.length > 0 && (
            <p className="page-sub">
              {rows.length} {rows.length === 1 ? 'app' : 'apps'}
              {quiet > 0 && `, ${quiet} with a post due`}
              {locked > 0 && `, ${locked} being worked on`}
              {isFree && ` (free plan: ${FREE_APP_LIMIT} apps)`}
            </p>
          )}
        </div>
        {rows && rows.length > 0 &&
          (atLimit ? (
            <Link className="btn btn-primary" to="/app/billing?upgrade=1">
              Upgrade to add more apps
            </Link>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setAdding(true)}>
              Add an app
            </button>
          ))}
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {!rows && !error && <div className="skeleton" aria-label="Loading" />}

      {rows && rows.length === 0 && (
        <section className="empty">
          <h2>Add your first app.</h2>
          <p>Give it a name. Next you’ll record where it lives and where you post about it.</p>
          <NewAppForm
            onCreated={(id) => nav(`/app/${id}?new=1`)}
            submitLabel="Add app"
          />
        </section>
      )}

      {rows && rows.length > 0 && (
        <div className="panel">
          <Board rows={rows} onOpen={(id) => nav(`/app/${id}`)} />
        </div>
      )}

      <Dialog open={adding} onClose={() => setAdding(false)} title="Add an app">
        <NewAppForm onCreated={(id) => nav(`/app/${id}?new=1`)} submitLabel="Add app" />
      </Dialog>
    </div>
  );
}

function NewAppForm({ onCreated, submitLabel }: { onCreated: (id: string) => void; submitLabel: string }) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [color, setColor] = useState(APP_COLORS[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    let u = url.trim();
    if (u && !/^https?:\/\//.test(u)) u = `https://${u}`;
    const { data, error } = await supabase.from('apps').insert({ name: name.trim(), url: u || null, color }).select('id').single();
    setBusy(false);
    if (error) return setError(friendlyError(error));
    onCreated(data.id);
  }

  return (
    <form className="form" onSubmit={submit}>
      <label>
        App name
        <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Invoicely" autoFocus />
      </label>
      <label>
        Website <span className="optional">optional</span>
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="invoicely.io" inputMode="url" />
      </label>
      <fieldset className="swatches">
        <legend>Colour on the board</legend>
        {APP_COLORS.map((c) => (
          <label key={c} className="swatch" style={{ background: c }}>
            <input type="radio" name="color" value={c} checked={color === c} onChange={() => setColor(c)} />
            <span className="visually-hidden">{c}</span>
          </label>
        ))}
      </fieldset>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={busy || !name.trim()}>
        {busy ? 'Adding…' : submitLabel}
      </button>
    </form>
  );
}
