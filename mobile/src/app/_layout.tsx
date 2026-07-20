import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AuthProvider } from '@/lib/auth-context';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <AuthProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="event/[slug]"
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
