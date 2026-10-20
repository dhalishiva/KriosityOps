import * as Application from 'expo-application';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { Confirm, Sheet } from '@/components/Sheet';
import { Button, Chip, Header, KindBadge, ListBox, Row, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { FREE_APP_LIMIT, SITE, waLink } from '@/lib/config';
import { askPermission } from '@/lib/notify';
import { useBoard, useProfile } from '@/lib/queries';
import { font, radius, useTheme, type ThemePref } from '@/lib/theme';

const HOURS = [7, 8, 9, 10, 12, 18, 20, 21];
const hourText = (h: number) => (h < 0 ? 'Off' : new Date(2000, 0, 1, h).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }));
const THEMES: { id: ThemePref; label: string }[] = [
  { id: 'system', label: 'Follow system' },
  { id: 'light', label: 'Light' },
  { id: 'dark', label: 'Dark' },
];

export default function AccountScreen() {
  const { c, themePref, setThemePref, reminderHour, setReminderHour } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, signOut } = useAuth();
  const profile = useProfile();
  const board = useBoard();
  const [sheet, setSheet] = useState<'reminder' | 'theme' | 'logout' | null>(null);
  const [permNote, setPermNote] = useState<string | null>(null);

  const p = profile.data;
  const apps = board.data?.rows.length ?? 0;
  const pro = p?.plan === 'pro';
  const unlimited = pro || !!p?.is_admin;
  const renew = p?.plan_renews_at ? new Date(p.plan_renews_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  async function pickHour(h: number) {
    setPermNote(null);
    if (h >= 0) {
      const ok = await askPermission();
      if (!ok) {
        setPermNote('Notifications are off for KriosityOps. Turn them on in Android Settings → Apps → KriosityOps → Notifications.');
        return;
      }
    }
    setReminderHour(h);
    setSheet(null);
  }

  const open = (url: string) => WebBrowser.openBrowserAsync(url).catch(() => Linking.openURL(url));

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <Header title="Account" />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100, gap: 12 }}>
        <View style={{ backgroundColor: c.ink, borderRadius: radius.card, padding: 14, gap: 8 }}>
          <T v="label" color={c.off}>
            Your plan
          </T>
          <T v="h2" color={c.paper}>
            {unlimited ? `${pro ? 'Pro' : 'Admin'} · ${apps} app${apps === 1 ? '' : 's'}` : `Free · ${apps} of ${FREE_APP_LIMIT} apps`}
          </T>
          {!unlimited ? (
            <View style={{ height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.18)', overflow: 'hidden' }}>
              <View style={{ height: 6, width: `${Math.min(100, (apps / FREE_APP_LIMIT) * 100)}%`, backgroundColor: apps >= FREE_APP_LIMIT ? c.due : c.ok }} />
            </View>
          ) : null}
          <T v="small" color={c.paper} style={{ opacity: 0.8 }}>
            {pro ? (renew ? `Unlimited apps · renews ${renew}` : 'Unlimited apps') : unlimited ? 'Unlimited apps on this account' : 'The free plan includes 2 apps.'}
          </T>
        </View>

        <ListBox>
          <Row first>
            <KindBadge icon="mail" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="bodyStrong">Email</T>
              <T v="caption" numberOfLines={1} selectable>
                {session?.user.email}
              </T>
            </View>
          </Row>
          <SettingRow icon="bell" title="Daily reminder" sub={reminderHour < 0 ? 'Off' : `${hourText(reminderHour)} · only when something is due`} onPress={() => setSheet('reminder')} />
          <SettingRow icon="moon" title="Theme" sub={THEMES.find((t) => t.id === themePref)?.label ?? ''} onPress={() => setSheet('theme')} />
          {p?.is_admin ? <SettingRow icon="shield" title="Admin" sub="Users and payments" onPress={() => router.push('/admin')} /> : null}
        </ListBox>

        <ListBox>
          <SettingRow first icon="chat" title="Help on WhatsApp" sub="Usually replies within a day" trailing="open" onPress={() => Linking.openURL(waLink()).catch(() => {})} />
          <SettingRow icon="link" title="Privacy policy" trailing="open" onPress={() => open(SITE.privacy)} />
          <SettingRow icon="link" title="Terms" trailing="open" onPress={() => open(SITE.terms)} />
        </ListBox>

        <Button title="Log out" kind="danger" onPress={() => setSheet('logout')} />
        <T v="caption" style={{ textAlign: 'center' }}>
          KriosityOps {Application.nativeApplicationVersion ?? '1.0.0'} · A Kriosity product
        </T>
      </ScrollView>

      <Sheet visible={sheet === 'reminder'} onClose={() => setSheet(null)} title="Daily reminder" subtitle="A note when a channel is due or late. Nothing on days when everything is on time.">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {HOURS.map((h) => (
            <Chip key={h} label={hourText(h)} selected={reminderHour === h} onPress={() => pickHour(h)} />
          ))}
          <Chip label="Off" selected={reminderHour < 0} onPress={() => pickHour(-1)} />
        </View>
        {permNote ? <T v="small" color={c.late}>{permNote}</T> : null}
      </Sheet>

      <Sheet visible={sheet === 'theme'} onClose={() => setSheet(null)} title="Theme">
        <ListBox>
          {THEMES.map((t, i) => (
            <Row
              key={t.id}
              first={i === 0}
              onPress={() => {
                setThemePref(t.id);
                setSheet(null);
              }}
            >
              <T v="body" style={{ flex: 1, fontFamily: themePref === t.id ? font.semibold : font.regular }}>
                {t.label}
              </T>
              {themePref === t.id ? <Icon name="check" color={c.cobalt} size={18} /> : null}
            </Row>
          ))}
        </ListBox>
      </Sheet>

      <Confirm
        visible={sheet === 'logout'}
        title="Log out?"
        body="Your board stays on your account. You can log back in any time."
        confirmLabel="Log out"
        danger
        onClose={() => setSheet(null)}
        onConfirm={() => {
          setSheet(null);
          signOut();
        }}
      />
    </View>
  );
}

function SettingRow({ icon, title, sub, onPress, first, trailing = 'chev' }: { icon: IconName; title: string; sub?: string; onPress: () => void; first?: boolean; trailing?: 'chev' | 'open' }) {
  const { c } = useTheme();
  return (
    <Row first={first} onPress={onPress} label={sub ? `${title}, ${sub}` : title}>
      <KindBadge icon={icon} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <T v="bodyStrong">{title}</T>
        {sub ? (
          <T v="caption" numberOfLines={2}>
            {sub}
          </T>
        ) : null}
      </View>
      <Icon name={trailing} color={c.ink3} size={17} />
    </Row>
  );
}
