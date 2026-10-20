import { supabase } from '../lib/supabase';
import type { App, BoardRow, Channel, Metric, Post, Resource } from '../lib/types';
import type { ChannelItem } from '../frames/Channels';

const KIND_ORDER = ['database', 'hosting', 'repo', 'domain', 'payments', 'email', 'storage', 'analytics', 'other'];
export const byKind = (a: { kind: string }, b: { kind: string }) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind);

/** Latest post per channel, from a list sorted newest first. */
function latestByChannel(posts: Post[]) {
  const m = new Map<string, { last: Post; count: number }>();
  for (const p of posts) {
    const cur = m.get(p.channel_id);
    if (!cur) m.set(p.channel_id, { last: p, count: 1 });
    else cur.count++;
  }
  return m;
}

/** Signed-in user's id. Admins can read every user's apps, so lists are always scoped to the owner. */
async function myId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

export async function loadBoard(): Promise<{ apps: App[]; rows: BoardRow[] }> {
  const uid = await myId();
  const [apps, res, chans, posts, metrics] = await Promise.all([
    supabase.from('apps').select('*').eq('owner_id', uid).order('created_at'),
    supabase.from('resources').select('app_id,kind,provider,project'),
    supabase.from('social_channels').select('*'),
    supabase.from('social_posts').select('id,channel_id,app_id,posted_at,links,note').order('posted_at', { ascending: false }).limit(2000),
    supabase.from('metrics_daily').select('app_id,day,users_total,users_new_24h,visitors_24h,pageviews_24h').order('day', { ascending: false }).limit(500),
  ]);
  const err = apps.error || res.error || chans.error || posts.error || metrics.error;
  if (err) throw err;

  const latest = latestByChannel((posts.data ?? []) as Post[]);
  const lastMetric = new Map<string, Metric>();
  for (const m of (metrics.data ?? []) as Metric[]) if (!lastMetric.has(m.app_id)) lastMetric.set(m.app_id, m);

  const list = (apps.data ?? []) as App[];
  const rows: BoardRow[] = list.map((a) => {
    const stack = ((res.data ?? []) as Resource[]).filter((r) => r.app_id === a.id).sort(byKind);
    const social = ((chans.data ?? []) as Channel[])
      .filter((c) => c.app_id === a.id)
      .map((c) => ({ platform: c.platform, cadence: c.cadence_days, lastPostedAt: latest.get(c.id)?.last.posted_at ?? null }));
    const m = lastMetric.get(a.id);
    return {
      app: a,
      stack: stack.map((s) => ({ kind: s.kind, provider: s.provider, project: s.project })),
      social,
      usersNew: m?.users_new_24h ?? null,
      usersTotal: m?.users_total ?? null,
    };
  });
  return { apps: list, rows };
}

export async function loadApp(id: string) {
  const uid = await myId();
  const [app, res, chans, posts, metrics] = await Promise.all([
    supabase.from('apps').select('*').eq('id', id).eq('owner_id', uid).maybeSingle(),
    supabase.from('resources').select('*').eq('app_id', id),
    supabase.from('social_channels').select('*').eq('app_id', id).order('created_at'),
    supabase.from('social_posts').select('*').eq('app_id', id).order('posted_at', { ascending: false }).limit(500),
    supabase.from('metrics_daily').select('*').eq('app_id', id).order('day', { ascending: false }).limit(30),
  ]);
  const err = app.error || res.error || chans.error || posts.error || metrics.error;
  if (err) throw err;
  const postList = (posts.data ?? []) as Post[];
  const latest = latestByChannel(postList);
  const channels: ChannelItem[] = ((chans.data ?? []) as Channel[]).map((c) => {
    const l = latest.get(c.id);
    return {
      id: c.id,
      platform: c.platform,
      handle: c.handle,
      cadence: c.cadence_days,
      lastPostedAt: l?.last.posted_at ?? null,
      lastLinks: l?.last.links ?? [],
      postCount: l?.count ?? 0,
    };
  });
  return {
    app: app.data as App | null,
    resources: ((res.data ?? []) as Resource[]).sort(byKind),
    channels,
    rawChannels: (chans.data ?? []) as Channel[],
    posts: postList,
    metrics: (metrics.data ?? []) as Metric[],
  };
}
