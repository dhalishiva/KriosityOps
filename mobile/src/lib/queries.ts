import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { byKind } from './catalog';
import { supabase } from './supabase';
import type { App, AppStatus, BoardRow, Channel, ChannelState, Metric, Post, Profile, Resource } from './types';

async function myId() {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Not signed in');
  return id;
}

function latestByChannel(posts: Pick<Post, 'channel_id' | 'posted_at'>[]) {
  const m = new Map<string, string>();
  for (const p of posts) if (!m.has(p.channel_id)) m.set(p.channel_id, p.posted_at);
  return m;
}

export type Board = { rows: BoardRow[]; channels: ChannelState[] };

/** Everything the Board and Due screens need, in five parallel requests joined here. */
async function loadBoard(): Promise<Board> {
  const uid = await myId();
  const [apps, res, chans, posts, metrics] = await Promise.all([
    supabase.from('apps').select('*').eq('owner_id', uid).order('name'),
    supabase.from('resources').select('app_id,kind,provider,project').eq('owner_id', uid),
    supabase.from('social_channels').select('*').eq('owner_id', uid),
    supabase.from('social_posts').select('channel_id,posted_at').eq('owner_id', uid).order('posted_at', { ascending: false }).limit(3000),
    supabase.from('metrics_daily').select('app_id,day,users_total,users_new_24h').eq('owner_id', uid).order('day', { ascending: false }).limit(1000),
  ]);
  const err = apps.error || res.error || chans.error || posts.error || metrics.error;
  if (err) throw err;

  const latest = latestByChannel(posts.data ?? []);
  const lastMetric = new Map<string, Pick<Metric, 'users_total' | 'users_new_24h'>>();
  for (const m of metrics.data ?? []) if (!lastMetric.has(m.app_id)) lastMetric.set(m.app_id, m);
  const appList = (apps.data ?? []) as App[];
  const appById = new Map(appList.map((a) => [a.id, a]));

  const channels: ChannelState[] = ((chans.data ?? []) as Channel[])
    .filter((c) => appById.has(c.app_id))
    .map((c) => ({ ...c, lastPostedAt: latest.get(c.id) ?? null, appName: appById.get(c.app_id)!.name, appColor: appById.get(c.app_id)!.color }));

  const rows: BoardRow[] = appList.map((a) => {
    const m = lastMetric.get(a.id);
    return {
      app: a,
      stack: ((res.data ?? []) as Resource[]).filter((r) => r.app_id === a.id).sort(byKind),
      channels: channels.filter((c) => c.app_id === a.id),
      usersNew: m?.users_new_24h ?? null,
      usersTotal: m?.users_total ?? null,
    };
  });
  return { rows, channels };
}

export type AppData = {
  app: App | null;
  resources: Resource[];
  channels: ChannelState[];
  posts: Post[];
  metrics: Metric[];
};

async function loadApp(id: string): Promise<AppData> {
  const uid = await myId();
  const [app, res, chans, posts, metrics] = await Promise.all([
    supabase.from('apps').select('*').eq('id', id).eq('owner_id', uid).maybeSingle(),
    supabase.from('resources').select('*').eq('app_id', id).eq('owner_id', uid),
    supabase.from('social_channels').select('*').eq('app_id', id).eq('owner_id', uid).order('created_at'),
    supabase.from('social_posts').select('id,channel_id,app_id,posted_at,links,note').eq('app_id', id).eq('owner_id', uid).order('posted_at', { ascending: false }).limit(200),
    supabase.from('metrics_daily').select('app_id,day,users_total,users_new_24h,visitors_24h,pageviews_24h').eq('app_id', id).eq('owner_id', uid).order('day', { ascending: false }).limit(14),
  ]);
  const err = app.error || res.error || chans.error || posts.error || metrics.error;
  if (err) throw err;
  const a = app.data as App | null;
  const postList = (posts.data ?? []) as Post[];
  const latest = latestByChannel(postList);
  return {
    app: a,
    resources: ((res.data ?? []) as Resource[]).sort(byKind),
    channels: ((chans.data ?? []) as Channel[]).map((c) => ({ ...c, lastPostedAt: latest.get(c.id) ?? null, appName: a?.name ?? '', appColor: a?.color ?? '' })),
    posts: postList,
    metrics: ((metrics.data ?? []) as Metric[]).reverse(),
  };
}

