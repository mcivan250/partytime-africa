import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomNavInset,
  Brand,
  BrandGradient,
  BrandGradientLocations,
  Gold,
  MaxContentWidth,
  OnBrand,
  Spacing,
  StateGo,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

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
  featured: boolean;
  sponsor_name: string | null;
  reaction_count: number;
  comment_count: number;
  i_reacted: boolean;
};

type ActivityItem = {
  kind: string;
  actor: string;
  event_id: string;
  event_slug: string;
  event_title: string;
  cover_url: string | null;
  at: string;
};

type FilterKey = 'all' | 'trending' | 'tonight' | 'weekend' | 'ticketed' | 'free';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'trending', label: '🔥 Trending' },
  { key: 'tonight', label: 'Tonight' },
  { key: 'weekend', label: 'This weekend' },
  { key: 'ticketed', label: '🎟 Tickets' },
  { key: 'free', label: 'Free' },
];

function formatStartsAt(event: FeedEvent) {
  if (!event.starts_at) return 'Date TBA';
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

function isThisWeekend(startsAt: string | null, tz: string): boolean {
  if (!startsAt) return false;
  const d = new Date(startsAt);
  const h = (d.getTime() - Date.now()) / 3_600_000;
  if (h < -6 || h > 24 * 7) return false;
  const wd = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: tz }).format(d);
  return wd === 'Fri' || wd === 'Sat' || wd === 'Sun';
}

function matchesFilter(ev: FeedEvent, filter: FilterKey): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'trending':
      return ev.trending_score > 0;
    case 'tonight': {
      const h = hoursUntil(ev.starts_at);
      return h !== null && h >= -3 && h <= 14;
    }
    case 'weekend':
      return isThisWeekend(ev.starts_at, ev.timezone);
    case 'ticketed':
      return ev.is_ticketed;
    case 'free':
      return !ev.is_ticketed;
  }
}

type Badge = { label: string; bg: string; fg: string };

function fomoBadges(event: FeedEvent): Badge[] {
  const out: Badge[] = [];
  const h = hoursUntil(event.starts_at);
  if (event.trending_score >= 8) out.push({ label: '🔥 Trending', bg: '#F73558', fg: '#fff' });
  if (event.capacity && event.going_count >= event.capacity * 0.85) {
    out.push({ label: 'Almost full', bg: '#FFB84D', fg: '#07130B' });
  } else if (event.going_count >= 20) {
    out.push({ label: `${event.going_count} going`, bg: 'rgba(61,220,151,0.9)', fg: '#07130B' });
  }
  if (h !== null && h >= 0 && h <= 10) {
    out.push({ label: h < 1 ? 'Starting soon' : `In ${Math.round(h)}h`, bg: 'rgba(11,11,16,0.6)', fg: '#fff' });
  }
  if (event.is_ticketed) out.push({ label: '🎟 Tickets', bg: 'rgba(11,11,16,0.6)', fg: '#fff' });
  return out.slice(0, 3);
}

