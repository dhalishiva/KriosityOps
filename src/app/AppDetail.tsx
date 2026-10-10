import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ChannelList, type ChannelItem } from '../frames/Channels';
import { RegistryTable, type RegistryItem } from '../frames/Registry';
import { LockIcon } from '../frames/Board';
import { supabase, friendlyError } from '../lib/supabase';
import { APP_COLORS, APP_STATUSES, KINDS, PLATFORMS, PROVIDERS, WORKERS, ago, freshness, platformLabel, suggestLink, type Kind } from '../lib/catalog';
import type { App, Metric, Post, Resource } from '../lib/types';
import { loadApp } from './data';
import { Dialog } from './Dialog';
import { useTitle } from './useTitle';

type Loaded = Awaited<ReturnType<typeof loadApp>>;

export default function AppDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [d, setD] = useState<Loaded | null>(null);
  const [error, setError] = useState('');
  const [editRes, setEditRes] = useState<Resource | 'new' | null>(null);
  const [openChan, setOpenChan] = useState<ChannelItem | null>(null);
  const [addChan, setAddChan] = useState(false);
  const [editApp, setEditApp] = useState(false);
  useTitle(d?.app?.name ?? 'App');

  const refresh = useCallback(async () => {
    try {
      setD(await loadApp(id));
    } catch (e) {
      setError(friendlyError(e));
    }
  }, [id]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Keep the open channel dialog in sync after a refresh
  useEffect(() => {
    if (openChan && d) setOpenChan(d.channels.find((c) => c.id === openChan.id) ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [d]);

  if (error) return <div className="page"><p className="form-error" role="alert">{error}</p></div>;
  if (!d) return <div className="page"><div className="skeleton" aria-label="Loading" /></div>;
  if (!d.app)
    return (
      <div className="page">
        <h1>App not found</h1>
        <p className="page-sub">It may have been deleted. <Link to="/app">Back to your apps</Link></p>
      </div>
    );

  const app = d.app;
  const isNew = params.get('new') === '1' && d.resources.length === 0 && d.channels.length === 0;

  return (
    <div className="page">
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link to="/app">Your apps</Link>
      </nav>

      <div className="page-top app-head">
        <div className="app-title">
          <span className="board-swatch app-swatch" style={{ background: app.color }} aria-hidden="true" />
          <div>
            <h1>{app.name}</h1>
            <p className="page-sub">
              {app.url ? (
                <a href={app.url} target="_blank" rel="noopener noreferrer">
                  {app.url.replace(/^https?:\/\//, '')}
                </a>
              ) : (
                'No website yet'
              )}
              <span className={`status status-${app.status}`}>{app.status}</span>
            </p>
          </div>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditApp(true)}>
          Edit app
        </button>
      </div>

      <InUse app={app} onChange={refresh} />

      {isNew && (
        <div className="callout">
          <strong>Next: record where {app.name} lives.</strong> Add its database, host and repo below, then the places you post about it.
        </div>
      )}

      <Numbers metrics={d.metrics} />

      <div className="dash-grid">
        <section className="panel" aria-labelledby="soc-h">
          <div className="panel-head">
            <h2 id="soc-h">Social log</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setAddChan(true)}>
              Add a channel
            </button>
          </div>
          {d.channels.length === 0 ? (
            <div className="panel-empty">
              <p>Add the places you post about {app.name}, like X or a subreddit, and how often you mean to post.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setAddChan(true)}>
                Add a channel
              </button>
            </div>
          ) : (
            <ChannelList
              items={d.channels}
              onOpen={setOpenChan}
              action={(c) => (
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpenChan(c)}>
                  Log a post
                </button>
              )}
            />
          )}
        </section>

        <section className="panel" aria-labelledby="reg-h">
          <div className="panel-head">
            <h2 id="reg-h">Where it lives</h2>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditRes('new')}>
              Add
            </button>
          </div>
          {d.resources.length === 0 ? (
            <div className="panel-empty">
              <p>Record the database, host, repo and domain {app.name} uses: which account, which project.</p>
              <button type="button" className="btn btn-primary btn-sm" onClick={() => setEditRes('new')}>
                Add the first one
              </button>
            </div>
          ) : (
            <RegistryTable
              items={d.resources as RegistryItem[]}
              actions={(it) => (
                <>
                  <CopyButton text={it.project ?? ''} />
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => setEditRes(d.resources.find((r) => r.id === it.id) ?? null)}>
                    Edit
                  </button>
                </>
              )}
            />
          )}
        </section>
      </div>

      <Dialog open={editRes !== null} onClose={() => setEditRes(null)} title={editRes === 'new' ? 'Add where it lives' : 'Edit entry'}>
        <ResourceForm
          appId={app.id}
          resource={editRes === 'new' ? null : editRes}
          onDone={() => {
            setEditRes(null);
            refresh();
          }}
        />
      </Dialog>

      <Dialog open={addChan} onClose={() => setAddChan(false)} title="Add a channel">
        <ChannelForm
          appId={app.id}
          onDone={() => {
            setAddChan(false);
            refresh();
          }}
        />
      </Dialog>

      <Dialog
        open={openChan !== null}
        onClose={() => setOpenChan(null)}
        title={openChan ? `${platformLabel(openChan.platform)}${openChan.handle ? ` ${openChan.handle}` : ''}` : ''}
      >
        {openChan && (
          <ChannelPanel
            appId={app.id}
            channel={openChan}
            posts={d.posts.filter((p) => p.channel_id === openChan.id)}
            onChange={refresh}
            onDeleted={() => {
              setOpenChan(null);
              refresh();
            }}
          />
        )}
      </Dialog>

      <Dialog open={editApp} onClose={() => setEditApp(false)} title="Edit app">
        <AppForm
          app={app}
          onDone={() => {
            setEditApp(false);
            refresh();
          }}
          onDeleted={() => nav('/app')}
        />
      </Dialog>
    </div>
  );
}

