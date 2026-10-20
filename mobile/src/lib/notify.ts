import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { freshness, platformLabel } from './catalog';
import type { ChannelState } from './types';

export const CHANNEL_ID = 'due';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

let channelReady = false;
async function ensureChannel() {
  if (channelReady || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Posts due',
    description: 'A daily note when a social channel is due or late',
    // eslint-disable-next-line import/namespace -- enum is re-exported; TypeScript resolves it
    importance: Notifications.AndroidImportance.DEFAULT,
  });
  channelReady = true;
}

export async function askPermission(): Promise<boolean> {
  await ensureChannel();
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  if (!cur.canAskAgain) return false;
  const res = await Notifications.requestPermissionsAsync();
  return res.granted;
}

/**
 * Schedules up to 7 daily reminders at `hour`, each saying what will be due on that day
 * (projected from the last posts we know about). Days with nothing due get no reminder.
 * Called whenever the board loads, so it always reflects the latest posts.
 */
export async function scheduleReminders(channels: ChannelState[], hour: number) {
  if (Platform.OS === 'web') return;
  try {
    await ensureChannel();
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (hour < 0) return;
    const perm = await Notifications.getPermissionsAsync();
    if (!perm.granted) return;

    const now = new Date();
    for (let d = 0; d < 7; d++) {
      const at = new Date(now);
      at.setDate(now.getDate() + d);
      at.setHours(hour, 0, 0, 0);
      if (at.getTime() <= now.getTime() + 60_000) continue;
      const items = channels
        .map((c) => ({ c, f: freshness(c.lastPostedAt, c.cadence_days, at.getTime()) }))
        .filter((x) => x.f.state === 'due' || x.f.state === 'late');
      if (!items.length) continue;
      const late = items.filter((x) => x.f.state === 'late').length;
      const names = items.slice(0, 3).map((x) => `${x.c.appName} on ${platformLabel(x.c.platform)}`);
      const more = items.length > 3 ? ` and ${items.length - 3} more` : '';
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${items.length} post${items.length === 1 ? '' : 's'} due${late ? ` · ${late} late` : ''}`,
          body: names.join(', ') + more,
          data: { url: '/due' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
      });
    }
  } catch {
    // Reminders are a convenience; never break the board over them.
  }
}
