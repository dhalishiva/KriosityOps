import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, kindIcon } from '@/components/Icon';
import { Confirm, Sheet } from '@/components/Sheet';
import { AppSheet, ChannelSheet, InUseSheet, LogPostSheet, ResourceSheet } from '@/components/sheets';
import { Sparkline } from '@/components/Sparkline';
import { Button, ErrorBox, IconButton, Input, KindBadge, Lamp, lampWord, ListBox, OfflineBar, Row, SectionLabel, Skeleton, Swatch, T, useSnack } from '@/components/ui';
import { ago, freshness, friendlyError, kindLabel, platformLabel, sinceText, statusLabel, stripUrl } from '@/lib/catalog';
import { useApp, useAppWrites, useResourceWrites, useSocialWrites, type AppData } from '@/lib/queries';
import { font, radius, useTheme } from '@/lib/theme';
import type { ChannelState, Post, Resource } from '@/lib/types';
import { useNow } from '@/lib/useNow';

type Tab = 'stack' | 'social' | 'numbers';
const TABS: { id: Tab; label: string }[] = [
  { id: 'stack', label: 'Stack' },
  { id: 'social', label: 'Social' },
  { id: 'numbers', label: 'Numbers' },
];

const openUrl = (u: string) => {
  const url = /^https?:\/\//i.test(u) ? u : `https://${u}`;
  WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url).catch(() => {}));
};

export default function AppDetail() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id = '', tab: initialTab = 'stack' } = useLocalSearchParams<{ id?: string; tab?: Tab }>();
  const q = useApp(id);
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === initialTab) ? initialTab : 'stack');
  const [sheet, setSheet] = useState<'menu' | 'edit' | 'delete' | 'inuse' | null>(null);

  const d = q.data;
  const app = d?.app;

  if (q.isPending && !d) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top + 60, paddingHorizontal: 16, gap: 12 }}>
        <Skeleton height={48} />
        <Skeleton height={56} />
        <Skeleton height={240} />
      </View>
    );
  }

  if (!app) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top + 8, paddingHorizontal: 16, gap: 12 }}>
        <IconButton icon="back" label="Back" onPress={() => router.back()} />
        {q.isError ? <ErrorBox message={friendlyError(q.error)} onRetry={() => q.refetch()} /> : <T v="body">This app was deleted or isn’t on your board.</T>}
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center' }}>
        <IconButton icon="back" label="Back" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
        <View style={{ flex: 1 }} />
        {app.url ? <IconButton icon="open" label="Open website" onPress={() => openUrl(app.url!)} /> : null}
        <IconButton icon="more" label="More" onPress={() => setSheet('menu')} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 40, gap: 12 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} colors={[c.cobalt]} progressBackgroundColor={c.surface} />}
        keyboardShouldPersistTaps="handled"
      >
        {q.isError ? <OfflineBar updatedAt={q.dataUpdatedAt} /> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Swatch color={app.color} name={app.name} size={44} />
          <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
            <T v="title" numberOfLines={1}>
              {app.name}
            </T>
            {app.url ? (
              <T v="monoSmall" numberOfLines={1}>
                {stripUrl(app.url)}
              </T>
            ) : null}
          </View>
        </View>
        <StatusPill status={app.status} />

        <InUseStrip app={app} onClaim={() => setSheet('inuse')} />

        <View accessibilityRole="tablist" style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c.line }}>
          {TABS.map((t) => {
            const on = tab === t.id;
            const count = t.id === 'stack' ? d.resources.length : t.id === 'social' ? d.channels.length : null;
            return (
              <Pressable
                key={t.id}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(t.id)}
                style={{ flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderBottomWidth: 2, borderBottomColor: on ? c.cobalt : 'transparent', marginBottom: -1 }}
              >
                <T v="body" color={on ? c.ink : c.ink3} style={{ fontFamily: on ? font.bold : font.medium }}>
                  {t.label}
                  {count ? <T v="caption" color={on ? c.ink2 : c.ink3}>{`  ${count}`}</T> : null}
                </T>
              </Pressable>
            );
          })}
        </View>

        {tab === 'stack' ? <StackTab data={d} /> : tab === 'social' ? <SocialTab data={d} /> : <NumbersTab data={d} />}
      </ScrollView>

      <Sheet visible={sheet === 'menu'} onClose={() => setSheet(null)} title={app.name}>
        <ListBox>
          <Row first onPress={() => setSheet('edit')}>
            <Icon name="edit" color={c.ink2} size={19} />
            <T v="body" style={{ flex: 1 }}>
              Edit name, website and stage
            </T>
          </Row>
          {app.url ? (
            <Row
              onPress={() => {
                setSheet(null);
                openUrl(app.url!);
              }}
            >
              <Icon name="open" color={c.ink2} size={19} />
              <T v="body" style={{ flex: 1 }}>
                Open website
              </T>
            </Row>
          ) : null}
          <Row onPress={() => setSheet('delete')}>
            <Icon name="trash" color={c.late} size={19} />
            <T v="body" color={c.late} style={{ flex: 1 }}>
              Delete app
            </T>
          </Row>
        </ListBox>
      </Sheet>
      <AppSheet visible={sheet === 'edit'} onClose={() => setSheet(null)} app={app} />
      <InUseSheet visible={sheet === 'inuse'} onClose={() => setSheet(null)} app={app} />
      <DeleteApp visible={sheet === 'delete'} onClose={() => setSheet(null)} name={app.name} id={app.id} onDeleted={() => router.replace('/')} />
    </View>
  );
}

