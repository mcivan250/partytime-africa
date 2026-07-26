import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Appear } from '@/components/appear';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getEventTheme } from '@/constants/event-themes';
import {
  BrandGradientLocations,
  Brand,
  DisplayFont,
  MaxContentWidth,
  OnBrand,
  Spacing,
  StateGo,
} from '@/constants/theme';
import { tapLight, tapSuccess } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Venue = {
  id: string;
  name: string;
  kind: string;
  city: string | null;
  address: string | null;
  description: string | null;
  cover_url: string | null;
  phone: string | null;
  price_range: string | null;
  cuisines: string[];
  hours: string | null;
  owner_id: string | null;
};

type EventLite = {
  id: string;
  slug: string;
  title: string;
  starts_at: string | null;
  cover_url: string | null;
  theme: string;
};

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

const HOURS = [18, 19, 20, 21, 22, 23];

// Build the next 7 selectable days.
function nextDays(): { key: string; label: string; date: Date }[] {
  const out: { key: string; label: string; date: Date }[] = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
    out.push({ key: d.toISOString().slice(0, 10), label, date: d });
  }
  return out;
}

export default function VenueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [events, setEvents] = useState<EventLite[]>([]);
  const [loading, setLoading] = useState(true);

  // Reservation form state.
  const days = useMemo(nextDays, []);
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(20);
  const [party, setParty] = useState(2);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [claimed, setClaimed] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [vRes, eRes] = await Promise.all([
      supabase
        .from('venues')
        .select('id, name, kind, city, address, description, cover_url, phone, price_range, cuisines, hours, owner_id')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('events')
        .select('id, slug, title, starts_at, cover_url, theme')
        .eq('venue_id', id)
        .eq('status', 'published')
        .order('starts_at', { ascending: true }),
    ]);
    setVenue((vRes.data ?? null) as Venue | null);
    const now = Date.now();
    const upcoming = ((eRes.data ?? []) as EventLite[]).filter(
      (e) => !e.starts_at || new Date(e.starts_at).getTime() >= now - 6 * 3600 * 1000,
    );
    setEvents(upcoming);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const reserve = async () => {
    if (!session) {
      Alert.alert('Sign in first', 'Create a free account to reserve a table.');
      return;
    }
    if (!venue) return;
    setSubmitting(true);
    const when = new Date(days[day].date);
    when.setHours(hour, 0, 0, 0);
    const { error } = await supabase.from('reservations').insert({
      venue_id: venue.id,
      profile_id: session.user.id,
      party_size: party,
      reserved_for: when.toISOString(),
      note: note.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      Alert.alert('Could not reserve', error.message);
      return;
    }
    tapSuccess();
    setDone(true);
  };

  const claim = async () => {
    if (!session) {
      Alert.alert('Sign in first', 'Create a free account to claim your venue.');
      return;
    }
    if (!venue) return;
    const { error } = await supabase.rpc('request_venue_claim', { p_venue_id: venue.id, p_note: '' });
    if (error) {
      Alert.alert('Could not send', error.message);
      return;
    }
    tapSuccess();
    setClaimed(true);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }
  if (!venue) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Venue not found.</ThemedText>
      </ThemedView>
    );
  }

  const vibe = getEventTheme(KIND_VIBE[venue.kind]);
  const whenLabel = `${days[day].label} · ${hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'pm' : 'am'}`;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          {venue.cover_url ? (
            <Image source={{ uri: venue.cover_url }} style={styles.heroImg} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={vibe.gradient}
              locations={BrandGradientLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroImg}
            />
          )}
        </View>

        <ThemedText type="small" style={{ color: vibe.accent }}>
          {KIND_LABEL[venue.kind] ?? 'Venue'}
          {venue.price_range ? `  ·  ${venue.price_range}` : ''}
        </ThemedText>
        <ThemedText style={styles.title}>{venue.name}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {[venue.address, venue.city ?? 'Kampala'].filter(Boolean).join(' · ')}
        </ThemedText>

        {venue.cuisines.length > 0 ? (
          <View style={styles.tagRow}>
            {venue.cuisines.map((c) => (
              <View key={c} style={styles.tag}>
                <ThemedText type="small" themeColor="textSecondary">
                  {c}
                </ThemedText>
              </View>
            ))}
          </View>
        ) : null}

        {venue.description ? (
          <ThemedText type="default" themeColor="textSecondary" style={styles.desc}>
            {venue.description}
          </ThemedText>
        ) : null}

        {/* Quick facts + actions */}
        {venue.hours ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.hours}>
            🕒 {venue.hours}
          </ThemedText>
        ) : null}
        <View style={styles.actionRow}>
          <Pressable
            style={styles.ghostAction}
            onPress={() => {
              tapLight();
              const q = encodeURIComponent(`${venue.name}, ${venue.city ?? 'Kampala'}, Uganda`);
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${q}`);
            }}>
            <ThemedText type="smallBold" style={styles.callText}>
              📍 Directions
            </ThemedText>
          </Pressable>
          {venue.phone ? (
            <Pressable
              style={styles.ghostAction}
              onPress={() => {
                tapLight();
                Linking.openURL(`tel:${venue.phone}`);
              }}>
              <ThemedText type="smallBold" style={styles.callText}>
                📞 Call
              </ThemedText>
            </Pressable>
          ) : null}
        </View>

        {/* Reserve a table */}
        <ThemedView type="backgroundElement" style={styles.reserveCard}>
          <View style={styles.rowCenter}>
            <View style={styles.bar} />
            <ThemedText type="subtitle">Reserve a table</ThemedText>
          </View>

          {done ? (
            <View style={styles.doneWrap}>
              <ThemedText type="smallBold" style={{ color: StateGo }}>
                ✓ Request sent
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {venue.name} will confirm your table for {party}{' '}
                {party === 1 ? 'guest' : 'guests'} — {whenLabel}. You'll get a notification.
              </ThemedText>
              <Pressable
                style={styles.ghostBtn}
                onPress={() => {
                  setDone(false);
                  setNote('');
                }}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Make another request
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              <ThemedText type="small" themeColor="textSecondary">
                Which night?
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {days.map((d, i) => (
                  <Pressable
                    key={d.key}
                    style={[styles.chip, day === i && styles.chipOn]}
                    onPress={() => {
                      tapLight();
                      setDay(i);
                    }}>
                    <ThemedText type="small" style={day === i ? styles.chipOnText : undefined}>
                      {d.label}
                    </ThemedText>
                  </Pressable>
                ))}
              </ScrollView>

              <ThemedText type="small" themeColor="textSecondary">
                What time?
              </ThemedText>
              <View style={styles.chipRow}>
                {HOURS.map((h) => (
                  <Pressable
                    key={h}
                    style={[styles.chip, hour === h && styles.chipOn]}
                    onPress={() => {
                      tapLight();
                      setHour(h);
                    }}>
                    <ThemedText type="small" style={hour === h ? styles.chipOnText : undefined}>
                      {h > 12 ? h - 12 : h}
                      {h >= 12 ? 'pm' : 'am'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <ThemedText type="small" themeColor="textSecondary">
                How many?
              </ThemedText>
              <View style={styles.stepper}>
                <Pressable style={styles.stepBtn} onPress={() => setParty((p) => Math.max(1, p - 1))}>
                  <ThemedText type="subtitle" style={styles.stepSign}>
                    −
                  </ThemedText>
                </Pressable>
                <ThemedText type="subtitle" style={styles.stepCount}>
                  {party}
                </ThemedText>
                <Pressable style={styles.stepBtn} onPress={() => setParty((p) => Math.min(20, p + 1))}>
                  <ThemedText type="subtitle" style={styles.stepSign}>
                    +
                  </ThemedText>
                </Pressable>
                <ThemedText type="small" themeColor="textSecondary" style={styles.stepLabel}>
                  {party === 1 ? 'guest' : 'guests'}
                </ThemedText>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Anything we should know? (optional)"
                placeholderTextColor="#66766A"
                value={note}
                onChangeText={setNote}
                multiline
              />

              <Pressable
                style={[styles.reserveBtn, submitting && styles.disabled]}
                disabled={submitting}
                onPress={reserve}>
                {submitting ? (
                  <ActivityIndicator color={OnBrand} />
                ) : (
                  <ThemedText type="smallBold" style={styles.reserveText}>
                    Request table · {whenLabel}
                  </ThemedText>
                )}
              </Pressable>
            </>
          )}
        </ThemedView>

        {/* What's on */}
        {events.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="subtitle">What&apos;s on</ThemedText>
            {events.map((e, i) => {
              const t = getEventTheme(e.theme);
              return (
                <Appear key={e.id} index={i}>
                  <Pressable
                    onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: e.slug } })}
                    style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}>
                    <View style={styles.eventThumbWrap}>
                      {e.cover_url ? (
                        <Image source={{ uri: e.cover_url }} style={styles.eventThumb} contentFit="cover" />
                      ) : (
                        <LinearGradient
                          colors={t.gradient}
                          locations={BrandGradientLocations}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.eventThumb}
                        />
                      )}
                    </View>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {e.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {e.starts_at
                          ? new Date(e.starts_at).toLocaleDateString(undefined, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Date TBA'}
                      </ThemedText>
                    </View>
                    <ThemedText style={styles.chevron}>›</ThemedText>
                  </Pressable>
                </Appear>
              );
            })}
          </View>
        ) : null}

        {/* Claim CTA — only when the venue has no manager yet */}
        {!venue.owner_id ? (
          <View style={styles.claimBox}>
            {claimed ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.claimDone}>
                ✓ Request sent. We&apos;ll verify and get you set up to manage {venue.name}.
              </ThemedText>
            ) : (
              <>
                <ThemedText type="small" themeColor="textSecondary">
                  Do you run {venue.name}?
                </ThemedText>
                <Pressable style={styles.claimBtn} onPress={claim}>
                  <ThemedText type="smallBold" style={styles.callText}>
                    Claim this venue
                  </ThemedText>
                </Pressable>
              </>
            )}
          </View>
        ) : null}

        <View style={styles.pad} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { borderRadius: 22, overflow: 'hidden', marginBottom: Spacing.two },
  heroImg: { width: '100%', height: 200, borderRadius: 22 },
  title: { fontFamily: DisplayFont, fontSize: 30, color: '#EFF6EE', lineHeight: 34 },
  desc: { marginTop: Spacing.two, lineHeight: 22 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  tag: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  hours: { marginTop: Spacing.two },
  actionRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  ghostAction: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  callText: { color: '#EFF6EE' },
  reserveCard: { borderRadius: 22, padding: Spacing.four, gap: Spacing.two, marginTop: Spacing.three },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginBottom: Spacing.one },
  bar: { width: 3, height: 18, borderRadius: 2, backgroundColor: StateGo },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, paddingVertical: Spacing.one },
  chip: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  chipOn: { backgroundColor: Brand, borderColor: 'transparent' },
  chipOnText: { color: OnBrand },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.one },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#243527',
  },
  stepSign: { color: '#EFF6EE' },
  stepCount: { minWidth: 28, textAlign: 'center' },
  stepLabel: { marginLeft: -Spacing.one },
  input: {
    backgroundColor: '#243527',
    borderRadius: 14,
    padding: Spacing.three,
    color: '#EFF6EE',
    fontFamily: 'SpaceGrotesk_400Regular',
    minHeight: 52,
    marginTop: Spacing.one,
  },
  reserveBtn: {
    backgroundColor: StateGo,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  reserveText: { color: OnBrand },
  disabled: { opacity: 0.6 },
  doneWrap: { gap: Spacing.two, paddingVertical: Spacing.two },
  ghostBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.two },
  section: { gap: Spacing.two, marginTop: Spacing.four },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: '#19231B',
    borderRadius: 18,
    padding: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  pressed: { opacity: 0.96, transform: [{ scale: 0.99 }] },
  eventThumbWrap: { borderRadius: 14, overflow: 'hidden' },
  eventThumb: { width: 64, height: 64, borderRadius: 14 },
  flex: { flex: 1 },
  chevron: { color: '#66766A', fontSize: 24, paddingRight: Spacing.two },
  claimBox: {
    marginTop: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  claimBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  claimDone: { textAlign: 'center', maxWidth: 360, lineHeight: 20 },
  pad: { height: Spacing.six },
});