async function loadProfile(): Promise<Profile | null> {
  const uid = await myId();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export type AdminStats = {
  users_total: number; users_24h: number; users_7d: number; pro_users: number; apps_total: number; posts_7d: number; messages: number;
};

export const useBoard = () => useQuery({ queryKey: ['board'], queryFn: loadBoard });
export const useApp = (id: string) => useQuery({ queryKey: ['app', id], queryFn: () => loadApp(id), enabled: !!id });
export const useProfile = () => useQuery({ queryKey: ['profile'], queryFn: loadProfile });

export const useAdmin = () =>
  useQuery({
    queryKey: ['admin'],
    queryFn: async () => {
      const [stats, users] = await Promise.all([
        supabase.rpc('admin_stats'),
        supabase.from('profiles').select('id,email,plan,plan_provider,created_at').order('created_at', { ascending: false }).limit(50),
      ]);
      if (stats.error) throw stats.error;
      if (users.error) throw users.error;
      return { stats: stats.data as AdminStats, users: (users.data ?? []) as Pick<Profile, 'id' | 'email' | 'plan' | 'plan_provider' | 'created_at'>[] };
    },
  });

/** Wraps a write so every screen that shows the result refreshes afterwards. */
function useWrite<V, R = unknown>(fn: (v: V) => Promise<R>, appId?: (v: V) => string | undefined) {
  const qc = useQueryClient();
  return useMutation<R, Error, V>({
    mutationFn: fn,
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: ['board'] });
      const id = appId?.(v);
      if (id) qc.invalidateQueries({ queryKey: ['app', id] });
    },
  });
}

const check = <T extends { error: unknown }>(r: T) => {
  if (r.error) throw r.error;
  return r;
};

export type AppInput = { name: string; url: string | null; status: AppStatus; color: string; description?: string | null };

export function useAppWrites() {
  const qc = useQueryClient();
  const create = useWrite(async (v: AppInput) => check(await supabase.from('apps').insert(v).select('id').single()).data as { id: string });
  const update = useWrite(
    async (v: { id: string; patch: Partial<AppInput> & { in_use_by?: string | null; in_use_since?: string | null } }) =>
      check(await supabase.from('apps').update(v.patch).eq('id', v.id)),
    (v) => v.id,
  );
  const remove = useWrite(async (v: { id: string }) => {
    check(await supabase.from('apps').delete().eq('id', v.id));
    qc.removeQueries({ queryKey: ['app', v.id] });
  });

  /** Claim/release is optimistic: the strip flips at once and rolls back on error. */
  const setInUse = useMutation({
    mutationFn: async (v: { id: string; who: string | null }) =>
      check(await supabase.from('apps').update({ in_use_by: v.who, in_use_since: v.who ? new Date().toISOString() : null }).eq('id', v.id)),
    onMutate: async (v) => {
      await qc.cancelQueries({ queryKey: ['app', v.id] });
      const prev = qc.getQueryData<AppData>(['app', v.id]);
      if (prev?.app)
        qc.setQueryData<AppData>(['app', v.id], { ...prev, app: { ...prev.app, in_use_by: v.who, in_use_since: v.who ? new Date().toISOString() : null } });
      return { prev };
    },
    onError: (_e, v, ctx) => ctx?.prev && qc.setQueryData(['app', v.id], ctx.prev),
    onSettled: (_d, _e, v) => {
      qc.invalidateQueries({ queryKey: ['board'] });
      qc.invalidateQueries({ queryKey: ['app', v.id] });
    },
  });
  return { create, update, remove, setInUse };
}

export type ResourceInput = { app_id: string; kind: string; provider: string; account: string | null; project: string | null; link: string | null; notes: string | null };

export function useResourceWrites() {
  const save = useWrite(
    async (v: { id?: string; data: ResourceInput }) =>
      v.id ? check(await supabase.from('resources').update(v.data).eq('id', v.id)) : check(await supabase.from('resources').insert(v.data)),
    (v) => v.data.app_id,
  );
  const remove = useWrite(async (v: { id: string; app_id: string }) => check(await supabase.from('resources').delete().eq('id', v.id)), (v) => v.app_id);
  return { save, remove };
}

export function useSocialWrites() {
  const saveChannel = useWrite(
    async (v: { id?: string; data: { app_id: string; platform: string; handle: string | null; cadence_days: number } }) =>
      v.id ? check(await supabase.from('social_channels').update(v.data).eq('id', v.id)) : check(await supabase.from('social_channels').insert(v.data)),
    (v) => v.data.app_id,
  );
  const removeChannel = useWrite(async (v: { id: string; app_id: string }) => check(await supabase.from('social_channels').delete().eq('id', v.id)), (v) => v.app_id);
  const logPost = useWrite(
    async (v: { channel_id: string; app_id: string; posted_at: string; links: string[]; note: string | null }) =>
      check(await supabase.from('social_posts').insert(v).select('id').single()).data as { id: string },
    (v) => v.app_id,
  );
  const removePost = useWrite(async (v: { id: string; app_id: string }) => check(await supabase.from('social_posts').delete().eq('id', v.id)), (v) => v.app_id);
  return { saveChannel, removeChannel, logPost, removePost };
}
