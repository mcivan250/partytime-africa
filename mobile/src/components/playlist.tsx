import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OnBrand, Spacing, StateGo } from '@/constants/theme';

// Native (and default): open the playlist in the Spotify/YouTube app. We avoid
// react-native-webview here — it isn't available in Expo Go and crashes the
// web build. The web build uses playlist.web.tsx to embed a real player.
export function Playlist({ url }: { url: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.bar} />
        <ThemedText type="subtitle">The vibe</ThemedText>
      </View>
      <Pressable style={styles.openButton} onPress={() => Linking.openURL(url)}>
        <ThemedText type="smallBold" style={styles.openLabel}>
          ▶ Play the playlist
        </ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: StateGo,
  },
  openButton: {
    backgroundColor: StateGo,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  openLabel: {
    color: OnBrand,
  },
});
