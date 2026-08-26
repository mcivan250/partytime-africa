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
import { tapLight } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';

type Venue = {
  id: string;
  name: string;
  kind: string;
  city: string | null;
  description: string | null;
  cover_url: string | null;
  logo_url: string | null;
  price_range: string | null;
  cuisines: string[];
};

const KINDS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'restaurant', label: '🍽️ Restaurants' },
  { key: 'bar', label: '🍺 Bars' },
  { key: 'club', label: '🔊 Clubs' },
  { key: 'lounge', label: '🍸 Lounges' },
];

const KIND_VIBE: Record<string, string> = {
  bar: 'gold',
  restaurant: 'sunset',
  club: 'fire',
  lounge: 'ocean',
};

const KIND_LABEL: Record<string, string> = {
  bar: 'Bar',
  restaurant: 'Restaurant',
  club: 'Nightclub',
  lounge: 'Lounge',
};

export default function VenuesScreen() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const load = useCallback(async () => {
    // Ranked: venues with a photo first, then recent booking traction, then name.
    const { data } = await supabase.rpc('venue_directory');
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
        <ThemedText type="small" style={styles.kicker}>
          THE PARTY TIME GUIDE
        </ThemedText>
        <ThemedText style={styles.title}>Eat & drink in Kampala</ThemedText>
        <ThemedText type="default" themeColor="textSecondary" style={styles.subtitle}>
          Our hand-picked bars & restaurants — the spots locals love and visitors ask for. Reserve a
          table in a tap.
        </ThemedText>

        <View style={styles.chips}>
          {KINDS.map((k) => (
            <Pressable
              key={k.key}
              style={[styles.chip, filter === k.key && styles.chipOn]}
              onPress={() => {
                tapLight();
                setFilter(k.key);
              }}>
              <ThemedText type="small" style={filter === k.key ? styles.chipOnText : undefined}>
                {k.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : shown.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.loader}>
            Nothing here yet — check back soon.
          </ThemedText>
        ) : (
          shown.map((v, i) => {
            const vibe = getEventTheme(KIND_VIBE[v.kind]);
            return (
              <Appear key={v.id} index={i}>
                <Pressable
                  onPress={() => router.push({ pathname: '/v/[id]', params: { id: v.id } })}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                  {v.cover_url ? (
                    <Image source={{ uri: v.cover_url }} style={styles.cover} contentFit="cover" transition={200} />
                  ) : (
                    <LinearGradient
                      colors={vibe.gradient}
                      locations={BrandGradientLocations}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.cover}
                    />
                  )}
                  {/* Legibility scrim + info */}
                  <LinearGradient
                    colors={['transparent', 'rgba(9,13,10,0.35)', 'rgba(9,13,10,0.92)']}
                    locations={[0, 0.5, 1]}
                    style={styles.scrim}
                  />
                  <View style={[styles.badge, { backgroundColor: vibe.accent }]}>
                    <ThemedText type="small" style={styles.badgeText}>
                      {KIND_LABEL[v.kind] ?? 'Venue'}
                    </ThemedText>
                  </View>
                  {v.logo_url ? (
                    <Image source={{ uri: v.logo_url }} style={styles.logo} contentFit="cover" transition={200} />
                  ) : null}
                  <View style={styles.info}>
                    <ThemedText style={styles.name} numberOfLines={1}>
                      {v.name}
                    </ThemedText>
                    <ThemedText type="small" style={styles.meta} numberOfLines={1}>
                      {[
                        v.price_range,
                        v.cuisines.length > 0 ? v.cuisines.slice(0, 2).join(' · ') : null,
                        `📍 ${v.city ?? 'Kampala'}`,
                      ]
                        .filter(Boolean)
                        .join('  ·  ')}
                    </ThemedText>
                    <View style={styles.reservePill}>
                      <ThemedText type="small" style={styles.reserveText}>
                        Reserve a table →
                      </ThemedText>
                    </View>
                  </View>
                </Pressable>
              </Appear>
            );
          })
        )}
        <View style={styles.pad} />
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
  kicker: { color: Brand, letterSpacing: 2, fontSize: 11 },
  title: { fontFamily: DisplayFont, fontSize: 30, color: '#EFF6EE', lineHeight: 34, marginTop: -Spacing.one },
  subtitle: { lineHeight: 22, maxWidth: 460 },
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
  loader: { marginTop: Spacing.six, alignSelf: 'center' },
  card: {
    height: 208,
    borderRadius: 22,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pressed: { opacity: 0.97, transform: [{ scale: 0.99 }] },
  cover: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' },
  scrim: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  badge: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: Spacing.two,
  },
  badgeText: { color: OnBrand, fontSize: 11 },
  logo: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  info: { padding: Spacing.three, gap: Spacing.one },
  name: { fontFamily: DisplayFont, fontSize: 22, color: '#FFFFFF' },
  meta: { color: 'rgba(255,255,255,0.82)' },
  reservePill: {
    alignSelf: 'flex-start',
    marginTop: Spacing.one,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: Spacing.three,
  },
  reserveText: { color: '#FFFFFF' },
  pad: { height: Spacing.six },
});
