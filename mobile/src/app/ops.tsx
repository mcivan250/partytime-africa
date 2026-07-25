import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { KineticReveal } from '@/components/kinetic-reveal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, DisplayFont, Gold, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';

type Metrics = {
  events_published: number;
  tickets_sold: number;
  revenue_minor: number;
  paid_orders: number;
  new_users_7d: number;
  going_rsvps: number;
  feed_posts: number;
  promoter_earnings_minor: number;
  top_events: { title: string; sold: number }[];
  top_promoters: { name: string; sold: number }[];
};

const SUGGESTIONS = ['How are we doing this week?', 'Which event is selling best?', 'Who are my top promoters?'];

function Tile({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={styles.tile}>
      <ThemedText style={[styles.tileNum, color ? { color } : null]}>{value}</ThemedText>
      <ThemedText style={styles.tileLabel}>{label}</ThemedText>
    </View>
  );
}

export default function OpsScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [denied, setDenied] = useState(false);

  const call = useCallback(async (q?: string) => {
    const { data, error } = await supabase.functions.invoke('ops-copilot', {
      body: q ? { question: q } : {},
    });
    if (error || data?.error) {
      setDenied(true);
      return null;
    }
    if (data.metrics) setMetrics(data.metrics as Metrics);
    if (data.answer) setAnswer(data.answer as string);
    return data;
  }, []);

  useEffect(() => {
    if (!session) return;
    call().finally(() => setLoading(false));
  }, [session, call]);

  const ask = async (q: string) => {
    const text = q.trim();
    if (!text || asking) return;
    setQuestion(text);
    setAsking(true);
    await call(text);
    setAsking(false);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }
  if (denied || !metrics) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Admins only.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.tileGrid}>
          <Tile value={formatMoney(metrics.revenue_minor, 'UGX')} label="REVENUE" color={Gold} />
          <Tile value={String(metrics.tickets_sold)} label="TICKETS SOLD" color={StateGo} />
          <Tile value={String(metrics.events_published)} label="LIVE EVENTS" />
          <Tile value={String(metrics.new_users_7d)} label="NEW USERS · 7D" color={Brand} />
          <Tile value={String(metrics.going_rsvps)} label="GOING RSVPS" />
          <Tile value={formatMoney(metrics.promoter_earnings_minor, 'UGX')} label="PROMOTER PAYOUTS" color={Gold} />
        </View>

        <View style={styles.askRow}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Ask your data anything…"
            placeholderTextColor={theme.textSecondary}
            value={question}
            onChangeText={setQuestion}
            onSubmitEditing={() => ask(question)}
            returnKeyType="send"
          />
          <Pressable style={styles.askBtn} onPress={() => ask(question)}>
            <ThemedText type="smallBold" style={styles.askLabel}>
              Ask
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.chips}>
          {SUGGESTIONS.map((s) => (
            <Pressable key={s} style={styles.chip} onPress={() => ask(s)}>
              <ThemedText type="small">{s}</ThemedText>
            </Pressable>
          ))}
        </View>

        {asking ? (
          <View style={styles.thinking}>
            <ActivityIndicator color={Brand} />
            <ThemedText type="small" themeColor="textSecondary">
              Crunching the numbers…
            </ThemedText>
          </View>
        ) : answer ? (
          <KineticReveal>
            <ThemedView type="backgroundElement" style={styles.answerCard}>
              <ThemedText style={styles.answer}>{answer}</ThemedText>
            </ThemedView>
          </KineticReveal>
        ) : null}

        {metrics.top_events.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.listCard}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.listLabel}>
              TOP EVENTS
            </ThemedText>
            {metrics.top_events.map((e, i) => (
              <View key={`${e.title}-${i}`} style={styles.listRow}>
                <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                  {e.title}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {e.sold} sold
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}

        {metrics.top_promoters.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.listCard}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.listLabel}>
              TOP PROMOTERS
            </ThemedText>
            {metrics.top_promoters.map((p, i) => (
              <View key={`${p.name}-${i}`} style={styles.listRow}>
                <ThemedText type="smallBold" style={styles.flex} numberOfLines={1}>
                  {p.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {p.sold} sold
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  tile: {
    width: '31.5%',
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.two,
    gap: 2,
  },
  tileNum: { fontFamily: DisplayFont, fontSize: 18, color: '#EFF6EE' },
  tileLabel: { fontSize: 9, letterSpacing: 1, color: '#94A697' },
  askRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  askBtn: { backgroundColor: Brand, borderRadius: 16, paddingHorizontal: Spacing.four, justifyContent: 'center' },
  askLabel: { color: OnBrand },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  thinking: { alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.four },
  answerCard: { borderRadius: 18, padding: Spacing.four },
  answer: { lineHeight: 22 },
  listCard: { borderRadius: 18, padding: Spacing.four, gap: Spacing.two },
  listLabel: { letterSpacing: 2, fontSize: 11 },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  flex: { flex: 1 },
});