/* ───────── who's working on it ───────── */
function InUse({ app, onChange }: { app: App; onChange: () => void }) {
  const [who, setWho] = useState('Claude');
  const [busy, setBusy] = useState(false);

  async function set(value: string | null) {
    setBusy(true);
    await supabase.from('apps').update({ in_use_by: value, in_use_since: value ? new Date().toISOString() : null }).eq('id', app.id);
    setBusy(false);
    onChange();
  }

  if (app.in_use_by) {
    const since = app.in_use_since ? new Date(app.in_use_since) : null;
    return (
      <div className="inuse inuse-on" role="status">
        <span className="inuse-text">
          <LockIcon /> <strong>{app.in_use_by}</strong> is working on {app.name}
          {since && <span className="board-muted"> since {since.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>}.
          Don’t start other work on its database until it’s done.
        </span>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => set(null)}>
          Mark as free
        </button>
      </div>
    );
  }
  return (
    <div className="inuse">
      <span className="inuse-text">Nobody is working on {app.name} right now.</span>
      <span className="inuse-set">
        <label className="visually-hidden" htmlFor="who">
          Who is starting work
        </label>
        <select id="who" className="field field-sm" value={who} onChange={(e) => setWho(e.target.value)}>
          {WORKERS.map((w) => (
            <option key={w}>{w}</option>
          ))}
        </select>
        <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => set(who)}>
          Mark as in use
        </button>
      </span>
    </div>
  );
}

