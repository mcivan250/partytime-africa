import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
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
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';

type Pick_ = {
  slug: string;
  title: string;
  starts_at: string | null;
  venue_name: string | null;
  timezone: string;
  cover_url: string | null;
  theme: string;
  from_minor: number | null;
  currency: string;
  reason: string;
};

const SUGGESTIONS = [
  'Chill rooftop this weekend',
  'Amapiano under 50k',
  'Something free tonight',
  'Where are the ladies nights?',
];

export default function PlanScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [intro, setIntro] = useState<string | null>(null);
  const [picks, setPicks] = useState<Pick_[]>([]);
  const [asked, setAsked] = useState(false);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || loading) return;
    tapLight();
    setQuery(text);
    setLoading(true);
    setAsked(true);
    const { data, error } = await supabase.functions.invoke('plan-my-night', {
      body: { query: text, city: 'Kampala' },
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <ThemedText style={styles.spark}>✨</ThemedText>
          <ThemedText style={styles.title}>Plan my night</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
            Tell me the vibe and your budget — I&apos;ll find the move in Kampala.
          </ThemedText>
        </View>

        <View style={styles.askRow}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="e.g. chill rooftop this weekend under 50k"
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
            const vibe = getEventTheme(p.theme);
            return (
              <Appear key={p.slug} index={i}>
                <Pressable
                  onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: p.slug } })}
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
                    <ThemedText type="smallBold" numberOfLines={1}>
                      {p.title}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {p.starts_at
                        ? new Date(p.starts_at).toLocaleString(undefined, {
                            weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                            timeZone: p.timezone,
                          })
                        : 'Date TBA'}
                      {p.venue_name ? ` · ${p.venue_name}` : ''}
                    </ThemedText>
                    <View style={styles.reasonRow}>
                      <ThemedText style={styles.reasonSpark}>✨</ThemedText>
                      <ThemedText type="small" style={styles.reason} numberOfLines={2}>
                        {p.reason}
                      </ThemedText>
                    </View>
                    {p.from_minor != null ? (
                      <ThemedText type="smallBold" style={styles.price}>
                        From {formatMoney(p.from_minor, p.currency)}
                      </ThemedText>
                    ) : (
                      <ThemedText type="smallBold" style={styles.free}>
                        Free entry
                      </ThemedText>
                    )}
                  </View>
                </Pressable>
              </Appear>
            );
          })}

        {!loading && asked && picks.length === 0 && intro ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            Try a different vibe or budget — or browse all events.
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
  reasonRow: { flexDirection: 'row', gap: 6, marginTop: 2, alignItems: 'flex-start' },
  reasonSpark: { fontSize: 12, marginTop: 1 },
  reason: { color: StateGo, flex: 1, lineHeight: 18 },
  price: { color: Gold, marginTop: 2 },
  free: { color: StateGo, marginTop: 2 },
  empty: { textAlign: 'center', marginTop: Spacing.three },
});
