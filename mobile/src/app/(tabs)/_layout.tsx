import { Tabs, type BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/Icon';
import { freshness } from '@/lib/catalog';
import { scheduleReminders } from '@/lib/notify';
import { useBoard } from '@/lib/queries';
import { font, useTheme } from '@/lib/theme';
import { useNow } from '@/lib/useNow';

const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Board', icon: 'board' },
  { name: 'due', label: 'Due', icon: 'bell' },
  { name: 'account', label: 'Account', icon: 'user' },
];

export default function TabsLayout() {
  const { c, reminderHour } = useTheme();
  const board = useBoard();
  const now = useNow();

  const dueCount = useMemo(() => {
    return (board.data?.channels ?? []).filter((ch) => {
      const s = freshness(ch.lastPostedAt, ch.cadence_days, now).state;
      return s === 'due' || s === 'late';
    }).length;
  }, [board.data, now]);

  // Re-plan the daily reminders whenever posts or the reminder time change.
  useEffect(() => {
    if (board.data) scheduleReminders(board.data.channels, reminderHour);
  }, [board.data, reminderHour]);

  return (
    <Tabs
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: c.paper } }}
      tabBar={(props) => <TabBar {...props} badge={dueCount} />}
    >
      {TABS.map((t) => (
        <Tabs.Screen key={t.name} name={t.name} options={{ title: t.label }} />
      ))}
    </Tabs>
  );
}

function TabBar({ state, navigateToTab, badge }: BottomTabBarProps & { badge: number }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="tablist"
      style={{ flexDirection: 'row', backgroundColor: c.surface, borderTopWidth: 1, borderTopColor: c.line, paddingTop: 8, paddingBottom: insets.bottom + 8 }}
    >
      {state.routes.map((route, i) => {
        const tab = TABS.find((t) => t.name === route.name);
        if (!tab) return null;
        const on = state.index === i;
        const showBadge = tab.name === 'due' && badge > 0;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={showBadge ? `${tab.label}, ${badge} need a post` : tab.label}
            onPress={() => {
              if (!on) navigateToTab(route.key);
            }}
            style={{ flex: 1, alignItems: 'center', gap: 4, minHeight: 52 }}
          >
            <View style={{ width: 60, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: on ? c.cobaltWash : 'transparent' }}>
              <Icon name={tab.icon} size={22} color={on ? c.cobaltInk : c.ink3} />
              {showBadge ? (
                <View style={{ position: 'absolute', top: 1, right: 10, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: c.late, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: '#FFFFFF', fontFamily: font.monoMedium, fontSize: 10 }}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              ) : null}
            </View>
            <Text style={{ fontFamily: on ? font.bold : font.medium, fontSize: 12, color: on ? c.ink : c.ink3 }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