function StatusPill({ status }: { status: string }) {
  const { c } = useTheme();
  const [fg, bg] =
    status === 'live' ? [c.ok, c.okWash] : status === 'building' || status === 'idea' ? [c.cobaltInk, c.cobaltWash] : status === 'paused' ? [c.due, c.dueWash] : [c.ink3, c.sunk];
  return (
    <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9, height: 24, borderRadius: 12, backgroundColor: bg }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />
      <T v="caption" color={fg} style={{ fontFamily: font.semibold }}>
        {statusLabel(status)}
      </T>
    </View>
  );
}

function InUseStrip({ app, onClaim }: { app: NonNullable<AppData['app']>; onClaim: () => void }) {
  const { c } = useTheme();
  const { setInUse } = useAppWrites();
  const snack = useSnack();
  if (!app.in_use_by) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nobody is working on it. Mark as in use."
        onPress={onClaim}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 12, minHeight: 52 }}
      >
        <Icon name="unlock" size={17} color={c.ink2} />
        <T v="small" style={{ flex: 1 }}>
          Nobody is working on it
        </T>
        <T v="small" color={c.cobaltInk} style={{ fontFamily: font.semibold }}>
          Claim
        </T>
      </Pressable>
    );
  }
  const at = app.in_use_since ? new Date(app.in_use_since) : null;
  return (
    <View style={{ backgroundColor: c.cobaltWash, borderRadius: radius.card, padding: 12, gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
        <Icon name="lock" size={17} color={c.cobaltInk} />
        <T v="small" color={c.cobaltInk} style={{ flex: 1 }}>
          <T v="small" color={c.ink} style={{ fontFamily: font.bold }}>
            {app.in_use_by}
          </T>{' '}
          is working on {app.name}
          {at ? ` since ${at.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} (${sinceText(app.in_use_since)})` : ''}
        </T>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button
          title="Mark as free"
          icon="unlock"
          kind="ghost"
          small
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            setInUse.mutate({ id: app.id, who: null }, { onError: (e) => snack(friendlyError(e)) });
          }}
        />
        <Button title="Change" kind="quiet" small onPress={onClaim} />
      </View>
    </View>
  );
}

/* ───────────── Stack ───────────── */