function EventCard({ event, onReact }: { event: FeedEvent; onReact: (event: FeedEvent) => void }) {
  const badges = fomoBadges(event);
  const openEvent = () => router.push({ pathname: '/e/[slug]', params: { slug: event.slug } });
  return (
    <Pressable
      onPress={openEvent}
      style={({ pressed }) => [
        styles.cardWrap,
        event.featured && styles.cardWrapFeatured,
        pressed && styles.pressed,
      ]}>
      <View style={[styles.card, event.featured && styles.cardFeatured]}>
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
        {event.featured ? (
          <View style={styles.featuredRibbon}>
            <ThemedText type="smallBold" style={styles.featuredRibbonText}>
              {event.sponsor_name ? `★ Sponsored by ${event.sponsor_name}` : '★ Featured'}
            </ThemedText>
          </View>
        ) : null}
        {badges.length > 0 ? (
          <View style={[styles.badgeRow, event.featured && styles.badgeRowFeatured]}>
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
          <View style={styles.cardActions}>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onReact(event);
              }}
              hitSlop={8}
              style={[styles.actionPill, event.i_reacted && styles.actionPillOn]}>
              <ThemedText type="smallBold" style={event.i_reacted ? styles.actionOnText : styles.onImage}>
                🔥 {event.reaction_count > 0 ? event.reaction_count : 'Hype'}
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                openEvent();
              }}
              hitSlop={8}
              style={styles.actionPill}>
              <ThemedText type="smallBold" style={styles.onImage}>
                💬 {event.comment_count > 0 ? event.comment_count : 'Chat'}
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// Horizontal "right now" strip of real activity (going-RSVPs + new events).
function ActivityStrip({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) return null;
  return (
    <View style={styles.activityWrap}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
        ⚡ RIGHT NOW
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.activityRow}>
        {items.map((item, i) => {
          const verb = item.kind === 'rsvp' ? 'is going to' : 'is hosting';
          const emoji = item.kind === 'rsvp' ? '🔥' : '✨';
          return (
            <Pressable
              key={`${item.kind}-${item.event_id}-${i}`}
              onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: item.event_slug } })}
              style={styles.activityCard}>
              <ThemedText type="smallBold" numberOfLines={2} style={styles.activityText}>
                {emoji} <ThemedText type="smallBold" style={styles.activityActor}>{item.actor}</ThemedText> {verb}
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {item.event_title}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[styles.skeleton, { opacity }]} />;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <ThemedText type="smallBold" style={active ? styles.chipActiveText : styles.chipText}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export default function EventsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');

  const loadEvents = useCallback(async () => {
    const [{ data, error: queryError }, { data: acts }] = await Promise.all([
      supabase.rpc('feed_events'),
      supabase.rpc('activity_feed'),
    ]);
    if (queryError) setError(queryError.message);
    else {
      setError(null);
      setEvents((data ?? []) as FeedEvent[]);
    }
    setActivity((acts ?? []) as ActivityItem[]);
    setLoading(false);
  }, []);

  // Optimistic 🔥 toggle — write to event_reactions, roll back on error.
  const toggleReaction = useCallback(
    async (event: FeedEvent) => {
      if (!session) {
        router.push('/profile');
        return;
      }
      const next = !event.i_reacted;
      setEvents((prev) =>
        prev.map((e) =>
          e.id === event.id
            ? { ...e, i_reacted: next, reaction_count: Math.max(0, e.reaction_count + (next ? 1 : -1)) }
            : e,
        ),
      );
      const { error: reactError } = next
        ? await supabase
            .from('event_reactions')
            .insert({ event_id: event.id, profile_id: session.user.id })
        : await supabase
            .from('event_reactions')
            .delete()
            .eq('event_id', event.id)
            .eq('profile_id', session.user.id);
      if (reactError) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === event.id
              ? { ...e, i_reacted: event.i_reacted, reaction_count: event.reaction_count }
              : e,
          ),
        );
      }
    },
    [session],
  );

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  }, [loadEvents]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (!matchesFilter(e, filter)) return false;
      if (!q) return true;
      return (
        e.title.toLowerCase().includes(q) || (e.venue_name ?? '').toLowerCase().includes(q)
      );
    });
  }, [events, filter, query]);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.headerRow}>
          <View>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
              KAMPALA 🌙
            </ThemedText>
            <ThemedText type="title">What&apos;s on</ThemedText>
          </View>
          {session ? (
            <Pressable style={styles.hostButton} onPress={() => router.push('/create-event')}>
              <ThemedText type="smallBold" style={styles.hostButtonLabel}>
                + Host
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        <TextInput
          style={[styles.search, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          placeholder="🔍  Search events, venues…"
          placeholderTextColor={theme.textSecondary}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />

        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}>
            {FILTERS.map((f) => (
              <Chip key={f.key} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={loading ? [] : filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EventCard event={item} onReact={toggleReaction} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            !loading && filter === 'all' && !query.trim() ? (
              <ActivityStrip items={activity} />
            ) : null
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
          }
          ListEmptyComponent={
            loading ? (
              <View style={styles.list}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            ) : error ? (
              <ThemedText style={styles.empty}>Could not load events: {error}</ThemedText>
            ) : events.length > 0 ? (
              <ThemedView type="backgroundElement" style={styles.emptyCard}>
                <ThemedText type="subtitle">Nothing here</ThemedText>
                <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
                  No events match. Try another filter or clear your search.
                </ThemedText>
                <Pressable
                  style={styles.emptyButton}
                  onPress={() => {
                    setFilter('all');
                    setQuery('');
                  }}>
                  <ThemedText type="smallBold" style={styles.hostButtonLabel}>
                    Reset
                  </ThemedText>
                </Pressable>
              </ThemedView>
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
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  kicker: {
    letterSpacing: 2,
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
  search: {
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    marginBottom: Spacing.two,
  },
  chipRow: {
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    paddingRight: Spacing.four,
  },
  chip: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: {
    backgroundColor: Brand,
    borderColor: 'transparent',
  },
  chipText: {
    opacity: 0.8,
  },
  chipActiveText: {
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
    shadowColor: Brand,
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  cardWrapFeatured: {
    shadowColor: Gold,
    shadowOpacity: 0.5,
    shadowRadius: 26,
  },
  card: {
    borderRadius: 22,
    overflow: 'hidden',
    minHeight: 210,
    justifyContent: 'flex-end',
  },
  cardFeatured: {
    minHeight: 250,
    borderWidth: 1.5,
    borderColor: Gold,
  },
  featuredRibbon: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: Gold,
    paddingVertical: 5,
    alignItems: 'center',
  },
  featuredRibbonText: {
    color: '#07130B',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  badgeRowFeatured: {
    top: Spacing.three + 26,
  },
  skeleton: {
    borderRadius: 22,
    minHeight: 210,
    backgroundColor: '#19231B',
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
  cardActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(11,11,16,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  actionPillOn: {
    backgroundColor: Brand,
    borderColor: 'transparent',
  },
  actionOnText: {
    color: OnBrand,
  },
  activityWrap: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  activityRow: {
    gap: Spacing.two,
    paddingRight: Spacing.four,
  },
  activityCard: {
    width: 200,
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  activityText: {
    lineHeight: 18,
  },
  activityActor: {
    color: StateGo,
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
