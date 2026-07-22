import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomNavInset,
  Brand,
  BrandGradient,
  BrandGradientLocations,
  MaxContentWidth,
  OnBrand,
  Spacing,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type FeedEvent = {
  id: string;
  slug: string;
  title: string;
  starts_at: string | null;
  venue_name: string | null;
  address: string | null;
  cover_url: string | null;
  timezone: string;
  capacity: number | null;
  is_ticketed: boolean;
  going_count: number;
  trending_score: number;
};

function formatStartsAt(event: FeedEvent) {
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

function hoursUntil(startsAt: string | null): number | null {
  if (!startsAt) return null;
  return (new Date(startsAt).getTime() - Date.now()) / 3_600_000;
}

type Badge = { label: string; bg: string; fg: string };

// FOMO signals, all from real data — social-proof badges appear as real RSVPs
// arrive; time and ticket badges show immediately.
function fomoBadges(event: FeedEvent): Badge[] {
  const out: Badge[] = [];
  const h = hoursUntil(event.starts_at);
  if (event.trending_score >= 8) {
    out.push({ label: '🔥 Trending', bg: '#F73558', fg: '#fff' });
  }
  if (event.capacity && event.going_count >= event.capacity * 0.85) {
    out.push({ label: 'Almost full', bg: '#FFB84D', fg: '#07130B' });
  } else if (event.going_count >= 20) {
    out.push({ label: `${event.going_count} going`, bg: 'rgba(61,220,151,0.9)', fg: '#07130B' });
  }
  if (h !== null && h >= 0 && h <= 10) {
    out.push({
      label: h < 1 ? 'Starting soon' : `In ${Math.round(h)}h`,
      bg: 'rgba(11,11,16,0.6)',
      fg: '#fff',
    });
  }
  if (event.is_ticketed) {
    out.push({ label: '🎟 Tickets', bg: 'rgba(11,11,16,0.6)', fg: '#fff' });
  }
  return out.slice(0, 3);
}

function EventCard({ event }: { event: FeedEvent }) {
  const badges = fomoBadges(event);
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
        {badges.length > 0 ? (
          <View style={styles.badgeRow}>
            {badges.map((b) => (
              <View key={b.label} style={[styles.badge, { backgroundColor: b.bg }]}>
                <ThemedText type="smallBold" style={[styles.badgeText, { color: b.fg }]}>
                  {b.label}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}
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
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = useCallback(async () => {
    // feed_events returns public published events with live going/trending
    // aggregates, ordered by start time.
    const { data, error: queryError } = await supabase.rpc('feed_events');
    if (queryError) {
      setError(queryError.message);
    } else {
      setError(null);
      setEvents((data ?? []) as FeedEvent[]);
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
    paddingBottom: BottomNavInset,
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
  badgeRow: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    fontSize: 12,
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