function StackTab({ data }: { data: AppData }) {
  const { c } = useTheme();
  const snack = useSnack();
  const { remove } = useResourceWrites();
  const [editing, setEditing] = useState<Resource | null>(null);
  const [adding, setAdding] = useState(false);
  const [menu, setMenu] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState<Resource | null>(null);
  const appId = data.app!.id;

  async function copy(r: Resource) {
    const v = r.project || r.account || r.link;
    if (!v) return;
    await Clipboard.setStringAsync(v);
    Haptics.selectionAsync().catch(() => {});
    snack(`Copied ${v.length > 28 ? v.slice(0, 26) + '…' : v}`);
  }

  return (
    <View style={{ gap: 12 }}>
      {data.resources.length ? (
        <ListBox>
          {data.resources.map((r, i) => (
            <Row key={r.id} first={i === 0} onPress={() => copy(r)} onLongPress={() => setMenu(r)} label={`${kindLabel(r.kind)}, ${r.provider}, ${r.project ?? ''}. Tap to copy, hold for options.`}>
              <KindBadge icon={kindIcon(r.kind)} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T v="bodyStrong" numberOfLines={1}>
                  {r.provider}
                  <T v="caption">{`  ${kindLabel(r.kind)}`}</T>
                </T>
                <T v="monoSmall" numberOfLines={1}>
                  {[r.project, r.account].filter(Boolean).join(' · ') || 'No details yet'}
                </T>
              </View>
              {r.link ? <IconButton icon="open" label={`Open ${r.provider} console`} onPress={() => openUrl(r.link!)} size={18} /> : <IconButton icon="more" label="Options" onPress={() => setMenu(r)} size={18} />}
            </Row>
          ))}
        </ListBox>
      ) : (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line2, borderRadius: radius.card, padding: 16, gap: 4 }}>
          <T v="bodyStrong">Where does {data.app!.name} live?</T>
          <T v="small">Add its database, hosting, repo and domain. Names and links only, never keys.</T>
        </View>
      )}
      <Button title="Add to stack" icon="plus" kind="ghost" onPress={() => setAdding(true)} />
      {data.resources.length ? <T v="caption">Tap a row to copy its project or account. Hold it to edit.</T> : null}

      <ResourceSheet visible={adding || !!editing} onClose={() => { setAdding(false); setEditing(null); }} appId={appId} resource={editing} />
      <Sheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.provider ?? ''} subtitle={menu ? kindLabel(menu.kind) : undefined}>
        <ListBox>
          <Row first onPress={() => { const r = menu; setMenu(null); if (r) copy(r); }}>
            <Icon name="copy" color={c.ink2} size={19} />
            <T v="body" style={{ flex: 1 }}>Copy</T>
          </Row>
          <Row onPress={() => { setEditing(menu); setMenu(null); }}>
            <Icon name="edit" color={c.ink2} size={19} />
            <T v="body" style={{ flex: 1 }}>Edit</T>
          </Row>
          <Row onPress={() => { setDeleting(menu); setMenu(null); }}>
            <Icon name="trash" color={c.late} size={19} />
            <T v="body" color={c.late} style={{ flex: 1 }}>Remove from stack</T>
          </Row>
        </ListBox>
      </Sheet>
      <Confirm
        visible={!!deleting}
        title={`Remove ${deleting?.provider ?? ''}?`}
        body="This removes the entry from KriosityOps only. Nothing changes at the provider."
        confirmLabel="Remove"
        danger
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await remove.mutateAsync({ id: deleting.id, app_id: appId });
            snack(`Removed ${deleting.provider}`);
          } catch (e) {
            snack(friendlyError(e));
          }
          setDeleting(null);
        }}
      />
    </View>
  );
}

/* ───────────── Social ───────────── */

