import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { font, lampColor, radius, useTheme } from '../lib/theme';
import type { Freshness } from '../lib/catalog';
import { Icon, type IconName } from './Icon';

/* ───────────── text ───────────── */

type TVariant = 'title' | 'h2' | 'h3' | 'body' | 'bodyStrong' | 'small' | 'caption' | 'label' | 'mono' | 'monoSmall' | 'num';

export function T({
  v = 'body',
  color,
  style,
  children,
  numberOfLines,
  selectable,
}: {
  v?: TVariant;
  color?: string;
  style?: StyleProp<TextStyle>;
  children: ReactNode;
  numberOfLines?: number;
  selectable?: boolean;
}) {
  const { c } = useTheme();
  const base: Record<TVariant, TextStyle> = {
    title: { fontFamily: font.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.5, color: c.ink },
    h2: { fontFamily: font.bold, fontSize: 19, lineHeight: 24, letterSpacing: -0.4, color: c.ink },
    h3: { fontFamily: font.bold, fontSize: 16, lineHeight: 21, letterSpacing: -0.2, color: c.ink },
    body: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: c.ink },
    bodyStrong: { fontFamily: font.semibold, fontSize: 14, lineHeight: 20, color: c.ink },
    small: { fontFamily: font.regular, fontSize: 13, lineHeight: 18, color: c.ink2 },
    caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: c.ink3 },
    label: { fontFamily: font.bold, fontSize: 11, lineHeight: 14, letterSpacing: 0.7, textTransform: 'uppercase', color: c.ink3 },
    mono: { fontFamily: font.mono, fontSize: 13, lineHeight: 18, color: c.ink },
    monoSmall: { fontFamily: font.mono, fontSize: 11.5, lineHeight: 16, color: c.ink3 },
    num: { fontFamily: font.bold, fontSize: 20, lineHeight: 24, letterSpacing: -0.4, color: c.ink, fontVariant: ['tabular-nums'] },
  };
  return (
    <Text style={[base[v], color ? { color } : null, style]} numberOfLines={numberOfLines} selectable={selectable}>
      {children}
    </Text>
  );
}

/* ───────────── buttons ───────────── */

type BtnKind = 'primary' | 'ghost' | 'danger' | 'quiet';

export function Button({
  title,
  onPress,
  kind = 'primary',
  icon,
  loading,
  disabled,
  small,
  style,
}: {
  title: string;
  onPress?: () => void;
  kind?: BtnKind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const { c } = useTheme();
  const bg = kind === 'primary' ? c.cobalt : kind === 'quiet' ? 'transparent' : c.surface;
  const fg = kind === 'primary' ? c.onCobalt : kind === 'danger' ? c.late : kind === 'quiet' ? c.cobaltInk : c.ink;
  const off = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy: !!loading }}
      onPress={off ? undefined : onPress}
      android_ripple={{ color: kind === 'primary' ? 'rgba(255,255,255,0.2)' : c.sunk }}
      style={({ pressed }) => [
        {
          minHeight: small ? 36 : 48,
          paddingHorizontal: small ? 12 : 16,
          borderRadius: small ? 9 : radius.control,
          backgroundColor: bg,
          borderWidth: kind === 'ghost' || kind === 'danger' ? 1 : 0,
          borderColor: c.line2,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 7,
          opacity: off ? 0.55 : pressed ? 0.85 : 1,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : icon ? <Icon name={icon} size={small ? 15 : 17} color={fg} /> : null}
      <Text style={{ fontFamily: font.bold, fontSize: small ? 13 : 14.5, color: fg }}>{title}</Text>
    </Pressable>
  );
}

export function IconButton({ icon, onPress, label, color, size = 22 }: { icon: IconName; onPress?: () => void; label: string; color?: string; size?: number }) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      android_ripple={{ color: c.sunk, borderless: true, radius: 22 }}
      style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
    >
      <Icon name={icon} size={size} color={color ?? c.ink2} />
    </Pressable>
  );
}

