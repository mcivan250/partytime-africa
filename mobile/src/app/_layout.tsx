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

import * as Sentry from '@sentry/react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { BodyFontBold, Colors } from '@/constants/theme';
import { track } from '@/lib/analytics';
import { AuthProvider } from '@/lib/auth-context';

// Crash & error monitoring. The DSN is a public client key; safe to ship.
// Disabled in local dev so it only reports real production issues.
Sentry.init({
  dsn:
    process.env.EXPO_PUBLIC_SENTRY_DSN ??
    'https://4e57344f0ccc349ff35b382275fdfe4d@o4511824519495680.ingest.us.sentry.io/4511824531030016',
  enabled: !__DEV__,
  tracesSampleRate: 0.2,
});

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

function RootLayout() {
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

  useEffect(() => {
    track('app_open');
  }, []);

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
          <Stack.Screen
            name="notifications"
            options={{ headerShown: true, headerTitle: 'Notifications' }}
          />
          <Stack.Screen
            name="plan"
            options={{ headerShown: true, headerTitle: 'Concierge' }}
          />
          <Stack.Screen
            name="ops"
            options={{ headerShown: true, headerTitle: 'Ops Copilot' }}
          />
          <Stack.Screen
            name="messages"
            options={{ headerShown: true, headerTitle: 'Messages' }}
          />
          <Stack.Screen
            name="dm/[id]"
            options={{ headerShown: true, headerTitle: 'Chat' }}
          />
          <Stack.Screen
            name="admin"
            options={{ headerShown: true, headerTitle: 'Moderation' }}
          />
          <Stack.Screen
            name="friends"
            options={{ headerShown: true, headerTitle: 'Friends' }}
          />
          <Stack.Screen
            name="u/[id]"
            options={{ headerShown: true, headerTitle: 'Profile' }}
          />
          <Stack.Screen
            name="venues"
            options={{ headerShown: true, headerTitle: 'Bars & restaurants' }}
          />
          <Stack.Screen
            name="v/[id]"
            options={{ headerShown: true, headerTitle: '' }}
          />
          <Stack.Screen
            name="my-venue"
            options={{ headerShown: true, headerTitle: 'My venue' }}
          />
          <Stack.Screen
            name="i/[token]"
            options={{ headerShown: true, headerTitle: "You're invited" }}
          />
        </Stack>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default Sentry.wrap(RootLayout);