/* ───────── daily numbers ───────── */
function Numbers({ metrics }: { metrics: Metric[] }) {
  const m = metrics[0];
  if (!m)
    return (
      <div className="numbers numbers-empty">
        <span className="board-muted">
          Daily users and visitors will appear here once the 6 AM collector is connected for this app. It’s rolling out to Pro next.
        </span>
      </div>
    );
  const f = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-IN'));
  return (
    <div className="numbers">
      <div>
        <span className="num">+{f(m.users_new_24h)}</span>
        <span className="num-label">New users, last 24 hours</span>
      </div>
      <div>
        <span className="num">{f(m.users_total)}</span>
        <span className="num-label">Total users</span>
      </div>
      <div>
        <span className="num">{f(m.visitors_24h)}</span>
        <span className="num-label">Visitors, last 24 hours</span>
      </div>
      <span className="board-muted num-when">As of {new Date(m.day).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  if (!text) return null;
  return (
    <button
      type="button"
      className="btn btn-quiet btn-sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

/* ───────── registry form ───────── */
function ResourceForm({ appId, resource, onDone }: { appId: string; resource: Resource | null; onDone: () => void }) {
  const [kind, setKind] = useState<Kind>((resource?.kind as Kind) ?? 'database');
  const known = PROVIDERS[kind];
  const initialProvider = resource?.provider ?? known[0] ?? '';
  const [providerChoice, setProviderChoice] = useState(known.includes(initialProvider) || !resource ? initialProvider : 'Other');
  const [otherProvider, setOtherProvider] = useState(resource && !known.includes(resource.provider) ? resource.provider : '');
  const [account, setAccount] = useState(resource?.account ?? '');
  const [project, setProject] = useState(resource?.project ?? '');
  const [link, setLink] = useState(resource?.link ?? '');
  const [linkTouched, setLinkTouched] = useState(Boolean(resource?.link));
  const [notes, setNotes] = useState(resource?.notes ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const provider = providerChoice === 'Other' ? otherProvider.trim() : providerChoice;
  const suggested = useMemo(() => suggestLink(provider, project), [provider, project]);
  const hint = KINDS.find((k) => k.id === kind)?.projectHint ?? '';
  const looksSecret = /(sb_secret_|service_role|sk_live_|sk_test_|eyJhbGciOi|ghp_|github_pat_|password)/i.test(`${account} ${project} ${notes}`);

  function changeKind(k: Kind) {
    setKind(k);
    setProviderChoice(PROVIDERS[k][0] ?? 'Other');
  }

  async function save(e: FormEvent) {
    e.preventDefault();
    if (looksSecret) return setError('That looks like a key or password. Store identifiers only: account, project name or ref, and link.');
    if (!provider) return setError('Name the provider.');
    setBusy(true);
    setError('');
    const row = {
      app_id: appId,
      kind,
      provider,
      account: account.trim() || null,
      project: project.trim() || null,
      link: (linkTouched ? link.trim() : suggested) || null,
      notes: notes.trim() || null,
    };
    const q = resource ? supabase.from('resources').update(row).eq('id', resource.id) : supabase.from('resources').insert(row);
    const { error } = await q;
    setBusy(false);
    if (error) return setError(friendlyError(error));
    onDone();
  }

  async function remove() {
    if (!resource || !confirm(`Delete this ${provider} entry?`)) return;
    await supabase.from('resources').delete().eq('id', resource.id);
    onDone();
  }

  return (
    <form className="form" onSubmit={save}>
      <div className="form-row">
        <label>
          Type
          <select value={kind} onChange={(e) => changeKind(e.target.value as Kind)}>
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Provider
          <select value={providerChoice} onChange={(e) => setProviderChoice(e.target.value)}>
            {known.map((p) => (
              <option key={p}>{p}</option>
            ))}
            <option>Other</option>
          </select>
        </label>
      </div>
      {providerChoice === 'Other' && (
        <label>
          Provider name
          <input required value={otherProvider} onChange={(e) => setOtherProvider(e.target.value)} maxLength={60} />
        </label>
      )}
      <label>
        Account
        <input value={account} onChange={(e) => setAccount(e.target.value)} placeholder="Login email or account name" maxLength={160} />
      </label>
      <label>
        Project
        <input className="mono-input" value={project} onChange={(e) => setProject(e.target.value)} placeholder={hint} maxLength={200} />
      </label>
      <label>
        Console link <span className="optional">optional</span>
        <input
          value={linkTouched ? link : suggested}
          onChange={(e) => {
            setLinkTouched(true);
            setLink(e.target.value);
          }}
          placeholder="https://"
          inputMode="url"
        />
        {!linkTouched && suggested && <span className="hint">Filled in from the project. Edit it if it’s wrong.</span>}
      </label>
      <label>
        Notes <span className="optional">optional</span>
        <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. second free account" maxLength={300} />
      </label>
      <p className="hint">Never put passwords, API keys or service-role keys here.</p>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        {resource && (
          <button type="button" className="btn btn-danger" onClick={remove}>
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

/* ───────── channels ───────── */
function ChannelForm({ appId, onDone }: { appId: string; onDone: () => void }) {
  const [platform, setPlatform] = useState('x');
  const [handle, setHandle] = useState('');
  const [cadence, setCadence] = useState(3);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const hint = PLATFORMS.find((p) => p.id === platform)?.handleHint;

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.from('social_channels').insert({ app_id: appId, platform, handle: handle.trim() || null, cadence_days: cadence });
    setBusy(false);
    if (error) return setError(friendlyError(error));
    onDone();
  }

  return (
    <form className="form" onSubmit={save}>
      <label>
        Platform
        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
          {PLATFORMS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Account or community <span className="optional">optional</span>
        <input value={handle} onChange={(e) => setHandle(e.target.value)} placeholder={hint} maxLength={80} />
      </label>
      <label>
        Post here every
        <span className="inline-field">
          <input type="number" min={1} max={90} value={cadence} onChange={(e) => setCadence(Math.max(1, Math.min(90, Number(e.target.value) || 1)))} />
          days
        </span>
        <span className="hint">The lamp turns amber when a post is due, and red at twice this gap.</span>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn btn-primary" disabled={busy}>
        {busy ? 'Adding…' : 'Add channel'}
      </button>
    </form>
  );
}

const toLocalInput = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

function ChannelPanel({
  appId,
  channel,
  posts,
  onChange,
  onDeleted,
}: {
  appId: string;
  channel: ChannelItem;
  posts: Post[];
  onChange: () => void;
  onDeleted: () => void;
}) {
  const [links, setLinks] = useState('');
  const [note, setNote] = useState('');
  const [when, setWhen] = useState(toLocalInput(new Date()));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [cadence, setCadence] = useState(channel.cadence);
  const f = freshness(channel.lastPostedAt, channel.cadence);

  async function logPost(e: FormEvent) {
    e.preventDefault();
    const list = links
      .split(/\s+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => (/^https?:\/\//.test(s) ? s : `https://${s}`));
    setBusy(true);
    setError('');
    const { error } = await supabase
      .from('social_posts')
      .insert({ channel_id: channel.id, app_id: appId, links: list, note: note.trim() || null, posted_at: new Date(when).toISOString() });
    setBusy(false);
    if (error) return setError(friendlyError(error));
    setLinks('');
    setNote('');
    setWhen(toLocalInput(new Date()));
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    onChange();
  }

  async function removePost(id: string) {
    if (!confirm('Delete this post from the log?')) return;
    await supabase.from('social_posts').delete().eq('id', id);
    onChange();
  }

  async function saveCadence(v: number) {
    setCadence(v);
    await supabase.from('social_channels').update({ cadence_days: v }).eq('id', channel.id);
    onChange();
  }

  async function removeChannel() {
    if (!confirm('Delete this channel and its whole post log?')) return;
    await supabase.from('social_channels').delete().eq('id', channel.id);
    onDeleted();
  }

  return (
    <div className="chan-panel">
      <p className="chan-panel-status">
        <span className={`lamp lamp-${f.state}`} aria-hidden="true" /> Last posted: <strong>{ago(f.days)}</strong>
      </p>

      <form className="form" onSubmit={logPost}>
        <h3>Log a post</h3>
        <label>
          Post links
          <textarea rows={2} value={links} onChange={(e) => setLinks(e.target.value)} placeholder="Paste one or more links, one per line" required />
        </label>
        <div className="form-row">
          <label>
            Posted at
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} max={toLocalInput(new Date())} />
          </label>
          <label>
            Note <span className="optional">optional</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. launch thread" maxLength={200} />
          </label>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="form-actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Logging…' : 'Log post'}
          </button>
          {saved && (
            <span className="saved" role="status">
              Post logged.
            </span>
          )}
        </div>
      </form>

      <h3 className="hist-h">History</h3>
      {posts.length === 0 ? (
        <p className="board-muted">No posts logged yet.</p>
      ) : (
        <ol className="hist">
          {posts.map((p) => (
            <li key={p.id}>
              <span className="hist-when">{new Date(p.posted_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
              <span className="hist-body">
                {p.note && <span>{p.note}</span>}
                {p.links.map((l) => (
                  <a key={l} href={l} target="_blank" rel="noopener noreferrer">
                    {l.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                ))}
              </span>
              <button type="button" className="btn btn-quiet btn-sm" onClick={() => removePost(p.id)} aria-label="Delete post">
                Delete
              </button>
            </li>
          ))}
        </ol>
      )}

      <div className="chan-settings">
        <label>
          Post here every{' '}
          <input className="field field-sm num-input" type="number" min={1} max={90} value={cadence} onChange={(e) => saveCadence(Math.max(1, Math.min(90, Number(e.target.value) || 1)))} />{' '}
          days
        </label>
        <button type="button" className="btn btn-danger btn-sm" onClick={removeChannel}>
          Delete channel
        </button>
      </div>
    </div>
  );
}

/* ───────── edit app ───────── */
function AppForm({ app, onDone, onDeleted }: { app: App; onDone: () => void; onDeleted: () => void }) {
  const [name, setName] = useState(app.name);
  const [url, setUrl] = useState(app.url ?? '');
  const [status, setStatus] = useState(app.status);
  const [color, setColor] = useState(app.color);
  const [description, setDescription] = useState(app.description ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function save(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    let u = url.trim();
    if (u && !/^https?:\/\//.test(u)) u = `https://${u}`;
    const { error } = await supabase.from('apps').update({ name: name.trim(), url: u || null, status, color, description: description.trim() || null }).eq('id', app.id);
    setBusy(false);
    if (error) return setError(friendlyError(error));
    onDone();
  }

  async function remove() {
    if (prompt(`This deletes ${app.name} and everything recorded for it. Type the app name to confirm.`) !== app.name) return;
    await supabase.from('apps').delete().eq('id', app.id);
    onDeleted();
  }

  return (
    <form className="form" onSubmit={save}>
      <label>
        App name
        <input required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Website
        <input value={url} onChange={(e) => setUrl(e.target.value)} inputMode="url" />
      </label>
      <label>
        Stage
        <select value={status} onChange={(e) => setStatus(e.target.value as App['status'])}>
          {APP_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Notes <span className="optional">optional</span>
        <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
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
      <div className="form-actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" className="btn btn-danger" onClick={remove}>
          Delete app
        </button>
      </div>
    </form>
  );
}
