import { View } from 'react-native';
import { ago, freshness, platformLabel, sinceText, stripUrl, worst } from '../lib/catalog';
import { font, useTheme } from '../lib/theme';
import type { BoardRow } from '../lib/types';
import { Icon } from './Icon';
import { Card, Chip, Lamp, lampWord, Swatch, T } from './ui';

const fmt = (n: number | null) => (n === null ? '—' : n.toLocaleString('en-IN'));

export function AppCard({ row, onPress, now }: { row: BoardRow; onPress: () => void; now: number }) {
  const { c } = useTheme();
  const { app } = row;
  const w = worst(row.channels, now);
  const others = row.channels
    .filter((ch) => ch.id !== w?.id)
    .map((ch) => ({ ch, f: freshness(ch.lastPostedAt, ch.cadence_days, now) }))
    .slice(0, 2);
  const providers = [...new Set(row.stack.map((s) => s.provider))].slice(0, 4);

  const a11y = [
    app.name,
    app.in_use_by ? `${app.in_use_by} is working on it` : null,
    w ? `${platformLabel(w.platform)} ${lampWord[w.state]}${w.days !== null ? `, last post ${ago(w.days)}` : ''}` : 'no channels',
    row.usersTotal !== null ? `${row.usersTotal} users` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card onPress={onPress} label={a11y}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Swatch color={app.color} name={app.name} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <T v="h3" numberOfLines={1}>
            {app.name}
          </T>
          <T v="caption" numberOfLines={1}>
            {stripUrl(app.url) || app.status}
          </T>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <T v="bodyStrong" style={{ fontVariant: ['tabular-nums'] }}>
            {row.usersNew ? <T v="bodyStrong" color={c.ok}>{`+${row.usersNew}`}</T> : row.usersNew === 0 ? '0' : '—'}
            {' / '}
            {fmt(row.usersTotal)}
          </T>
          <T v="caption">users</T>
        </View>
      </View>

      {app.in_use_by ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.cobaltWash, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 5 }}>
          <Icon name="lock" size={13} color={c.cobaltInk} />
          <T v="small" color={c.cobaltInk} style={{ fontFamily: font.medium }} numberOfLines={1}>
            {app.in_use_by} is working on it · {sinceText(app.in_use_since, now)}
          </T>
        </View>
      ) : providers.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
          {providers.map((p) => (
            <Chip key={p} label={p} mono />
          ))}
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        {w ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 }}>
            <Lamp state={w.state} size={9} />
            <T v="small" numberOfLines={1}>
              {platformLabel(w.platform)} · {w.state === 'never' ? 'never posted' : w.state === 'due' && w.days === w.cadence_days ? 'due today' : ago(w.days)}
            </T>
          </View>
        ) : (
          <T v="caption">No social channels yet</T>
        )}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {others.map(({ ch, f }) => (
            <View key={ch.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <T v="caption">{platformLabel(ch.platform)}</T>
              <Lamp state={f.state} size={7} />
            </View>
          ))}
        </View>
      </View>
    </Card>
  );
}
