import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Appear } from '@/components/appear';
import { KineticReveal } from '@/components/kinetic-reveal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getEventTheme } from '@/constants/event-themes';
import {
  BottomNavInset,
  Brand,
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
import { type Coords, getUserLocation } from '@/lib/location';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';

type BasePick = { cover_url: string | null; reason: string; distance_km: number | null };
type EventPick = BasePick & {
  type: 'event';
  slug: string;
  title: string;
  starts_at: string | null;
  venue_name: string | null;
  timezone: string;
  theme: string;
  from_minor: number | null;
  currency: string;
};
type VenuePick = BasePick & {
  type: 'venue';
  id: string;
  title: string;
  name: string;
  kind: string;
  price_range: string | null;
  cuisines: string[];
  city: string | null;
};
type Pick_ = EventPick | VenuePick;

const SUGGESTIONS = [
  'Fine dining for a date night',
  'Best rooftop bar near me',
  'Amapiano under 50k',
  'Something free tonight',
];

function distanceText(km: number | null): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export default function PlanScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [intro, setIntro] = useState<string | null>(null);
  const [picks, setPicks] = useState<Pick_[]>([]);
  const [asked, setAsked] = useState(false);
  // undefined = not yet requested; null = unavailable/declined; Coords = known.
  const locRef = useRef<Coords | null | undefined>(undefined);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    tapLight();
    setQuery(text);
    setLoading(true);
    setAsked(true);

    // Ask for location once, tied to this tap (browsers prefer a user gesture).
    if (locRef.current === undefined) {
      locRef.current = await getUserLocation();
    }
    const here = locRef.current;

    const { data, error } = await supabase.functions.invoke('plan-my-night', {
      body: {
        query: text,
        city: 'Kampala',
        ...(here ? { lat: here.lat, lng: here.lng } : {}),
      },
    });
    setLoading(false);
    if (error || data?.error) {
      setIntro("Couldn't reach the concierge — try again in a sec.");
      setPicks([]);
      return;
    }
    setIntro(data.intro ?? null);
    setPicks((data.picks ?? []) as Pick_[]);
  };

  const openPick = (p: Pick_) => {
    if (p.type === 'venue') {
      router.push({ pathname: '/v/[id]', params: { id: p.id } });
    } else {
      router.push({ pathname: '/e/[slug]', params: { slug: p.slug } });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <ThemedText style={styles.spark}>✨</ThemedText>
          <ThemedText style={styles.title}>Plan my night</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
            Tell me the vibe, the budget, or what you&apos;re hungry for — I&apos;ll find the
            move in Kampala.
          </ThemedText>
        </View>

        <View style={styles.askRow}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="e.g. fine dining for a dinner date"
            placeholderTextColor={theme.textSecondary}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => ask(query)}
            returnKeyType="search"
          />
          <Pressable style={styles.askBtn} onPress={() => ask(query)}>
            <ThemedText type="smallBold" style={styles.askLabel}>
              Ask
            </ThemedText>
          </Pressable>
        </View>

        {!asked ? (
          <View style={styles.chips}>
            {SUGGESTIONS.map((s) => (
              <Pressable key={s} style={styles.chip} onPress={() => ask(s)}>
                <ThemedText type="small">{s}</ThemedText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {loading ? (
          <View style={styles.thinking}>
            <ActivityIndicator color={Brand} />
            <ThemedText type="small" themeColor="textSecondary">
              Reading the room…
            </ThemedText>
          </View>
        ) : null}

        {!loading && intro ? (
          <KineticReveal>
            <ThemedText style={styles.intro}>{intro}</ThemedText>
          </KineticReveal>
        ) : null}

        {!loading &&
          picks.map((p, i) => {
            const key = p.type === 'venue' ? `v:${p.id}` : `e:${p.slug}`;
            const vibe = getEventTheme(p.type === 'event' ? p.theme : 'gold');
            const dist = distanceText(p.distance_km);
            return (
              <Appear key={key} index={i}>
                <Pressable
                  onPress={() => openPick(p)}
                  style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                  <View style={styles.thumbWrap}>
                    {p.cover_url ? (
                      <Image source={{ uri: p.cover_url }} style={styles.thumb} contentFit="cover" />
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
                  <View style={styles.cardBody}>
                    <View style={styles.titleRow}>
                      <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitle}>
                        {p.title}
                      </ThemedText>
                      {p.type === 'venue' ? (
                        <View style={styles.kindPill}>
                          <ThemedText style={styles.kindPillText}>{p.kind}</ThemedText>
                        </View>
                      ) : null}
                    </View>

                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {p.type === 'event'
                        ? `${
                            p.starts_at
                              ? new Date(p.starts_at).toLocaleString(undefined, {
                                  weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                                  timeZone: p.timezone,
                                })
                              : 'Date TBA'
                          }${p.venue_name ? ` · ${p.venue_name}` : ''}`
                        : [p.price_range, p.cuisines.slice(0, 2).join(', ')].filter(Boolean).join(' · ') ||
                          p.city ||
                          'Kampala'}
                    </ThemedText>

                    <View style={styles.reasonRow}>
                      <ThemedText style={styles.reasonSpark}>✨</ThemedText>
                      <ThemedText type="small" style={styles.reason} numberOfLines={2}>
                        {p.reason}
                      </ThemedText>
                    </View>

                    <View style={styles.metaRow}>
                      {p.type === 'event' ? (
                        p.from_minor != null ? (
                          <ThemedText type="smallBold" style={styles.price}>
                            From {formatMoney(p.from_minor, p.currency)}
                          </ThemedText>
                        ) : (
                          <ThemedText type="smallBold" style={styles.free}>
                            Free entry
                          </ThemedText>
                        )
                      ) : (
                        <ThemedText type="smallBold" style={styles.reserve}>
                          Reserve a table →
                        </ThemedText>
                      )}
                      {dist ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.dist}>
                          📍 {dist}
                        </ThemedText>
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              </Appear>
            );
          })}

        {!loading && asked && picks.length === 0 && intro ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            Try a different vibe, budget or cuisine — or browse all events.
          </ThemedText>
        ) : null}
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
    paddingBottom: BottomNavInset,
  },
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.four,
    gap: Spacing.one,
  },
  spark: { fontSize: 34, marginBottom: Spacing.one },
  title: {
    fontFamily: DisplayFont,
    fontSize: 30,
    color: '#EFF6EE',
  },
  sub: { textAlign: 'center', lineHeight: 20, maxWidth: 320 },
  askRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  askBtn: {
    backgroundColor: Brand,
    borderRadius: 16,
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
  askLabel: { color: OnBrand },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  thinking: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.five },
  intro: { lineHeight: 22, fontSize: 15 },
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
  cardBody: { flex: 1, gap: 2, paddingVertical: Spacing.one, paddingRight: Spacing.two },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { flexShrink: 1 },
  kindPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: 'rgba(212,175,55,0.16)',
  },
  kindPillText: { color: Gold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  reasonRow: { flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'flex-start' },
  reasonSpark: { fontSize: 12, marginTop: 1 },
  reason: { color: StateGo, flex: 1, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: 2, flexWrap: 'wrap' },
  price: { color: Gold },
  free: { color: StateGo },
  reserve: { color: Gold },
  dist: {},
  empty: { textAlign: 'center', marginTop: Spacing.three },
});
