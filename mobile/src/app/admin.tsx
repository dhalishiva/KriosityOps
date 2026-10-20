import { useRouter } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBox, Header, IconButton, ListBox, Row, SectionLabel, Skeleton, T } from '@/components/ui';
import { friendlyError } from '@/lib/catalog';
import { useAdmin } from '@/lib/queries';
import { font, radius, useTheme } from '@/lib/theme';

export default function Admin() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const q = useAdmin();
  const s = q.data?.stats;

  const tiles: [string, number | undefined][] = [
    ['users', s?.users_total],
    ['new today', s?.users_24h],
    ['new this week', s?.users_7d],
    ['on Pro', s?.pro_users],
    ['apps', s?.apps_total],
    ['posts this week', s?.posts_7d],
  ];

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <Header title="Admin" left={<IconButton icon="back" label="Back" onPress={() => router.back()} />} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 12 }}
        refreshControl={<RefreshControl refreshing={q.isRefetching} onRefresh={() => void q.refetch()} colors={[c.cobalt]} progressBackgroundColor={c.surface} />}
      >
        {q.isPending ? (
          <>
            <Skeleton height={150} />
            <Skeleton height={300} />
          </>
        ) : q.isError ? (
          <ErrorBox message={friendlyError(q.error)} onRetry={() => q.refetch()} />
        ) : (
          <>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {tiles.map(([label, n]) => (
                <View key={label} style={{ flexBasis: '31%', flexGrow: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 12 }}>
                  <T v="num">{n ?? '—'}</T>
                  <T v="caption">{label}</T>
                </View>
              ))}
            </View>
            {s?.messages ? <T v="small">{s.messages} contact message{s.messages === 1 ? '' : 's'} · read them on ops.kriosity.in/admin</T> : null}
            <SectionLabel>Newest users</SectionLabel>
            <ListBox>
              {q.data.users.map((u, i) => (
                <Row key={u.id} first={i === 0}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <T v="body" numberOfLines={1} selectable>
                      {u.email}
                    </T>
                    <T v="caption">{new Date(u.created_at).toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' })}</T>
                  </View>
                  <View style={{ paddingHorizontal: 8, height: 22, borderRadius: 11, justifyContent: 'center', backgroundColor: u.plan === 'pro' ? c.cobaltWash : c.sunk }}>
                    <T v="caption" color={u.plan === 'pro' ? c.cobaltInk : c.ink2} style={{ fontFamily: font.semibold }}>
                      {u.plan === 'pro' ? `Pro${u.plan_provider ? ` · ${u.plan_provider}` : ''}` : 'Free'}
                    </T>
                  </View>
                </Row>
              ))}
            </ListBox>
            <T v="caption">Read-only. Change plans and accounts on ops.kriosity.in/admin.</T>
          </>
        )}
      </ScrollView>
    </View>
  );
}
