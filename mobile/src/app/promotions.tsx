import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Share, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomNavInset, Brand, DisplayFont, Gold, MaxContentWidth, Spacing, StateGo } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';

type Promotion = {
  event_id: string;
  event_slug: string;
  event_title: string;
  code: string;
  commission_bps: number;
  tickets_sold: number;
  earned_minor: number;
  currency: string;
};

export default function PromotionsScreen() {
  const { session } = useAuth();
  const [rows, setRows] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('my_promotions');
    setRows(
      (data ?? []).map((r) => ({
        ...r,
        tickets_sold: Number(r.tickets_sold),
        earned_minor: Number(r.earned_minor),
      })),
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  const currency = rows[0]?.currency ?? 'UGX';
  const totalEarned = rows.reduce((n, r) => n + r.earned_minor, 0);
  const totalSold = rows.reduce((n, r) => n + r.tickets_sold, 0);

  const share = (r: Promotion) => {
    const link = `https://partytime.africa/e/${r.event_slug}?ref=${r.code}`;
    Share.share({ message: `Pull up to ${r.event_title} 🎉 Get your tickets:\n${link}` });
  };
  const shareWa = (r: Promotion) => {
    const link = `https://partytime.africa/e/${r.event_slug}?ref=${r.code}`;
    const msg = `Pull up to ${r.event_title} 🎉 Get your tickets:\n${link}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.canOpenURL(url).then((ok) => Linking.openURL(ok ? url : msg));
  };

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in to promote events and earn.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.heroKicker}>
            YOU&apos;VE EARNED
          </ThemedText>
          <ThemedText style={styles.heroAmount}>{formatMoney(totalEarned, currency)}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {totalSold} ticket{totalSold === 1 ? '' : 's'} sold through your links
          </ThemedText>
        </View>

        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : rows.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.emptyCard}>
            <ThemedText type="subtitle">Start earning</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Open any event and tap “Promote &amp; earn” to get your link. Share it — you earn a cut
              of every ticket you sell.
            </ThemedText>
            <Pressable style={styles.browse} onPress={() => router.push('/')}>
              <ThemedText type="smallBold" style={styles.browseLabel}>
                Browse events
              </ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          rows.map((r, i) => (
            <Appear key={r.event_id} index={i}>
              <ThemedView type="backgroundElement" style={styles.card}>
                <Pressable
                  onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: r.event_slug } })}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {r.event_title}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {Math.round(r.commission_bps / 100)}% commission · {r.tickets_sold} sold
                  </ThemedText>
                </Pressable>

                <View style={styles.cardBottom}>
                  <View>
                    <ThemedText style={styles.earned}>
                      {formatMoney(r.earned_minor, r.currency)}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      earned
                    </ThemedText>
                  </View>
                  <View style={styles.shareRow}>
                    <Pressable style={[styles.shareBtn, styles.ghost]} onPress={() => share(r)}>
                      <ThemedText type="smallBold">Share</ThemedText>
                    </Pressable>
                    <Pressable style={[styles.shareBtn, styles.wa]} onPress={() => shareWa(r)}>
                      <ThemedText type="smallBold" style={styles.waLabel}>
                        WhatsApp
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>
              </ThemedView>
            </Appear>
          ))
        )}
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
    paddingBottom: BottomNavInset,
  },
  hero: {
    alignItems: 'center',
    paddingVertical: Spacing.four,
    gap: Spacing.half,
  },
  heroKicker: {
    letterSpacing: 2,
  },
  heroAmount: {
    fontFamily: DisplayFont,
    fontSize: 44,
    color: Gold,
  },
  loader: { marginTop: Spacing.five },
  card: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  earned: {
    fontFamily: DisplayFont,
    fontSize: 22,
    color: Gold,
  },
  shareRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  shareBtn: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: 999,
  },
  ghost: {
    backgroundColor: '#243527',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  wa: {
    backgroundColor: StateGo,
  },
  waLabel: {
    color: '#07130B',
  },
  emptyCard: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  emptyText: {
    lineHeight: 20,
  },
  browse: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  browseLabel: {
    color: '#07130B',
  },
});
