import { useRouter } from 'expo-router';
import { useIncomingShare } from 'expo-sharing';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogPostSheet } from '@/components/sheets';
import { Button, Header, IconButton, Lamp, ListBox, Row, SectionLabel, Skeleton, Swatch, T } from '@/components/ui';
import { firstUrl, freshness, platformForUrl, platformLabel, stripUrl } from '@/lib/catalog';
import { useBoard } from '@/lib/queries';
import { useTheme } from '@/lib/theme';
import type { ChannelState } from '@/lib/types';
import { useNow } from '@/lib/useNow';

/** Opened from Android's share sheet. Picks the channel the shared post belongs to, then logs it. */
export default function ShareScreen() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const board = useBoard();
  const { sharedPayloads, clearSharedPayloads } = useIncomingShare();
  const [picked, setPicked] = useState<ChannelState | null>(null);
  const now = useNow();

  const text = sharedPayloads.map((p) => p.value ?? '').join(' ');
  const url = firstUrl(text);
  const platform = url ? platformForUrl(url) : null;

  const { matches, others } = (() => {
    const all = board.data?.channels ?? [];
    const sorted = [...all].sort((a, b) => {
      const fa = freshness(a.lastPostedAt, a.cadence_days, now).days ?? 999;
      const fb = freshness(b.lastPostedAt, b.cadence_days, now).days ?? 999;
      return fb - fa;
    });
    return { matches: sorted.filter((ch) => ch.platform === platform), others: sorted.filter((ch) => ch.platform !== platform) };
  })();

  function done() {
    clearSharedPayloads();
    router.replace('/');
  }

  const list = (items: ChannelState[]) => (
    <ListBox>
      {items.map((ch, i) => {
        const f = freshness(ch.lastPostedAt, ch.cadence_days, now);
        return (
          <Row key={ch.id} first={i === 0} onPress={() => setPicked(ch)} label={`${ch.appName} on ${platformLabel(ch.platform)}`}>
            <Swatch color={ch.appColor} name={ch.appName} size={28} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <T v="bodyStrong" numberOfLines={1}>
                {ch.appName} · {platformLabel(ch.platform)}
              </T>
              <T v="caption" numberOfLines={1}>
                {ch.handle ?? `Every ${ch.cadence_days} days`}
              </T>
            </View>
            <Lamp state={f.state} />
          </Row>
        );
      })}
    </ListBox>
  );

  return (
    <View style={{ flex: 1, backgroundColor: c.paper }}>
      <Header title="Log a shared post" left={<IconButton icon="close" label="Close" onPress={done} />} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 12 }}>
        <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 12, gap: 4 }}>
          <T v="label">{platform ? `${platformLabel(platform)} link` : 'Shared'}</T>
          <T v="mono" numberOfLines={3} selectable>
            {url ? stripUrl(url) : text || 'Nothing was shared.'}
          </T>
        </View>

        {board.isPending && !board.data ? (
          <Skeleton height={160} />
        ) : !board.data?.channels.length ? (
          <>
            <T v="body">You don’t have any social channels yet. Add one to an app first, then share again.</T>
            <Button title="Open the board" onPress={done} />
          </>
        ) : (
          <>
            {matches.length ? (
              <>
                <SectionLabel>Which app is this for?</SectionLabel>
                {list(matches)}
              </>
            ) : null}
            {others.length ? (
              <>
                <SectionLabel>{matches.length ? 'Other channels' : 'Pick the channel'}</SectionLabel>
                {list(others)}
              </>
            ) : null}
          </>
        )}
      </ScrollView>
      <LogPostSheet
        visible={!!picked}
        channel={picked}
        initialLink={url}
        onClose={() => setPicked(null)}
        onLogged={done}
      />
    </View>
  );
}
