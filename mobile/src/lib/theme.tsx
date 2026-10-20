import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

// Palette: "harbor control board" — cool paper, navy ink, one cobalt, signal lamps that mean something.
// Same values as android-ui/tokens.json and the web app's base.css.
const light = {
  paper: '#F3F5F8', surface: '#FFFFFF', sunk: '#E9EDF3',
  ink: '#14213D', ink2: '#47536D', ink3: '#7A859B',
  line: '#D9DEE7', line2: '#C4CCD8',
  cobalt: '#2B4BF2', cobaltInk: '#1A33C4', cobaltWash: '#E7ECFE', onCobalt: '#FFFFFF',
  ok: '#16A36A', due: '#F5A524', late: '#E5484D', off: '#B4BCCB',
  okWash: '#E3F5EC', dueWash: '#FEF3DC', lateWash: '#FDE7E8',
  scrim: 'rgba(20,33,61,0.42)', snack: '#14213D', onSnack: '#F3F5F8',
};

const dark: typeof light = {
  paper: '#0D1424', surface: '#151E33', sunk: '#1C2740',
  ink: '#E8ECF5', ink2: '#AAB3C7', ink3: '#7C879E',
  line: '#26324D', line2: '#34415F',
  cobalt: '#6A84FF', cobaltInk: '#9DB0FF', cobaltWash: '#1D2A5C', onCobalt: '#0D1424',
  ok: '#34C88A', due: '#F7B84A', late: '#F26B6F', off: '#4A5672',
  okWash: '#11342A', dueWash: '#3A2C10', lateWash: '#3D1A1D',
  scrim: 'rgba(0,0,0,0.55)', snack: '#E8ECF5', onSnack: '#0D1424',
};

export type Colors = typeof light;

/** Android ignores fontWeight for custom fonts, so each weight is its own family. */
export const font = {
  regular: 'SchibstedGrotesk_400Regular',
  medium: 'SchibstedGrotesk_500Medium',
  semibold: 'SchibstedGrotesk_600SemiBold',
  bold: 'SchibstedGrotesk_700Bold',
  heavy: 'SchibstedGrotesk_800ExtraBold',
  mono: 'JetBrainsMono_400Regular',
  monoMedium: 'JetBrainsMono_500Medium',
};

export const radius = { chip: 6, control: 10, card: 12, fab: 16, sheet: 20 };
export const space = { gutter: 16, pad: 12, gap: 10 };

export type ThemePref = 'system' | 'light' | 'dark';

type Prefs = {
  themePref: ThemePref;
  setThemePref: (t: ThemePref) => void;
  reminderHour: number; // 0–23, -1 = off
  setReminderHour: (h: number) => void;
  lastWorker: string;
  setLastWorker: (w: string) => void;
};

type ThemeCtx = { c: Colors; scheme: 'light' | 'dark' } & Prefs;

const Ctx = createContext<ThemeCtx | null>(null);
const KEY = 'kops.prefs.v1';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [themePref, setThemePref] = useState<ThemePref>('system');
  const [reminderHour, setReminderHour] = useState(9);
  const [lastWorker, setLastWorker] = useState('Me');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!raw) return;
        const p = JSON.parse(raw) as Partial<{ themePref: ThemePref; reminderHour: number; lastWorker: string }>;
        if (p.themePref) setThemePref(p.themePref);
        if (typeof p.reminderHour === 'number') setReminderHour(p.reminderHour);
        if (p.lastWorker) setLastWorker(p.lastWorker);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(KEY, JSON.stringify({ themePref, reminderHour, lastWorker })).catch(() => {});
  }, [loaded, themePref, reminderHour, lastWorker]);

  const scheme: 'light' | 'dark' = themePref === 'system' ? (system === 'dark' ? 'dark' : 'light') : themePref;
  const value = useMemo<ThemeCtx>(
    () => ({ c: scheme === 'dark' ? dark : light, scheme, themePref, setThemePref, reminderHour, setReminderHour, lastWorker, setLastWorker }),
    [scheme, themePref, reminderHour, lastWorker],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}

export const lampColor = (c: Colors, s: 'ok' | 'due' | 'late' | 'never') =>
  s === 'ok' ? [c.ok, c.okWash] : s === 'due' ? [c.due, c.dueWash] : s === 'late' ? [c.late, c.lateWash] : [c.off, c.sunk];
