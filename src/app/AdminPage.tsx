import { useEffect, useState } from 'react';
import { supabase, friendlyError } from '../lib/supabase';
import type { Profile } from '../lib/types';
import { useTitle } from './useTitle';

type Stats = { users_total: number; users_24h: number; users_7d: number; pro_users: number; apps_total: number; posts_7d: number; messages: number };
type Msg = { id: string; name: string; email: string; message: string; created_at: string };

export default function AdminPage() {
  useTitle('Admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<(Profile & { apps: number })[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [s, p, a, m] = await Promise.all([
          supabase.rpc('admin_stats'),
          supabase.from('profiles').select('*').order('created_at', { ascending: false }).limit(500),
          supabase.from('apps').select('owner_id'),
          supabase.from('contact_messages').select('*').order('created_at', { ascending: false }).limit(50),
        ]);
        if (s.error) throw s.error;
        setStats(s.data as Stats);
        const counts = new Map<string, number>();
        for (const r of (a.data ?? []) as { owner_id: string }[]) counts.set(r.owner_id, (counts.get(r.owner_id) ?? 0) + 1);
        setUsers(((p.data ?? []) as Profile[]).map((u) => ({ ...u, apps: counts.get(u.id) ?? 0 })));
        setMsgs((m.data ?? []) as Msg[]);
      } catch (e) {
        setError(friendlyError(e));
      }
    })();
  }, []);

  const shown = users.filter((u) => !q || u.email.toLowerCase().includes(q.toLowerCase()) || (u.full_name ?? '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="page">
      <h1>Admin</h1>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {stats && (
        <dl className="admin-stats">
          <div>
            <dt>New users, 24 hours</dt>
            <dd>{stats.users_24h}</dd>
          </div>
          <div>
            <dt>New users, 7 days</dt>
            <dd>{stats.users_7d}</dd>
          </div>
          <div>
            <dt>Total users</dt>
            <dd>{stats.users_total}</dd>
          </div>
          <div>
            <dt>On Pro</dt>
            <dd>{stats.pro_users}</dd>
          </div>
          <div>
            <dt>Apps on boards</dt>
            <dd>{stats.apps_total}</dd>
          </div>
          <div>
            <dt>Posts logged, 7 days</dt>
            <dd>{stats.posts_7d}</dd>
          </div>
        </dl>
      )}

      <section className="panel">
        <div className="panel-head">
          <h2>Users</h2>
          <input className="field field-sm" placeholder="Search email or name" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search users" />
        </div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Plan</th>
                <th>Apps</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.full_name ?? '—'}</td>
                  <td>
                    <span className={`plan-badge plan-${u.plan}`}>{u.plan === 'pro' ? `Pro (${u.plan_provider ?? 'manual'})` : 'Free'}</span>
                  </td>
                  <td>{u.apps}</td>
                  <td>{new Date(u.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h2>Contact messages</h2>
        {msgs.length === 0 ? (
          <p className="board-muted">No messages yet.</p>
        ) : (
          <ul className="msgs">
            {msgs.map((m) => (
              <li key={m.id}>
                <p>
                  <strong>{m.name}</strong> <a href={`mailto:${m.email}`}>{m.email}</a>{' '}
                  <span className="board-muted">{new Date(m.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                </p>
                <p className="msg-body">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
