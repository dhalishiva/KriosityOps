import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, T } from '@/components/ui';
import { friendlyError } from '@/lib/catalog';
import { sendCode, type Mode } from '@/lib/otp';
import { supabase } from '@/lib/supabase';
import { font, radius, useTheme } from '@/lib/theme';

const LEN = 6;

export default function Otp() {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email = '', mode = 'login' } = useLocalSearchParams<{ email?: string; mode?: Mode }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [wait, setWait] = useState(60);
  const input = useRef<ComponentRef<typeof TextInput>>(null);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function verify(value = code) {
    if (value.length !== LEN) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase.auth.verifyOtp({ email, token: value, type: 'email' });
    setBusy(false);
    if (error) {
      setErr(friendlyError(error));
      setCode('');
      input.current?.focus();
    }
    // On success the auth listener swaps the stack to the board.
  }

  async function resend() {
    setErr(null);
    const problem = await sendCode(email, mode);
    if (problem) setErr(problem);
    else setWait(60);
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.paper, paddingTop: insets.top + 4, paddingBottom: insets.bottom + 20 }}>
      <View style={{ paddingHorizontal: 6 }}>
        <IconButton icon="back" label="Back" onPress={() => router.back()} />
      </View>
      <View style={{ paddingHorizontal: 22, gap: 16, flex: 1 }}>
        <View style={{ gap: 6 }}>
          <T v="title">Enter the code we emailed</T>
          <T v="small">
            Sent to <T v="small" color={c.ink} style={{ fontFamily: font.semibold }}>{email}</T>. It expires in 10 minutes.
          </T>
        </View>

        <Pressable accessibilityLabel="Code" onPress={() => input.current?.focus()} style={{ flexDirection: 'row', gap: 8 }}>
          {Array.from({ length: LEN }).map((_, i) => {
            const cur = i === Math.min(code.length, LEN - 1);
            return (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 56,
                  borderRadius: radius.control,
                  backgroundColor: c.surface,
                  borderWidth: cur ? 2 : 1,
                  borderColor: cur ? c.cobalt : c.line2,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <T v="mono" style={{ fontSize: 22, lineHeight: 28 }}>
                  {code[i] ?? ''}
                </T>
              </View>
            );
          })}
        </Pressable>
        {/* One real input under the boxes so paste and SMS/email autofill work. */}
        <TextInput
          ref={input}
          value={code}
          onChangeText={(t) => {
            const v = t.replace(/\D/g, '').slice(0, LEN);
            setCode(v);
            if (v.length === LEN) verify(v);
          }}
          autoFocus
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={LEN}
          style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
          accessibilityLabel="Six digit code"
        />

        {err ? <T v="small" color={c.late}>{err}</T> : <T v="caption">You can paste the whole code.</T>}

        <Button title="Verify and continue" loading={busy} disabled={code.length !== LEN} onPress={() => verify()} />
        <Button title={wait > 0 ? `Resend code in 0:${String(wait).padStart(2, '0')}` : 'Resend code'} kind="ghost" disabled={wait > 0} onPress={resend} />

        <View style={{ marginTop: 'auto', flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <T v="caption">Wrong email?</T>
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={10}>
            <T v="caption" color={c.cobaltInk} style={{ fontFamily: font.semibold }}>
              Change it
            </T>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
