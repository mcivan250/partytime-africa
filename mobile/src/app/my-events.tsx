import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type EventRow = Pick<
  Tables<'events'>,
  'id' | 'slug' | 'title' | 'starts_at' | 'status' | 'visibility' | 'timezone'
>;

function formatDate(row: EventRow) {
  if (!row.starts_at) return 'Date TBA';
  return new Date(row.starts_at).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: row.timezone,
  });
}

const STATUS_COLOR: Record<string, string> = {
  published: StateGo,
  draft: '#94A697',
  cancelled: '#F73558',
};

export default function MyEventsScreen() {
  const { session } = useAuth();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('events')
      .select('id, slug, title, starts_at, status, visibility, timezone')
      .eq('host_id', session.user.id)
      .order('starts_at', { ascending: false });
    if (data) setEvents(data);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in to see the events you host.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <ThemedText type="title">Your events</ThemedText>
            <Pressable style={styles.hostButton} onPress={() => router.push('/create-event')}>
              <ThemedText type="smallBold" style={styles.hostLabel}>
                + Host
              </ThemedText>
            </Pressable>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/manage/[eventId]', params: { eventId: item.id } })}
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <ThemedView type="backgroundElement" style={styles.rowInner}>
              <View style={styles.rowText}>
                <ThemedText type="subtitle">{item.title}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {formatDate(item)}
                </ThemedText>
              </View>
              <View style={[styles.badge, { backgroundColor: STATUS_COLOR[item.status] ?? '#94A697' }]}>
                <ThemedText type="smallBold" style={styles.badgeText}>
                  {item.status}
                </ThemedText>
              </View>
            </ThemedView>
          </Pressable>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={Brand} style={styles.loader} />
          ) : (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              You are not hosting anything yet. Tap “+ Host” to create your first event.
            </ThemedText>
          )
        }
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  list: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  hostButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  hostLabel: {
    color: OnBrand,
  },
  row: {
    borderRadius: 18,
  },
  pressed: {
    opacity: 0.85,
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
  badge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  badgeText: {
    color: OnBrand,
    fontSize: 11,
    textTransform: 'uppercase',
  },
  loader: {
    marginTop: Spacing.six,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.six,
    lineHeight: 20,
  },
});
