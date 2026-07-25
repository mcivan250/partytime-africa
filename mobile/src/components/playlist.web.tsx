import { createElement } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { OnBrand, Spacing, StateGo } from '@/constants/theme';

// Turn a Spotify/YouTube share link into an embeddable player URL.
function toEmbed(url: string): { src: string; height: number } | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'open.spotify.com') {
      const m = u.pathname.match(/\/(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/);
      if (m) return { src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, height: 352 };
    }
    if (host === 'youtube.com' || host === 'music.youtube.com') {
      const list = u.searchParams.get('list');
      if (list) return { src: `https://www.youtube.com/embed/videoseries?list=${list}`, height: 220 };
      const v = u.searchParams.get('v');
      if (v) return { src: `https://www.youtube.com/embed/${v}`, height: 220 };
    }
    if (host === 'youtu.be') {
      const id = u.pathname.slice(1);
      if (id) return { src: `https://www.youtube.com/embed/${id}`, height: 220 };
    }
  } catch {
    return null;
  }
  return null;
}

export function Playlist({ url }: { url: string }) {
  const embed = toEmbed(url);
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.bar} />
        <ThemedText type="subtitle">The vibe</ThemedText>
      </View>
      {embed
        ? createElement('iframe', {
            src: embed.src,
            style: {
              width: '100%',
              height: embed.height,
              border: 'none',
              borderRadius: 12,
            },
            allow: 'encrypted-media; clipboard-write; autoplay; fullscreen; picture-in-picture',
            loading: 'lazy',
          })
        : (
          <Pressable style={styles.openButton} onPress={() => Linking.openURL(url)}>
            <ThemedText type="smallBold" style={styles.openLabel}>
              ▶ Play the playlist
            </ThemedText>
          </Pressable>
        )}
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
