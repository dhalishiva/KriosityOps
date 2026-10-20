import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppCard } from '@/components/AppCard';
import { Icon, LogoMark } from '@/components/Icon';
import { AppSheet, FreeLimitSheet } from '@/components/sheets';
import { Button, Chip, ErrorBox, Header, IconButton, Input, Lamp, OfflineBar, Skeleton, T } from '@/components/ui';
import { FREE_APP_LIMIT } from '@/lib/config';
import { RANK, freshness, friendlyError, worst } from '@/lib/catalog';
import { useBoard, useProfile } from '@/lib/queries';
import { font, radius, useTheme } from '@/lib/theme';
import type { BoardRow } from '@/lib/types';
import { useNow } from '@/lib/useNow';

type Filter = 'all' | 'live' | 'building' | 'post';
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'building', label: 'Building' },
  { id: 'post', label: 'Needs a post' },
];

export default function BoardScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const board = useBoard();
  const profile = useProfile();
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [limit, setLimit] = useState(false);
  const now = useNow();

  const rows = useMemo(() => board.data?.rows ?? [], [board.data]);
  const summary = useMemo(() => {
    const t = now;
    const due = (board.data?.channels ?? []).filter((ch) => {
      const s = freshness(ch.lastPostedAt, ch.cadence_days, t).state;
      return s === 'due' || s === 'late';
    }).length;
    return { apps: rows.length, locked: rows.filter((r) => r.app.in_use_by).length, due };
  }, [board.data, rows, now]);

  const shown = useMemo(() => {
    const t = now;
    const q = (search ?? '').trim().toLowerCase();
    const score = (r: BoardRow) => RANK[worst(r.channels, t)?.state ?? 'ok'];
    return rows
      .filter((r) => !q || r.app.name.toLowerCase().includes(q) || (r.app.url ?? '').toLowerCase().includes(q))
      .filter((r) => {
        if (filter === 'live') return r.app.status === 'live';
        if (filter === 'building') return r.app.status === 'building' || r.app.status === 'idea';
        if (filter === 'post') {
          const s = worst(r.channels, t)?.state;
          return s === 'due' || s === 'late';
        }
        return true;
      })
      .sort((a, b) => score(b) - score(a) || a.app.name.localeCompare(b.app.name));
  }, [rows, filter, search, now]);

  const isFree = profile.data?.plan !== 'pro' && !profile.data?.is_admin;
  const openAdd = () => (isFree && rows.length >= FREE_APP_LIMIT ? setLimit(true) : setAdding(true));
  const loading = board.isPending && !board.data;
  const offline = board.isError && !!board.data;

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <Header
        title="Board"
        right={
          <>
            {rows.length ? <IconButton icon={search === null ? 'search' : 'close'} label={search === null ? 'Search apps' : 'Close search'} onPress={() => setSearch(search === null ? '' : null)} /> : null}
            <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <LogoMark size={28} />
            </View>
          </>
        }
      />

      {loading ? (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Skeleton height={62} />
          <Skeleton height={118} />
          <Skeleton height={118} />
          <Skeleton height={118} />
        </View>
      ) : board.isError && !board.data ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorBox message={friendlyError(board.error)} onRetry={() => board.refetch()} />
        </View>
      ) : rows.length === 0 ? (
        <EmptyBoard onAdd={openAdd} isFree={isFree} />
      ) : (
        <FlatList
          data={shown}
          keyExtractor={(r) => r.app.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 110, gap: 10 }}
          refreshControl={<RefreshControl refreshing={board.isRefetching} onRefresh={() => void board.refetch()} colors={[c.cobalt]} progressBackgroundColor={c.surface} />}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <View style={{ gap: 10 }}>
              {offline ? <OfflineBar updatedAt={board.dataUpdatedAt} /> : null}
              {search !== null ? <Input value={search} onChangeText={setSearch} placeholder="Search by name or website" autoFocus autoCapitalize="none" /> : null}
              <Summary {...summary} />
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {FILTERS.map((f) => (
                  <Chip key={f.id} label={f.label} selected={filter === f.id} onPress={() => setFilter(f.id)} />
                ))}
              </View>
            </View>
          }
          renderItem={({ item }) => <AppCard row={item} now={now} onPress={() => router.push({ pathname: '/app/[id]', params: { id: item.app.id } })} />}
          ListEmptyComponent={
            <View style={{ paddingVertical: 32, alignItems: 'center', gap: 6 }}>
              <T v="bodyStrong">Nothing matches</T>
              <T v="small">{filter === 'post' ? 'Every channel is posted on time.' : 'Try another filter or search.'}</T>
            </View>
          }
        />
      )}

      {rows.length ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add an app"
          onPress={openAdd}
          android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
          style={{
            position: 'absolute',
            right: 16,
            bottom: 16,
            height: 56,
            paddingLeft: 16,
            paddingRight: 20,
            borderRadius: radius.fab,
            backgroundColor: c.cobalt,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            elevation: 6,
            overflow: 'hidden',
          }}
        >
          <Icon name="plus" color={c.onCobalt} size={20} />
          <T v="bodyStrong" color={c.onCobalt} style={{ fontFamily: font.bold }}>
            App
          </T>
        </Pressable>
      ) : null}

      <AppSheet
        visible={adding}
        onClose={() => setAdding(false)}
        onCreated={(id) => router.push({ pathname: '/app/[id]', params: { id } })}
        onFreeLimit={() => setLimit(true)}
      />
      <FreeLimitSheet visible={limit} onClose={() => setLimit(false)} />
    </View>
  );
}

function Summary({ apps, locked, due }: { apps: number; locked: number; due: number }) {
  const { c } = useTheme();
  const cell = (n: number, label: string, warn?: boolean, first?: boolean) => (
    <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderLeftWidth: first ? 0 : 1, borderLeftColor: c.line }}>
      <T v="num" color={warn && n ? c.late : c.ink}>
        {n}
      </T>
      <T v="caption">{label}</T>
    </View>
  );
  return (
    <View
      accessible
      accessibilityLabel={`${apps} apps, ${locked} being worked on, ${due} posts due`}
      style={{ flexDirection: 'row', backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card }}
    >
      {cell(apps, apps === 1 ? 'app' : 'apps', false, true)}
      {cell(locked, 'being worked on')}
      {cell(due, due === 1 ? 'post due' : 'posts due', true)}
    </View>
  );
}

function EmptyBoard({ onAdd, isFree }: { onAdd: () => void; isFree: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 14, paddingBottom: 60 }}>
      <View style={{ width: 150, padding: 12, borderRadius: 14, backgroundColor: c.surface, borderWidth: 1, borderStyle: 'dashed', borderColor: c.line2, gap: 8 }}>
        {[1, 0.7].map((w) => (
          <View key={w} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Lamp state="never" size={8} />
            <View style={{ flex: w, height: 8, borderRadius: 4, backgroundColor: c.sunk }} />
          </View>
        ))}
      </View>
      <T v="h2">Add your first app</T>
      <T v="small" style={{ textAlign: 'center' }}>
        Note where it’s hosted, which database it uses and where you post about it. No passwords or keys, only names and links.
      </T>
      <Button title="Add an app" icon="plus" onPress={onAdd} style={{ paddingHorizontal: 22 }} />
      {isFree ? <T v="caption">Free plan: {FREE_APP_LIMIT} apps</T> : null}
    </View>
  );
}