/* ───────────── chips & lamps ───────────── */

export function Chip({ label, selected, onPress, mono, outline }: { label: string; selected?: boolean; onPress?: () => void; mono?: boolean; outline?: boolean }) {
  const { c } = useTheme();
  const body = (
    <View
      style={{
        minHeight: onPress ? 34 : 24,
        paddingHorizontal: onPress ? 12 : 8,
        borderRadius: radius.chip + (onPress ? 2 : 0),
        backgroundColor: selected ? c.cobaltWash : outline || onPress ? 'transparent' : c.sunk,
        borderWidth: !selected && (outline || onPress) ? 1 : 0,
        borderColor: c.line2,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: selected ? font.semibold : mono ? font.mono : font.medium,
          fontSize: mono ? 11.5 : onPress ? 13 : 12,
          color: selected ? c.cobaltInk : c.ink2,
        }}
      >
        {label}
      </Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: !!selected }} onPress={onPress} hitSlop={4}>
      {body}
    </Pressable>
  );
}

export function Lamp({ state, size = 10 }: { state: Freshness; size?: number }) {
  const { c } = useTheme();
  const [fg, wash] = lampColor(c, state);
  return (
    <View
      accessible={false}
      style={{ width: size + 6, height: size + 6, borderRadius: (size + 6) / 2, backgroundColor: state === 'never' ? 'transparent' : wash, alignItems: 'center', justifyContent: 'center' }}
    >
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fg }} />
    </View>
  );
}

export const lampWord: Record<Freshness, string> = { ok: 'on track', due: 'due', late: 'late', never: 'never posted' };

/* ───────────── containers ───────────── */

export function Card({ children, style, onPress, label }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; label?: string }) {
  const { c } = useTheme();
  const s: ViewStyle = { backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, padding: 12, gap: 8, overflow: 'hidden' };
  if (!onPress) return <View style={[s, style]}>{children}</View>;
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} android_ripple={{ color: c.sunk }} style={({ pressed }) => [s, style, pressed && { opacity: 0.92 }]}>
      {children}
    </Pressable>
  );
}

export function ListBox({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { c } = useTheme();
  return <View style={[{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: radius.card, overflow: 'hidden' }, style]}>{children}</View>;
}

export function Row({
  children,
  onPress,
  onLongPress,
  first,
  label,
}: {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  first?: boolean;
  label?: string;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={!onPress && !onLongPress}
      android_ripple={{ color: c.sunk }}
      style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: first ? 0 : 1, borderTopColor: c.line }}
    >
      {children}
    </Pressable>
  );
}

export function KindBadge({ icon }: { icon: IconName }) {
  const { c } = useTheme();
  return (
    <View style={{ width: 34, height: 34, borderRadius: 9, backgroundColor: c.sunk, alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={icon} size={17} color={c.ink2} />
    </View>
  );
}

export function Swatch({ color, name, size = 30 }: { color: string; name: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.27, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontFamily: font.heavy, color: '#FFFFFF', fontSize: size * 0.44 }}>{(name.trim()[0] ?? '?').toUpperCase()}</Text>
    </View>
  );
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2, paddingTop: 6 }}>
      <T v="label">{children}</T>
      {right}
    </View>
  );
}

/* ───────────── form ───────────── */

export function Field({ label, hint, hintGood, error, children }: { label: string; hint?: string; hintGood?: boolean; error?: string | null; children: ReactNode }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 5 }}>
      <T v="small" style={{ fontFamily: font.semibold, fontSize: 12.5 }}>
        {label}
      </T>
      {children}
      {error ? (
        <T v="caption" color={c.late}>
          {error}
        </T>
      ) : hint ? (
        <T v="caption" color={hintGood ? c.ok : c.ink3}>
          {hint}
        </T>
      ) : null}
    </View>
  );
}

