import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { useNow } from '../lib/useNow';
import { Pressable, View } from 'react-native';
import {
  APP_COLORS,
  APP_STATUSES,
  KINDS,
  PLATFORMS,
  PROVIDERS,
  WORKERS,
  firstUrl,
  friendlyError,
  isFreeLimit,
  looksSecret,
  platformLabel,
  statusLabel,
  suggestLink,
  type Kind,
} from '../lib/catalog';
import { useAppWrites, useResourceWrites, useSocialWrites, type AppInput } from '../lib/queries';
import { font, radius, useTheme } from '../lib/theme';
import type { App, AppStatus, ChannelState, Resource } from '../lib/types';
import { Icon } from './Icon';
import { Sheet } from './Sheet';
import { Button, Chip, Field, Input, T, useSnack } from './ui';

const clean = (s: string) => (s.trim() ? s.trim() : null);
const tick = () => Haptics.selectionAsync().catch(() => {});

/* ───────────── add / edit app ───────────── */

export function AppSheet({
  visible,
  onClose,
  app,
  onCreated,
  onFreeLimit,
}: {
  visible: boolean;
  onClose: () => void;
  app?: App | null;
  onCreated?: (id: string) => void;
  onFreeLimit?: () => void;
}) {
  const { c } = useTheme();
  const { create, update } = useAppWrites();
  const snack = useSnack();
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<AppStatus>('live');
  const [color, setColor] = useState(APP_COLORS[0]);
  const [err, setErr] = useState<string | null>(null);

  // Reset the form each time the sheet opens.
  const [opened, setOpened] = useState(false);
  if (visible !== opened) {
    setOpened(visible);
    if (visible) {
      setName(app?.name ?? '');
      setUrl(app?.url ?? '');
      setStatus(app?.status ?? 'live');
      setColor(app?.color ?? APP_COLORS[0]);
      setErr(null);
    }
  }

  const busy = create.isPending || update.isPending;

  async function save() {
    if (!name.trim()) return setErr('Give the app a name.');
    let u = url.trim();
    if (u && !/^https?:\/\//i.test(u)) u = 'https://' + u;
    const data: AppInput = { name: name.trim(), url: u || null, status, color };
    try {
      if (app) {
        await update.mutateAsync({ id: app.id, patch: data });
        snack('Saved');
        onClose();
      } else {
        const r = await create.mutateAsync(data);
        tick();
        onClose();
        onCreated?.(r.id);
      }
    } catch (e) {
      if (isFreeLimit(e)) {
        onClose();
        onFreeLimit?.();
      } else setErr(friendlyError(e));
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={app ? `Edit ${app.name}` : 'Add an app'} footer={<Button title={app ? 'Save' : 'Add app'} loading={busy} onPress={save} />}>
      <Field label="Name" error={err}>
        <Input value={name} onChangeText={setName} placeholder="SlotRecover" autoFocus={!app} maxLength={80} returnKeyType="next" />
      </Field>
      <Field label="Website (optional)">
        <Input value={url} onChangeText={setUrl} placeholder="slotrecover.pro" autoCapitalize="none" keyboardType="url" autoCorrect={false} />
      </Field>
      <Field label="Stage">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {APP_STATUSES.map((s) => (
            <Chip key={s} label={statusLabel(s)} selected={status === s} onPress={() => setStatus(s)} />
          ))}
        </View>
      </Field>
      <Field label="Colour">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {APP_COLORS.map((col) => (
            <Pressable
              key={col}
              accessibilityRole="radio"
              accessibilityState={{ selected: col === color }}
              accessibilityLabel={`Colour ${col}`}
              onPress={() => setColor(col)}
              style={{ width: 40, height: 40, borderRadius: 11, backgroundColor: col, alignItems: 'center', justifyContent: 'center', borderWidth: col === color ? 3 : 0, borderColor: c.cobaltWash }}
            >
              {col === color ? <Icon name="check" color="#FFFFFF" size={18} /> : null}
            </Pressable>
          ))}
        </View>
      </Field>
    </Sheet>
  );
}

/* ───────────── who's working on it ───────────── */

export function InUseSheet({ visible, onClose, app }: { visible: boolean; onClose: () => void; app: App }) {
  const { lastWorker, setLastWorker } = useTheme();
  const { setInUse } = useAppWrites();
  const snack = useSnack();
  const [who, setWho] = useState(lastWorker);
  const [other, setOther] = useState('');
  const custom = !WORKERS.includes(who);

  const [opened, setOpened] = useState(false);
  if (visible !== opened) {
    setOpened(visible);
    if (visible) {
      setWho(lastWorker);
      setOther(WORKERS.includes(lastWorker) ? '' : lastWorker);
    }
  }

  function claim() {
    const name = custom ? other.trim() : who;
    if (!name) return;
    setLastWorker(name);
    tick();
    onClose();
    setInUse.mutate({ id: app.id, who: name }, { onError: (e) => snack(friendlyError(e)) });
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={`Who's working on ${app.name}?`}
      footer={<Button title="Mark as in use" icon="lock" onPress={claim} disabled={custom && !other.trim()} />}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {WORKERS.map((w) => (
          <Chip key={w} label={w} selected={who === w} onPress={() => setWho(w)} />
        ))}
        <Chip label="Someone else…" selected={custom} onPress={() => setWho(other.trim() || ' ')} />
      </View>
      {custom ? (
        <Field label="Name">
          <Input value={other} onChangeText={(t) => { setOther(t); setWho(t || ' '); }} placeholder="A teammate" autoFocus maxLength={40} />
        </Field>
      ) : null}
      <T v="small">It shows on the board until someone marks it free, so two people or two AIs don’t edit the same app at once.</T>
    </Sheet>
  );
}

/* ───────────── stack item ───────────── */

export function ResourceSheet({ visible, onClose, appId, resource }: { visible: boolean; onClose: () => void; appId: string; resource?: Resource | null }) {
  const { c } = useTheme();
  const { save } = useResourceWrites();
  const snack = useSnack();
  const [kind, setKind] = useState<Kind>('database');
  const [provider, setProvider] = useState('');
  const [customProvider, setCustomProvider] = useState(false);
  const [account, setAccount] = useState('');
  const [project, setProject] = useState('');
  const [linkEdit, setLinkEdit] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [warned, setWarned] = useState(false);
  const [showAllKinds, setShowAllKinds] = useState(false);

  // Reset the form each time the sheet opens.
  const [opened, setOpened] = useState(false);
  if (visible !== opened) {
    setOpened(visible);
    if (visible) {
      const k = (resource?.kind as Kind) ?? 'database';
      setKind(k);
      setProvider(resource?.provider ?? PROVIDERS[k][0] ?? '');
      setCustomProvider(!!resource && !PROVIDERS[k].includes(resource.provider));
      setAccount(resource?.account ?? '');
      setProject(resource?.project ?? '');
      setLinkEdit(resource?.link ?? null);
      setNotes(resource?.notes ?? '');
      setErr(null);
      setWarned(false);
      setShowAllKinds(!!resource && KINDS.findIndex((x) => x.id === k) > 5);
    }
  }

  const auto = suggestLink(provider, project);
  const link = linkEdit ?? auto;

  const secret = [account, project, link, notes].some(looksSecret);
  const hint = KINDS.find((k) => k.id === kind)?.projectHint ?? '';
  const kinds = showAllKinds ? KINDS : KINDS.slice(0, 6);

  async function submit() {
    if (!provider.trim()) return setErr('Pick or type a provider.');
    if (secret && !warned) {
      setWarned(true);
      return;
    }
    try {
      await save.mutateAsync({
        id: resource?.id,
        data: { app_id: appId, kind, provider: provider.trim(), account: clean(account), project: clean(project), link: clean(link), notes: clean(notes) },
      });
      tick();
      snack(resource ? 'Saved' : `Added ${provider.trim()}`);
      onClose();
    } catch (e) {
      setErr(friendlyError(e));
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={resource ? `Edit ${resource.provider}` : 'Add to stack'}
      footer={
        <>
          {secret ? (
            <View style={{ backgroundColor: c.dueWash, borderRadius: 10, padding: 10 }}>
              <T v="small" color={c.ink}>
                This looks like a secret key. KriosityOps stores names and links only.{warned ? ' Tap Save again to keep it anyway.' : ''}
              </T>
            </View>
          ) : null}
          <Button title="Save" loading={save.isPending} onPress={submit} />
        </>
      }
    >
      <Field label="What is it?">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {kinds.map((k) => (
            <Chip
              key={k.id}
              label={k.label}
              selected={kind === k.id}
              onPress={() => {
                setKind(k.id);
                if (!customProvider) setProvider(PROVIDERS[k.id][0] ?? '');
                if (k.id === 'other') setCustomProvider(true);
              }}
            />
          ))}
          {!showAllKinds ? <Chip label="More…" onPress={() => setShowAllKinds(true)} /> : null}
        </View>
      </Field>
      <Field label="Provider" error={err}>
        {!customProvider && PROVIDERS[kind].length ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {PROVIDERS[kind].map((p) => (
              <Chip key={p} label={p} selected={provider === p} onPress={() => setProvider(p)} />
            ))}
            <Chip label="Other…" onPress={() => { setCustomProvider(true); setProvider(''); }} />
          </View>
        ) : (
          <Input value={provider} onChangeText={setProvider} placeholder="Provider name" autoFocus={!resource} maxLength={60} />
        )}
      </Field>
      <Field label="Account">
        <Input value={account} onChangeText={setAccount} placeholder="Login email or account name" autoCapitalize="none" autoCorrect={false} />
      </Field>
      <Field label={hint} hint={auto && link === auto ? 'Console link filled in for you' : undefined} hintGood>
        <Input value={project} onChangeText={setProject} mono autoCapitalize="none" autoCorrect={false} placeholder={hint} />
      </Field>
      <Field label="Console link">
        <Input
          value={link}
          onChangeText={setLinkEdit}
          mono
          placeholder="https://"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </Field>
      <Field label="Notes (optional)">
        <Input value={notes} onChangeText={setNotes} placeholder="Region, plan, anything to remember" multiline style={{ minHeight: 72, paddingTop: 12, textAlignVertical: 'top' }} />
      </Field>
    </Sheet>
  );
}

/* ───────────── channel ───────────── */

export function ChannelSheet({ visible, onClose, appId, channel }: { visible: boolean; onClose: () => void; appId: string; channel?: ChannelState | null }) {
  const { c } = useTheme();
  const { saveChannel } = useSocialWrites();
  const snack = useSnack();
  const [platform, setPlatform] = useState('x');
  const [handle, setHandle] = useState('');
  const [cadence, setCadence] = useState(3);
  const [err, setErr] = useState<string | null>(null);

  // Reset the form each time the sheet opens.
  const [opened, setOpened] = useState(false);
  if (visible !== opened) {
    setOpened(visible);
    if (visible) {
      setPlatform(channel?.platform ?? 'x');
      setHandle(channel?.handle ?? '');
      setCadence(channel?.cadence_days ?? 3);
      setErr(null);
    }
  }

  const hint = PLATFORMS.find((p) => p.id === platform)?.handleHint ?? '';

  async function submit() {
    try {
      await saveChannel.mutateAsync({ id: channel?.id, data: { app_id: appId, platform, handle: clean(handle), cadence_days: cadence } });
      tick();
      snack(channel ? 'Saved' : `Added ${platformLabel(platform)}`);
      onClose();
    } catch (e) {
      setErr(friendlyError(e));
    }
  }

  const step = (d: number) => setCadence((v) => Math.min(90, Math.max(1, v + d)));

  return (
    <Sheet visible={visible} onClose={onClose} title={channel ? `Edit ${platformLabel(channel.platform)}` : 'Add a channel'} footer={<Button title="Save" loading={saveChannel.isPending} onPress={submit} />}>
      <Field label="Platform" error={err}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {PLATFORMS.map((p) => (
            <Chip key={p.id} label={p.label} selected={platform === p.id} onPress={() => setPlatform(p.id)} />
          ))}
        </View>
      </Field>
      <Field label="Handle (optional)">
        <Input value={handle} onChangeText={setHandle} placeholder={hint} autoCapitalize="none" autoCorrect={false} maxLength={80} />
      </Field>
      <Field label="Post every" hint={`The lamp turns amber after ${cadence} day${cadence === 1 ? '' : 's'} and red after ${cadence * 2}.`}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Button title="−" kind="ghost" onPress={() => step(-1)} style={{ width: 52 }} />
          <View style={{ minWidth: 92, alignItems: 'center', paddingVertical: 8, borderRadius: radius.control, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line }}>
            <T v="num">{cadence}</T>
            <T v="caption">{cadence === 1 ? 'day' : 'days'}</T>
          </View>
          <Button title="+" kind="ghost" onPress={() => step(1)} style={{ width: 52 }} />
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', flex: 1 }}>
            {[1, 3, 7, 30].map((n) => (
              <Chip key={n} label={`${n}d`} selected={cadence === n} onPress={() => setCadence(n)} />
            ))}
          </View>
        </View>
      </Field>
    </Sheet>
  );
}

/* ───────────── log a post ───────────── */

export function LogPostSheet({
  visible,
  onClose,
  channel,
  initialLink,
  onLogged,
}: {
  visible: boolean;
  onClose: () => void;
  channel: ChannelState | null;
  initialLink?: string | null;
  onLogged?: () => void;
}) {
  const { logPost, removePost } = useSocialWrites();
  const snack = useSnack();
  // null means "now": the time is taken when the post is saved.
  const [when, setWhen] = useState<Date | null>(null);
  const now = useNow(30_000);
  const [links, setLinks] = useState<string[]>(['']);
  const [note, setNote] = useState('');
  const [err, setErr] = useState<string | null>(null);

  // Reset the form each time the sheet opens.
  const [opened, setOpened] = useState(false);
  if (visible !== opened) {
    setOpened(visible);
    if (visible) {
      setWhen(null);
      setLinks([initialLink ?? '']);
      setNote('');
      setErr(null);
    }
  }

  const whenText = useMemo(() => {
    const d = when ?? new Date(now);
    const today = new Date(now);
    const y = new Date(now - 86400000);
    const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
    const day = same(d, today) ? 'Today' : same(d, y) ? 'Yesterday' : d.toLocaleDateString([], { day: 'numeric', month: 'short' });
    return `${day}, ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  }, [when, now]);

  function pickWhen() {
    DateTimePickerAndroid.open({
      value: when ?? new Date(),
      mode: 'date',
      maximumDate: new Date(),
      onChange: (e, date) => {
        if (e.type !== 'set' || !date) return;
        DateTimePickerAndroid.open({
          value: date,
          mode: 'time',
          onChange: (e2, t) => {
            if (e2.type !== 'set' || !t) return;
            const out = new Date(date);
            out.setHours(t.getHours(), t.getMinutes(), 0, 0);
            setWhen(out > new Date() ? new Date() : out);
          },
        });
      },
    });
  }

  if (!channel) return null;

  async function submit() {
    if (!channel) return;
    const list = links.map((l) => firstUrl(l) ?? l.trim()).filter(Boolean);
    try {
      const r = await logPost.mutateAsync({ channel_id: channel.id, app_id: channel.app_id, posted_at: (when ?? new Date()).toISOString(), links: list, note: clean(note) });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
      onLogged?.();
      snack(`Logged ${platformLabel(channel.platform)} for ${channel.appName}`, {
        label: 'Undo',
        run: () => removePost.mutate({ id: r.id, app_id: channel.app_id }),
      });
    } catch (e) {
      setErr(friendlyError(e));
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={`Log a post on ${platformLabel(channel.platform)}`}
      subtitle={[channel.appName, channel.handle].filter(Boolean).join(' · ')}
      footer={<Button title="Log post" loading={logPost.isPending} onPress={submit} />}
    >
      <Field label="When" error={err}>
        <Pressable accessibilityRole="button" onPress={pickWhen}>
          <View pointerEvents="none">
            <Input value={whenText} editable={false} />
          </View>
        </Pressable>
      </Field>
      <Field label={links.length > 1 ? 'Links to the post' : 'Link to the post'}>
        <View style={{ gap: 8 }}>
          {links.map((l, i) => (
            <Input
              key={i}
              value={l}
              onChangeText={(t) => setLinks((arr) => arr.map((x, j) => (j === i ? t : x)))}
              placeholder="https://"
              mono
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          ))}
        </View>
      </Field>
      {links.length < 5 ? (
        <Pressable accessibilityRole="button" onPress={() => setLinks((a) => [...a, ''])} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 32 }}>
          <AddLinkLabel />
        </Pressable>
      ) : null}
      <Field label="Note (optional)">
        <Input value={note} onChangeText={setNote} placeholder="What was it about?" maxLength={280} />
      </Field>
    </Sheet>
  );
}

function AddLinkLabel() {
  const { c } = useTheme();
  return (
    <>
      <Icon name="plus" size={15} color={c.cobaltInk} />
      <T v="small" color={c.cobaltInk} style={{ fontFamily: font.semibold }}>
        Another link
      </T>
    </>
  );
}

/* ───────────── free limit ───────────── */

export function FreeLimitSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  return (
    <Sheet visible={visible} onClose={onClose} title="You're using both free apps" footer={<Button title="Got it" onPress={onClose} />}>
      <View style={{ backgroundColor: c.dueWash, borderRadius: radius.card, padding: 14, gap: 6 }}>
        <T v="body">The free plan includes 2 apps. Adding more needs a Pro account.</T>
        <T v="small">Your 2 apps stay as they are.</T>
      </View>
    </Sheet>
  );
}
