import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type EventRow = Pick<
  Tables<'events'>,
  'id' | 'slug' | 'title' | 'starts_at' | 'venue_name' | 'address' | 'cover_url' | 'timezone'
>;

function formatStartsAt(event: EventRow) {
  if (!event.starts_at) {
    return 'Date to be announced';
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
    <ThemedView type="backgroundElement" style={styles.card}>
      {event.cover_url ? (
        <Image source={{ uri: event.cover_url }} style={styles.cover} contentFit="cover" />
      ) : null}
      <View style={styles.cardBody}>
        <ThemedText type="subtitle">{event.title}</ThemedText>
        <ThemedText type="small">{formatStartsAt(event)}</ThemedText>
        {event.venue_name ? <ThemedText type="small">{event.venue_name}</ThemedText> : null}
      </View>
    </ThemedView>
  );
}

export default function EventsScreen() {
  const theme = useTheme();
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
        <ThemedText type="title" style={styles.heading}>
          Party Time
        </ThemedText>
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
          }
          ListEmptyComponent={
            <ThemedText style={styles.empty}>
              {loading
                ? 'Loading events…'
                : error
                  ? `Could not load events: ${error}`
                  : 'No published events yet. Be the first to host one!'}
            </ThemedText>
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
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.four,
  },
  heading: {
    paddingVertical: Spacing.three,
  },
  list: {
    gap: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  cardBody: {
    padding: Spacing.three,
    gap: Spacing.one,
  },
  empty: {
    textAlign: 'center',
    paddingTop: Spacing.six,
  },
});