export function Input({ mono, style, ...rest }: TextInputProps & { mono?: boolean }) {
  const { c, scheme } = useTheme();
  const [focus, setFocus] = useState(false);
  return (
    <TextInput
      placeholderTextColor={c.ink3}
      selectionColor={c.cobalt}
      keyboardAppearance={scheme}
      {...rest}
      onFocus={(e) => {
        setFocus(true);
        rest.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocus(false);
        rest.onBlur?.(e);
      }}
      style={[
        {
          minHeight: 48,
          borderRadius: radius.control,
          backgroundColor: c.surface,
          borderWidth: focus ? 2 : 1,
          borderColor: focus ? c.cobalt : c.line2,
          paddingHorizontal: focus ? 12 : 13,
          fontFamily: mono ? font.mono : font.regular,
          fontSize: mono ? 13.5 : 15,
          color: c.ink,
        },
        style,
      ]}
    />
  );
}

/* ───────────── states ───────────── */

export function Skeleton({ height = 96 }: { height?: number }) {
  const { c } = useTheme();
  const [a] = useState(() => new Animated.Value(0.5));
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }), Animated.timing(a, { toValue: 0.5, duration: 700, useNativeDriver: true })]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View style={{ height, borderRadius: radius.card, backgroundColor: c.sunk, opacity: a }} />;
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { c } = useTheme();
  return (
    <View style={{ borderRadius: radius.card, backgroundColor: c.lateWash, padding: 14, gap: 10 }}>
      <T v="bodyStrong">Couldn’t load this</T>
      <T v="small">{message}</T>
      {onRetry ? <Button title="Try again" kind="ghost" small onPress={onRetry} style={{ alignSelf: 'flex-start' }} /> : null}
    </View>
  );
}

export function OfflineBar({ updatedAt }: { updatedAt: number }) {
  const { c } = useTheme();
  const t = new Date(updatedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return (
    <View style={{ backgroundColor: c.dueWash, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 }}>
      <T v="small" color={c.ink}>
        Offline · last updated {t}. Pull down to retry.
      </T>
    </View>
  );
}

/* ───────────── header ───────────── */

export function Header({ title, left, right }: { title?: string; left?: ReactNode; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 8, paddingBottom: 4, flexDirection: 'row', alignItems: 'center', minHeight: 56 + insets.top }}>
      {left ?? <View style={{ width: 8 }} />}
      <View style={{ flex: 1, minWidth: 0 }}>
        {title ? (
          <T v="title" numberOfLines={1}>
            {title}
          </T>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row' }}>{right}</View>
    </View>
  );
}

/* ───────────── snackbar ───────────── */

type Snack = { id: number; text: string; action?: { label: string; run: () => void } };
const SnackCtx = createContext<(text: string, action?: Snack['action']) => void>(() => {});

export function SnackProvider({ children }: { children: ReactNode }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [snack, setSnack] = useState<Snack | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((text: string, action?: Snack['action']) => {
    if (timer.current) clearTimeout(timer.current);
    const s = { id: Date.now(), text, action };
    setSnack(s);
    timer.current = setTimeout(() => setSnack((cur) => (cur?.id === s.id ? null : cur)), action ? 5000 : 2600);
  }, []);
  return (
    <SnackCtx.Provider value={show}>
      {children}
      {snack ? (
        <View
          accessibilityLiveRegion="polite"
          style={[styles.snack, { bottom: insets.bottom + 80, backgroundColor: c.snack }]}
          pointerEvents="box-none"
        >
          <Text style={{ flex: 1, fontFamily: font.medium, fontSize: 13.5, color: c.onSnack }}>{snack.text}</Text>
          {snack.action ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={10}
              onPress={() => {
                snack.action?.run();
                setSnack(null);
              }}
            >
              <Text style={{ fontFamily: font.bold, fontSize: 13.5, color: c.due }}>{snack.action.label}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </SnackCtx.Provider>
  );
}

export const useSnack = () => useContext(SnackCtx);

const styles = StyleSheet.create({
  snack: { position: 'absolute', left: 16, right: 16, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12, elevation: 6 },
});
