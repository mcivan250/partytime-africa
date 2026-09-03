import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
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

import { Appear } from '@/components/appear';
import { CityFeed } from '@/components/city-feed';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BodyFontBold,
  BottomNavInset,
  Brand,
  BrandGradient,
  BrandGradientLocations,
  DisplayFont,
  Gold,
  MaxContentWidth,
  OnBrand,
  Spacing,
  StateGo,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapLight } from '@/lib/haptics';
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

type VenueLite = { id: string; name: string; kind: string; city: string | null; cover_url: string | null };

const VENUE_KIND_LABEL: Record<string, string> = {
  bar: 'Bar',
  restaurant: 'Restaurant',
  club: 'Nightclub',
  lounge: 'Lounge',
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
        <LinearGradient
          colors={['transparent', 'rgba(7,15,10,0.35)', 'rgba(7,15,10,0.97)']}
          locations={[0, 0.5, 1]}
          style={StyleSheet.absoluteFill}
        />
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
          <View style={styles.dateRow}>
            <View style={styles.dateBar} />
            <ThemedText type="smallBold" style={styles.dateText}>
              {formatStartsAt(event).toUpperCase()}
            </ThemedText>
          </View>
          <ThemedText style={styles.cardTitle} numberOfLines={2}>
            {event.title}
          </ThemedText>
          <View style={styles.metaRow}>
            {event.venue_name ? (
              <ThemedText type="small" style={styles.onImageDim} numberOfLines={1}>
                {event.venue_name}
              </ThemedText>
            ) : null}
            {event.venue_name && event.going_count > 0 ? (
              <ThemedText type="small" style={styles.metaDot}>
                ·
              </ThemedText>
            ) : null}
            {event.going_count > 0 ? (
              <ThemedText type="small" style={styles.goingText}>
                {event.going_count} going
              </ThemedText>
            ) : null}
          </View>
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

// Horizontal "where to eat & drink" rail — the curated Kampala guide surfaced
// right on Discover so visitors see recommendations immediately.
function VenueRail({ venues }: { venues: VenueLite[] }) {
  if (venues.length === 0) return null;
  return (
    <View style={styles.railWrap}>
      <View style={styles.railHead}>
        <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
          🍸 WHERE TO EAT & DRINK
        </ThemedText>
        <Pressable onPress={() => router.push('/venues')} hitSlop={8}>
          <ThemedText type="smallBold" style={styles.railSeeAll}>
            See all ›
          </ThemedText>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railRow}>
        {venues.map((v) => (
          <Pressable
            key={v.id}
            onPress={() => router.push({ pathname: '/v/[id]', params: { id: v.id } })}
            style={({ pressed }) => [styles.railCard, pressed && styles.pressed]}>
            {v.cover_url ? (
              <Image source={{ uri: v.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            ) : (
              <LinearGradient
                colors={BrandGradient}
                locations={BrandGradientLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              colors={['transparent', 'rgba(7,15,10,0.35)', 'rgba(7,15,10,0.95)']}
              locations={[0, 0.5, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.railInfo}>
              <ThemedText type="smallBold" style={styles.railName} numberOfLines={1}>
                {v.name}
              </ThemedText>
              <ThemedText type="small" style={styles.railMeta} numberOfLines={1}>
                {VENUE_KIND_LABEL[v.kind] ?? 'Venue'} · {v.city ?? 'Kampala'}
              </ThemedText>
            </View>
          </Pressable>
        ))}
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
  const [venues, setVenues] = useState<VenueLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>('all');
  const [mode, setMode] = useState<'events' | 'feed'>('events');
  const [dmUnread, setDmUnread] = useState(0);
  const [notifUnread, setNotifUnread] = useState(0);

  const loadEvents = useCallback(async () => {
    const [{ data, error: queryError }, { data: acts }, { data: vens }] = await Promise.all([
      supabase.rpc('feed_events'),
      supabase.rpc('activity_feed'),
      supabase
        .from('venues')
        .select('id, name, kind, city, cover_url')
        .not('cover_url', 'is', null)
        .order('name')
        .limit(12),
    ]);
    if (queryError) setError(queryError.message);
    else {
      setError(null);
      setEvents((data ?? []) as FeedEvent[]);
    }
    setActivity((acts ?? []) as ActivityItem[]);
    setVenues((vens ?? []) as VenueLite[]);
    setLoading(false);
  }, []);

  // Optimistic 🔥 toggle — write to event_reactions, roll back on error.
  const toggleReaction = useCallback(
    async (event: FeedEvent) => {
      if (!session) {
        router.push('/profile');
        return;
      }
      tapLight();
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

  const refreshCounts = useCallback(async () => {
    if (!session) {
      setDmUnread(0);
      setNotifUnread(0);
      return;
    }
    const [{ count: n }, { count: d }] = await Promise.all([
      supabase.from('notifications').select('id', { count: 'exact', head: true }).is('read_at', null),
      supabase
        .from('dm_messages')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', session.user.id)
        .is('read_at', null),
    ]);
    setNotifUnread(n ?? 0);
    setDmUnread(d ?? 0);
  }, [session]);

  // Refresh on every focus so the feed and the unread badges stay live when the
  // user returns from reading messages/notifications or creating an event —
  // loadEvents doesn't toggle the skeleton, so this refreshes silently.
  useFocusEffect(
    useCallback(() => {
      loadEvents();
      refreshCounts();
    }, [loadEvents, refreshCounts]),
  );

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
            <View style={styles.iconCluster}>
              <Pressable style={styles.iconBtn} onPress={() => router.push('/messages')}>
                <ThemedText style={styles.iconGlyph}>💬</ThemedText>
                {dmUnread > 0 ? (
                  <View style={styles.iconBadge}>
                    <ThemedText style={styles.iconBadgeText}>{dmUnread > 9 ? '9+' : dmUnread}</ThemedText>
                  </View>
                ) : null}
              </Pressable>
              <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications')}>
                <ThemedText style={styles.iconGlyph}>🔔</ThemedText>
                {notifUnread > 0 ? (
                  <View style={styles.iconBadge}>
                    <ThemedText style={styles.iconBadgeText}>{notifUnread > 9 ? '9+' : notifUnread}</ThemedText>
                  </View>
                ) : null}
              </Pressable>
            </View>
          ) : null}
        </View>

        <View style={styles.segment}>
          <Pressable
            style={[styles.segmentItem, mode === 'events' && styles.segmentItemOn]}
            onPress={() => setMode('events')}>
            <ThemedText type="smallBold" style={mode === 'events' ? styles.segmentOnText : styles.segmentText}>
              What&apos;s on
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.segmentItem, mode === 'feed' && styles.segmentItemOn]}
            onPress={() => setMode('feed')}>
            <ThemedText type="smallBold" style={mode === 'feed' ? styles.segmentOnText : styles.segmentText}>
              The Feed
            </ThemedText>
          </Pressable>
        </View>

        {mode === 'feed' ? (
          <CityFeed />
        ) : (
          <>
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
          renderItem={({ item, index }) => (
            <Appear index={index}>
              <EventCard event={item} onReact={toggleReaction} />
            </Appear>
          )}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              <Pressable style={styles.planBanner} onPress={() => router.push('/plan')}>
                <LinearGradient
                  colors={BrandGradient}
                  locations={BrandGradientLocations}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.planIcon}>
                  <ThemedText style={styles.planSpark}>✨</ThemedText>
                </LinearGradient>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">Plan my night</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Ask the AI concierge what&apos;s the move
                  </ThemedText>
                </View>
                <ThemedText style={styles.planChevron}>›</ThemedText>
              </Pressable>
              {!loading && filter === 'all' && !query.trim() ? (
                <>
                  <ActivityStrip items={activity} />
                  <VenueRail venues={venues} />
                </>
              ) : null}
            </>
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
          </>
        )}
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
  iconCluster: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 18,
  },
  iconBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#F73558',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#111811',
  },
  iconBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#19231B',
    borderRadius: 999,
    padding: 4,
    marginBottom: Spacing.two,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: 999,
  },
  segmentItemOn: {
    backgroundColor: Brand,
  },
  segmentText: {
    color: '#94A697',
  },
  segmentOnText: {
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
    opacity: 0.96,
    transform: [{ scale: 0.985 }],
  },
  list: {
    gap: Spacing.three,
    paddingBottom: BottomNavInset,
    paddingTop: Spacing.one,
  },
  cardWrap: {
    borderRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardWrapFeatured: {
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 22,
  },
  card: {
    borderRadius: 24,
    overflow: 'hidden',
    minHeight: 340,
    justifyContent: 'flex-end',
  },
  cardFeatured: {
    minHeight: 400,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.55)',
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
  planBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(29,201,107,0.25)',
    borderRadius: 18,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planSpark: { fontSize: 18, color: OnBrand },
  planChevron: { fontSize: 26, color: '#94A697' },
  flex: { flex: 1 },
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
  railWrap: {
    gap: Spacing.two,
    marginBottom: Spacing.three,
  },
  railHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  railSeeAll: {
    color: StateGo,
  },
  railRow: {
    gap: Spacing.two,
    paddingRight: Spacing.four,
  },
  railCard: {
    width: 170,
    height: 190,
    borderRadius: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  railInfo: {
    padding: Spacing.three,
    gap: 2,
  },
  railName: {
    color: '#fff',
    fontSize: 15,
  },
  railMeta: {
    color: 'rgba(255,255,255,0.82)',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  dateBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: StateGo,
  },
  dateText: {
    color: '#EFF6EE',
    letterSpacing: 1.5,
    fontSize: 12,
  },
  cardTitle: {
    fontFamily: DisplayFont,
    fontSize: 30,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: '#fff',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  metaDot: {
    color: 'rgba(255,255,255,0.5)',
  },
  goingText: {
    fontFamily: BodyFontBold,
    color: StateGo,
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
