import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  SourceSerif4_400Regular,
  SourceSerif4_400Regular_Italic,
  SourceSerif4_600SemiBold,
} from '@expo-google-fonts/source-serif-4';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ToastHost } from '@/components/ui/toast-host';
import { AuthProvider } from '@/features/auth/auth-provider';
import { queryClient } from '@/features/query-client';
import { ThemeProvider, useTheme } from '@/theme';

void SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { colors, scheme } = useTheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;

  useEffect(() => {
    // Matches the native root background to the theme so transitions never flash white.
    void SystemUI.setBackgroundColorAsync(colors.bg);
  }, [colors.bg]);

  return (
    <NavigationThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.primary,
          background: colors.bg,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
        },
      }}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
      </Stack>
      <ToastHost />
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SourceSerif4_400Regular,
    SourceSerif4_400Regular_Italic,
    SourceSerif4_600SemiBold,
  });
  const ready = fontsLoaded || !!fontError;

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <ThemeProvider>
            <RootNavigator />
          </ThemeProvider>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
