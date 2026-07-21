import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomTabInset,
  Brand,
  BrandGradient,
  BrandGradientLocations,
  MaxContentWidth,
  OnBrand,
  Spacing,
  WebBottomNavInset,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type EventRow = Pick<
  Tables<'events'>,
  'id' | 'slug' | 'title' | 'starts_at' | 'venue_name' | 'address' | 'cover_url' | 'timezone'
>;

function formatStartsAt(event: EventRow) {
  if (!event.starts_at) {
    return 'Date TBA';
  }
  return new Date(event.starts_at).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: event.timezone,
  });
}

function EventCard({ event }: { event: EventRow }) {
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: event.slug } })}
      style={({ pressed }) => [styles.cardWrap, pressed && styles.pressed]}>
      <View style={styles.card}>
        {event.cover_url ? (
          <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={BrandGradient}
            locations={BrandGradientLocations}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.9)']} style={StyleSheet.absoluteFill} />
        <View style={styles.cardContent}>
          <View style={styles.datePill}>
            <ThemedText type="smallBold" style={styles.onImage}>
              {formatStartsAt(event)}
            </ThemedText>
          </View>
          <ThemedText type="subtitle" style={styles.onImage}>
            {event.title}
          </ThemedText>
          {event.venue_name ? (
            <ThemedText type="small" style={styles.onImageDim}>
              {event.venue_name}
            </ThemedText>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export default function EventsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('events')
      .select('id, slug, title, starts_at, venue_name, address, cover_url, timezone')
      .eq('status', 'published')
      .eq('visibility', 'public')
      .order('starts_at', { ascending: true })
      .limit(50);
    if (queryError) {
      setError(queryError.message);
    } else {
      setError(null);
      setEvents(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="small" themeColor="textSecondary">
              What&apos;s on
            </ThemedText>
            <ThemedText type="title">Party Time</ThemedText>
          </View>
          {session ? (
            <Pressable style={styles.hostButton} onPress={() => router.push('/create-event')}>
              <ThemedText type="smallBold" style={styles.hostButtonLabel}>
                + Host
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
          }
          ListEmptyComponent={
            loading ? (
              <ThemedText style={styles.empty}>Loading events…</ThemedText>
            ) : error ? (
              <ThemedText style={styles.empty}>Could not load events: {error}</ThemedText>
            ) : (
              <ThemedView type="backgroundElement" style={styles.emptyCard}>
                <ThemedText type="subtitle">No events yet</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  {session
                    ? 'Be the first to throw something. Create an event, add a cover, and share the link with your people.'
                    : 'Sign in to host your own events and RSVP to invites.'}
                </ThemedText>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => router.push(session ? '/create-event' : '/profile')}>
                  <ThemedText type="smallBold" style={styles.hostButtonLabel}>
                    {session ? '+ Host your first event' : 'Sign in'}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            )
          }
        />
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.three,
  },
  hostButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  hostButtonLabel: {
    color: OnBrand,
  },
  pressed: {
    opacity: 0.85,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + WebBottomNavInset + Spacing.three,
    paddingTop: Spacing.one,
  },
  cardWrap: {
    borderRadius: 22,
    // Poster glow — light spilling from the club door (DESIGN.md signature).
    shadowColor: Brand,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 210,
    justifyContent: 'flex-end',
  },
  cardContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  datePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(11,11,16,0.55)',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  onImage: {
    color: '#fff',
  },
  onImageDim: {
    color: 'rgba(255,255,255,0.85)',
  },
  empty: {
    textAlign: 'center',
    paddingTop: Spacing.six,
  },
  emptyCard: {
    marginTop: Spacing.five,
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  emptyText: {
    lineHeight: 20,
  },
  emptyButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
