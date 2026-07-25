import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getEventTheme } from '@/constants/event-themes';
import { BrandGradientLocations, Brand, DisplayFont, MaxContentWidth, OnBrand, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

type Venue = { id: string; name: string; kind: string; city: string | null; description: string | null; cover_url: string | null };

const KINDS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'bar', label: '🍺 Bars' },
  { key: 'restaurant', label: '🍽️ Restaurants' },
  { key: 'club', label: '🔊 Clubs' },
  { key: 'lounge', label: '🍸 Lounges' },
];

// Map a venue kind to one of the event vibes for its gradient.
const KIND_VIBE: Record<string, string> = {
  bar: 'gold',
  restaurant: 'sunset',
  club: 'fire',
  lounge: 'ocean',
};

export default function VenuesScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('venues')
      .select('id, name, kind, city, description, cover_url')
      .order('name');
    setVenues((data ?? []) as Venue[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const shown = filter === 'all' ? venues : venues.filter((v) => v.kind === filter);

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Bars & restaurants</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Book a table any night — reserve your spot in a tap.
        </ThemedText>

        <View style={styles.chips}>
          {KINDS.map((k) => (
            <Pressable
              key={k.key}
              style={[styles.chip, filter === k.key && styles.chipOn]}
              onPress={() => setFilter(k.key)}>
              <ThemedText type="small" style={filter === k.key ? styles.chipOnText : undefined}>
                {k.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : (
          shown.map((v, i) => {
            const vibe = getEventTheme(KIND_VIBE[v.kind]);
            return (
              <Appear key={v.id} index={i}>
                <Pressable
                  onPress={() => router.push({ pathname: '/v/[id]', params: { id: v.id } })}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                  <View style={styles.thumbWrap}>
                    {v.cover_url ? (
                      <Image source={{ uri: v.cover_url }} style={styles.thumb} contentFit="cover" />
                    ) : (
                      <LinearGradient
                        colors={vibe.gradient}
                        locations={BrandGradientLocations}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.thumb}
                      />
                    )}
                  </View>
                  <View style={styles.body}>
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {v.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                      {v.description ?? v.city ?? 'Kampala'}
                    </ThemedText>
                  </View>
                </Pressable>
              </Appear>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  title: { fontFamily: DisplayFont, fontSize: 28, color: '#EFF6EE' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipOn: { backgroundColor: Brand, borderColor: 'transparent' },
  chipOnText: { color: OnBrand },
  loader: { marginTop: Spacing.six },
  card: {
    flexDirection: 'row',
    gap: Spacing.three,
    backgroundColor: '#19231B',
    borderRadius: 18,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.99 }] },
  thumbWrap: { borderRadius: 14, overflow: 'hidden' },
  thumb: { width: 84, height: 84, borderRadius: 14 },
  body: { flex: 1, gap: 2, paddingVertical: Spacing.two, paddingRight: Spacing.two, justifyContent: 'center' },
});