function SocialTab({ data }: { data: AppData }) {
  const { c } = useTheme();
  const snack = useSnack();
  const { removeChannel, removePost, logPost } = useSocialWrites();
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ChannelState | null>(null);
  const [logging, setLogging] = useState<ChannelState | null>(null);
  const [menu, setMenu] = useState<ChannelState | null>(null);
  const [deleting, setDeleting] = useState<ChannelState | null>(null);
  const appId = data.app!.id;
  const now = useNow();
  const byId = new Map(data.channels.map((ch) => [ch.id, ch]));

  function deletePost(p: Post) {
    removePost.mutate(
      { id: p.id, app_id: appId },
      {
        onSuccess: () =>
          snack('Post removed', {
            label: 'Undo',
            run: () => logPost.mutate({ channel_id: p.channel_id, app_id: p.app_id, posted_at: p.posted_at, links: p.links, note: p.note }),
          }),
        onError: (e) => snack(friendlyError(e)),
      },
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {data.channels.length ? (
        <ListBox>
          {data.channels.map((ch, i) => {
            const f = freshness(ch.lastPostedAt, ch.cadence_days, now);
            const title = [platformLabel(ch.platform), ch.handle].filter(Boolean).join(' · ');
            const sub = `Every ${ch.cadence_days} day${ch.cadence_days === 1 ? '' : 's'} · last ${ago(f.days)}`;
            return (
              <Row key={ch.id} first={i === 0} onPress={() => setMenu(ch)} onLongPress={() => setMenu(ch)} label={`${title}, ${lampWord[f.state]}. ${sub}`}>
                <Lamp state={f.state} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T v="bodyStrong" numberOfLines={1}>
                    {title}
                  </T>
                  <T v="caption" numberOfLines={1}>
                    {sub}
                  </T>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Log a post on ${platformLabel(ch.platform)}`}
                  onPress={() => setLogging(ch)}
                  hitSlop={6}
                  style={{ minHeight: 36, paddingHorizontal: 12, borderRadius: 9, backgroundColor: c.cobalt, justifyContent: 'center' }}
                >
                  <T v="small" color={c.onCobalt} style={{ fontFamily: font.bold }}>
                    Log
                  </T>
                </Pressable>
              </Row>
            );
          })}
        </ListBox>
      ) : (
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line2, borderRadius: radius.card, padding: 16, gap: 4 }}>
          <T v="bodyStrong">Where do you post about {data.app!.name}?</T>
          <T v="small">Add X, Reddit, LinkedIn or anywhere else with how often you want to post. The lamp tells you when it’s time.</T>
        </View>
      )}
      <Button title="Add a channel" icon="plus" kind="ghost" onPress={() => setAdding(true)} />

      {data.posts.length ? (
        <>
          <SectionLabel>Recent posts</SectionLabel>
          <ListBox>
            {data.posts.slice(0, 15).map((p, i) => {
              const ch = byId.get(p.channel_id);
              const link = p.links[0];
              return (
                <Row key={p.id} first={i === 0} onPress={link ? () => openUrl(link) : undefined} onLongPress={() => deletePost(p)} label={`${ch ? platformLabel(ch.platform) : 'Post'} on ${new Date(p.posted_at).toDateString()}. Hold to remove.`}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T v="bodyStrong">{ch ? platformLabel(ch.platform) : 'Removed channel'}</T>
                    <T v="caption" numberOfLines={1}>
                      {p.note || (link ? stripUrl(link) : 'No link')}
                    </T>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <T v="small">{new Date(p.posted_at).toLocaleDateString([], { day: 'numeric', month: 'short' })}</T>
                    <T v="caption">{p.links.length ? `${p.links.length} link${p.links.length === 1 ? '' : 's'}` : ''}</T>
                  </View>
                </Row>
              );
            })}
          </ListBox>
          <T v="caption">Hold a post to remove it.</T>
        </>
      ) : null}

      <ChannelSheet visible={adding || !!editing} onClose={() => { setAdding(false); setEditing(null); }} appId={appId} channel={editing} />
      <LogPostSheet visible={!!logging} channel={logging} onClose={() => setLogging(null)} />
      <Sheet visible={!!menu} onClose={() => setMenu(null)} title={menu ? platformLabel(menu.platform) : ''} subtitle={menu?.handle ?? undefined}>
        <ListBox>
          <Row first onPress={() => { setLogging(menu); setMenu(null); }}>
            <Icon name="plus" color={c.ink2} size={19} />
            <T v="body" style={{ flex: 1 }}>Log a post</T>
          </Row>
          <Row onPress={() => { setEditing(menu); setMenu(null); }}>
            <Icon name="edit" color={c.ink2} size={19} />
            <T v="body" style={{ flex: 1 }}>Edit handle and cadence</T>
          </Row>
          <Row onPress={() => { setDeleting(menu); setMenu(null); }}>
            <Icon name="trash" color={c.late} size={19} />
            <T v="body" color={c.late} style={{ flex: 1 }}>Remove channel</T>
          </Row>
        </ListBox>
      </Sheet>
      <Confirm
        visible={!!deleting}
        title={`Remove ${deleting ? platformLabel(deleting.platform) : ''}?`}
        body="This also removes every post logged on this channel."
        confirmLabel="Remove"
        danger
        loading={removeChannel.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={async () => {
          if (!deleting) return;
          try {
            await removeChannel.mutateAsync({ id: deleting.id, app_id: appId });
            snack('Channel removed');
          } catch (e) {
            snack(friendlyError(e));
          }
          setDeleting(null);
        }}
      />
    </View>
  );
}

/* ───────────── Numbers ───────────── */

function NumbersTab({ data }: { data: AppData }) {
  const { c } = useTheme();
  const m = data.metrics;
  const last = m[m.length - 1];
  if (!last) {
    return (
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 16, gap: 4 }}>
        <T v="bodyStrong">Numbers start tomorrow at 6 AM IST</T>
        <T v="small">The daily collector fills in users and visitors once {data.app!.name} is connected on ops.kriosity.in.</T>
      </View>
    );
  }
  const fmt = (n: number | null | undefined) => (n === null || n === undefined ? '—' : n.toLocaleString('en-IN'));
  const first = m[0];
  const range = `${new Date(first.day).toLocaleDateString([], { day: 'numeric', month: 'short' })} – ${new Date(last.day).toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Stat value={fmt(last.users_total)} label="total users" />
        <Stat value={last.users_new_24h ? `+${fmt(last.users_new_24h)}` : fmt(last.users_new_24h)} label="new, last 24 h" color={last.users_new_24h ? c.ok : undefined} />
      </View>
      <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 12, gap: 6 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <T v="bodyStrong">New users · {m.length} days</T>
          <T v="caption">{range}</T>
        </View>
        <Sparkline values={m.map((x) => x.users_new_24h)} />
      </View>
      <ListBox>
        <Row first>
          <T v="body" style={{ flex: 1 }}>Visitors, last 24 h</T>
          <T v="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>{fmt(last.visitors_24h)}</T>
        </Row>
        <Row>
          <T v="body" style={{ flex: 1 }}>Page views, last 24 h</T>
          <T v="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>{fmt(last.pageviews_24h)}</T>
        </Row>
      </ListBox>
      <T v="caption">Updated {new Date(last.day).toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })} at 6:00 AM IST</T>
    </View>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 12 }}>
      <T v="num" color={color}>
        {value}
      </T>
      <T v="caption">{label}</T>
    </View>
  );
}

/* ───────────── delete app ───────────── */

function DeleteApp({ visible, onClose, name, id, onDeleted }: { visible: boolean; onClose: () => void; name: string; id: string; onDeleted: () => void }) {
  const { remove } = useAppWrites();
  const snack = useSnack();
  const [typed, setTyped] = useState('');
  return (
    <Confirm
      visible={visible}
      title={`Delete ${name}?`}
      body="This deletes the app, its stack, channels, posts and numbers from KriosityOps. It can't be undone."
      confirmLabel="Delete"
      danger
      loading={remove.isPending}
      confirmDisabled={typed.trim() !== name}
      onClose={() => {
        setTyped('');
        onClose();
      }}
      onConfirm={async () => {
        try {
          await remove.mutateAsync({ id });
          onClose();
          snack(`Deleted ${name}`);
          onDeleted();
        } catch (e) {
          snack(friendlyError(e));
        }
      }}
    >
      <Input value={typed} onChangeText={setTyped} placeholder={`Type ${name} to confirm`} autoCapitalize="none" autoCorrect={false} />
    </Confirm>
  );
}
