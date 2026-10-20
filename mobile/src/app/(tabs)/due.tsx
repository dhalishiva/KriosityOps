import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogPostSheet } from '@/components/sheets';
import { ErrorBox, Header, Lamp, lampWord, OfflineBar, SectionLabel, Skeleton, T } from '@/components/ui';
import { freshness, friendlyError, nextDueAt, platformLabel } from '@/lib/catalog';
import { useBoard } from '@/lib/queries';
import { font, radius, useTheme } from '@/lib/theme';
import type { ChannelState } from '@/lib/types';
import { useNow } from '@/lib/useNow';

type Item = { ch: ChannelState; state: ReturnType<typeof freshness>['state']; days: number | null; next: Date | null };

export default function DueScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const board = useBoard();
  const [logging, setLogging] = useState<ChannelState | null>(null);
  const now = useNow();

  const sections = useMemo(() => {
    const weekOut = now + 7 * 86400000;
    const items: Item[] = (board.data?.channels ?? []).map((ch) => ({ ch, ...freshness(ch.lastPostedAt, ch.cadence_days, now), next: nextDueAt(ch.lastPostedAt, ch.cadence_days) }));
    const late = items.filter((i) => i.state === 'late').sort((a, b) => (b.days ?? 0) / b.ch.cadence_days - (a.days ?? 0) / a.ch.cadence_days);
    const due = items.filter((i) => i.state === 'due').sort((a, b) => (b.days ?? 0) - (a.days ?? 0));
    const never = items.filter((i) => i.state === 'never');
    const soon = items.filter((i) => i.state === 'ok' && i.next && i.next.getTime() <= weekOut).sort((a, b) => a.next!.getTime() - b.next!.getTime());
    return [
      { key: 'late', title: 'Late', color: c.late, data: late },
      { key: 'due', title: 'Due now', color: c.due, data: due },
      { key: 'never', title: 'Never posted', color: c.ink3, data: never },
      { key: 'soon', title: 'Coming up this week', color: c.ink3, data: soon },
    ].filter((s) => s.data.length);
  }, [board.data, c, now]);

  const loading = board.isPending && !board.data;
  const nothing = !loading && !board.isError && sections.every((s) => s.key === 'soon');

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <Header title="Due" />
      {loading ? (
        <View style={{ paddingHorizontal: 16, gap: 10 }}>
          <Skeleton height={60} />
          <Skeleton height={60} />
          <Skeleton height={60} />
        </View>
      ) : board.isError && !board.data ? (
        <View style={{ paddingHorizontal: 16 }}>
          <ErrorBox message={friendlyError(board.error)} onRetry={() => board.refetch()} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(i) => i.ch.id}
          stickySectionHeadersEnabled={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 100 }}
          refreshControl={<RefreshControl refreshing={board.isRefetching} onRefresh={() => void board.refetch()} colors={[c.cobalt]} progressBackgroundColor={c.surface} />}
          ListHeaderComponent={
            <View style={{ gap: 10, paddingBottom: 4 }}>
              {board.isError && board.data ? <OfflineBar updatedAt={board.dataUpdatedAt} /> : null}
              {nothing ? (
                <View style={{ backgroundColor: c.okWash, borderRadius: radius.card, padding: 14, gap: 4 }}>
                  <T v="bodyStrong">Everything is posted on time</T>
                  <T v="small">{(board.data?.channels.length ?? 0) ? 'Nothing is due right now.' : 'Add social channels to an app to track posting here.'}</T>
                </View>
              ) : null}
            </View>
          }
          renderSectionHeader={({ section }) => (
            <View style={{ paddingTop: 12, paddingBottom: 6 }}>
              <SectionLabel right={<T v="label" color={section.color}>{String(section.data.length)}</T>}>{section.title}</SectionLabel>
            </View>
          )}
          renderItem={({ item, index, section }) => (
            <DueRow
              item={item}
              first={index === 0}
              last={index === section.data.length - 1}
              onLog={() => setLogging(item.ch)}
              onOpen={() => router.push({ pathname: '/app/[id]', params: { id: item.ch.app_id, tab: 'social' } })}
            />
          )}
        />
      )}
      <LogPostSheet visible={!!logging} channel={logging} onClose={() => setLogging(null)} />
    </View>
  );
}

function DueRow({ item, first, last, onLog, onOpen }: { item: Item; first: boolean; last: boolean; onLog: () => void; onOpen: () => void }) {
  const { c } = useTheme();
  const { ch, state, days, next } = item;
  const detail =
    state === 'ok' && next
      ? `Due ${next.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })}`
      : state === 'never'
        ? `Every ${ch.cadence_days} day${ch.cadence_days === 1 ? '' : 's'} · nothing logged yet`
        : `${days} day${days === 1 ? '' : 's'} since last post · every ${ch.cadence_days}`;
  return (
    <View
      style={{
        backgroundColor: c.surface,
        borderColor: c.line,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: first ? 1 : 0,
        borderBottomWidth: 1,
        borderTopLeftRadius: first ? radius.card : 0,
        borderTopRightRadius: first ? radius.card : 0,
        borderBottomLeftRadius: last ? radius.card : 0,
        borderBottomRightRadius: last ? radius.card : 0,
        flexDirection: 'row',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${ch.appName}, ${platformLabel(ch.platform)}, ${lampWord[state]}. ${detail}. Open app.`}
        onPress={onOpen}
        android_ripple={{ color: c.sunk }}
        style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 12, minHeight: 60 }}
      >
        <Lamp state={state} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="bodyStrong" numberOfLines={1}>
            {ch.appName} · {platformLabel(ch.platform)}
          </T>
          <T v="caption" numberOfLines={1}>
            {detail}
          </T>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Log a post on ${platformLabel(ch.platform)} for ${ch.appName}`}
        onPress={onLog}
        hitSlop={6}
        style={{ marginHorizontal: 10, minHeight: 36, paddingHorizontal: 12, borderRadius: 9, backgroundColor: state === 'ok' ? c.sunk : c.cobalt, justifyContent: 'center' }}
      >
        <T v="small" color={state === 'ok' ? c.ink : c.onCobalt} style={{ fontFamily: font.bold }}>
          Log
        </T>
      </Pressable>
    </View>
  );
}
