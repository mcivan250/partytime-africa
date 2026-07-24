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
import { BodyFontBold, Colors } from '@/constants/theme';
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
            // Themed native headers: forest-black chrome, brand font, no
            // hairline shadow, and a clean "Back" label everywhere (defaults
            // otherwise leak the "(tabs)" route-group name).
            headerStyle: { backgroundColor: Colors.dark.background },
            headerShadowVisible: false,
            headerTintColor: Colors.dark.accent,
            headerTitleStyle: { fontFamily: BodyFontBold, color: Colors.dark.text },
            headerBackTitle: 'Back',
            headerBackTitleStyle: { fontFamily: BodyFontBold },
          }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="e/[slug]"
            options={{ headerShown: true, headerTitle: '' }}
          />
          <Stack.Screen
            name="create-event"
            options={{ headerShown: true, headerTitle: 'Host an event', presentation: 'modal' }}
          />
          <Stack.Screen
            name="my-events"
            options={{ headerShown: true, headerTitle: 'My events' }}
          />
          <Stack.Screen
            name="tickets"
            options={{ headerShown: true, headerTitle: 'My tickets' }}
          />
          <Stack.Screen
            name="check-in/[eventId]"
            options={{ headerShown: true, headerTitle: 'Check-in' }}
          />
          <Stack.Screen
            name="manage/[eventId]"
            options={{ headerShown: true, headerTitle: 'Manage event' }}
          />
          <Stack.Screen
            name="post/[id]"
            options={{ headerShown: true, headerTitle: 'The Feed' }}
          />
          <Stack.Screen
            name="promotions"
            options={{ headerShown: true, headerTitle: 'Promoter earnings' }}
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}
