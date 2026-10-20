import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMark } from '@/components/Icon';
import { Button, Field, Input, T } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { sendCode, type Mode } from '@/lib/otp';
import { font, radius, useTheme } from '@/lib/theme';

export default function Login() {
  const { c } = useTheme();
  const { endedReason } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const clean = email.trim().toLowerCase();
  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean);

  async function submit() {
    setErr(null);
    if (!validEmail) return setErr('Enter a valid email address.');
    setBusy(true);
    const problem = await sendCode(clean, mode, name);
    setBusy(false);
    if (problem) return setErr(problem);
    router.push({ pathname: '/otp', params: { email: clean, mode } });
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: c.paper }}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 36, paddingBottom: insets.bottom + 24, paddingHorizontal: 22, gap: 16 }}
      >
        <LogoMark size={48} />
        <View style={{ gap: 6 }}>
          <T v="title" style={{ fontSize: 28, lineHeight: 33 }}>
            {mode === 'login' ? 'Log in to your board' : 'Create your account'}
          </T>
          <T v="small">{mode === 'login' ? 'We’ll email you a 6-digit code. No password to remember.' : 'Free for 2 apps. We’ll email you a 6-digit code.'}</T>
        </View>

        {endedReason ? (
          <View style={{ backgroundColor: c.dueWash, borderRadius: 10, padding: 10 }}>
            <T v="small" color={c.ink}>
              {endedReason}
            </T>
          </View>
        ) : null}

        <View accessibilityRole="tablist" style={{ flexDirection: 'row', backgroundColor: c.sunk, borderRadius: radius.control, padding: 3 }}>
          {(['login', 'signup'] as Mode[]).map((m) => (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: mode === m }}
              onPress={() => {
                setMode(m);
                setErr(null);
              }}
              style={{ flex: 1, minHeight: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: mode === m ? c.surface : 'transparent' }}
            >
              <T v="small" color={mode === m ? c.ink : c.ink2} style={{ fontFamily: font.semibold }}>
                {m === 'login' ? 'Log in' : 'New account'}
              </T>
            </Pressable>
          ))}
        </View>

        {mode === 'signup' ? (
          <Field label="Your name (optional)">
            <Input value={name} onChangeText={setName} placeholder="Shiva" autoComplete="name" textContentType="name" maxLength={80} returnKeyType="next" />
          </Field>
        ) : null}
        <Field label="Email" error={err}>
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            autoComplete="email"
            textContentType="emailAddress"
            returnKeyType="send"
            onSubmitEditing={submit}
          />
        </Field>

        <Button title="Email me a code" onPress={submit} loading={busy} />

        <View style={{ marginTop: 'auto', paddingTop: 12 }}>
          <T v="caption" style={{ textAlign: 'center' }}>
            Same account as ops.kriosity.in. By continuing you agree to the terms and privacy policy there.
          </T>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
