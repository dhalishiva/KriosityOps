import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono/400Regular';
import { JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono/500Medium';
import { SchibstedGrotesk_400Regular } from '@expo-google-fonts/schibsted-grotesk/400Regular';
import { SchibstedGrotesk_500Medium } from '@expo-google-fonts/schibsted-grotesk/500Medium';
import { SchibstedGrotesk_600SemiBold } from '@expo-google-fonts/schibsted-grotesk/600SemiBold';
import { SchibstedGrotesk_700Bold } from '@expo-google-fonts/schibsted-grotesk/700Bold';
import { SchibstedGrotesk_800ExtraBold } from '@expo-google-fonts/schibsted-grotesk/800ExtraBold';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useFonts } from 'expo-font';
import * as Notifications from 'expo-notifications';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { View } from 'react-native';
import { SnackProvider, T } from '@/components/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabaseConfigured } from '@/lib/supabase';
import { ThemeProvider, useTheme } from '@/lib/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 1000 * 60 * 60 * 24 * 7, retry: 1, networkMode: 'offlineFirst' },
    mutations: { retry: 0 },
  },
});

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'kops.cache.v1', throttleTime: 1500 });

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SchibstedGrotesk_400Regular,
    SchibstedGrotesk_500Medium,
    SchibstedGrotesk_600SemiBold,
    SchibstedGrotesk_700Bold,
    SchibstedGrotesk_800ExtraBold,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister, maxAge: 1000 * 60 * 60 * 24 * 7, buster: 'v1' }}>
      <ThemeProvider>
        <AuthProvider>
          <SnackProvider>
            <Shell />
          </SnackProvider>
        </AuthProvider>
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}

function Shell() {
  const { c, scheme } = useTheme();
  const { session, loading } = useAuth();
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(c.paper).catch(() => {});
  }, [c.paper]);

  useEffect(() => {
    if (!loading) SplashScreen.hideAsync().catch(() => {});
  }, [loading]);

  // Tapping the daily reminder opens the Due tab.
  useEffect(() => {
    if (!session || !lastResponse) return;
    if (lastResponse.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const url = lastResponse.notification.request.content.data?.url;
    if (url === '/due') router.push('/due');
    Notifications.clearLastNotificationResponse();
  }, [lastResponse, session, router]);

  if (!supabaseConfigured) {
    return (
      <View style={{ flex: 1, backgroundColor: c.paper, padding: 24, justifyContent: 'center', gap: 8 }}>
        <T v="h2">Missing Supabase key</T>
        <T v="body">Set EXPO_PUBLIC_SUPABASE_ANON_KEY in mobile/.env (or in eas.json for builds), then restart.</T>
      </View>
    );
  }
  if (loading) return <View style={{ flex: 1, backgroundColor: c.paper }} />;

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.paper }, animation: 'slide_from_right' }}>
        <Stack.Protected guard={!!session}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="app/[id]" />
          <Stack.Screen name="admin" />
          <Stack.Screen name="share" options={{ animation: 'fade_from_bottom' }} />
        </Stack.Protected>
        <Stack.Protected guard={!session}>
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen name="otp" />
        </Stack.Protected>
      </Stack>
    </>
  );
}
