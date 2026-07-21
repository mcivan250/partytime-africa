import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import { Unbounded_700Bold, Unbounded_900Black } from '@expo-google-fonts/unbounded';
import { useFonts } from 'expo-font';
import { DarkTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Colors } from '@/constants/theme';
import { AuthProvider } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

// Party Time is always dark; base the navigation theme on our palette.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: Colors.dark.background,
    card: Colors.dark.background,
    text: Colors.dark.text,
    border: Colors.dark.border,
    primary: Colors.dark.accent,
  },
};

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Unbounded_700Bold,
    Unbounded_900Black,
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider value={navTheme}>
        <AnimatedSplashOverlay />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.dark.background },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="e/[slug]"
            options={{ headerShown: true, headerTitle: '', headerBackTitle: 'Back' }}
          />
          <Stack.Screen
            name="create-event"
            options={{ headerShown: true, headerTitle: 'Host an event', presentation: 'modal' }}
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
