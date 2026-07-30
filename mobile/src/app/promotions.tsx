import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Appear } from '@/components/appear';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  BottomNavInset,
  Brand,
  DisplayFont,
  Gold,
  MaxContentWidth,
  Spacing,
  StateGo,
} from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { track } from '@/lib/analytics';
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

type Payout = { id: string; amount_minor: number; currency: string; destination: string; status: string; created_at: string };

export default function PromotionsScreen() {
  const { session } = useAuth();
  const theme = useTheme();
  const [rows, setRows] = useState<Promotion[]>([]);
  const [available, setAvailable] = useState<{ amount: number; currency: string } | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [destination, setDestination] = useState('');
  const [requesting, setRequesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [promoRes, balanceRes, payoutRes] = await Promise.all([
      supabase.rpc('my_promotions'),
      supabase.rpc('promoter_balance'),
      supabase.rpc('my_promoter_payouts'),
    ]);
    setRows(
      (promoRes.data ?? []).map((r) => ({
        ...r,
        tickets_sold: Number(r.tickets_sold),
        earned_minor: Number(r.earned_minor),
      })),
    );
    const bal = balanceRes.data?.[0];
    setAvailable(bal ? { amount: Number(bal.available_minor), currency: bal.currency } : null);
    setPayouts((payoutRes.data ?? []) as Payout[]);
    setLoading(false);
  }, []);

  const requestPayout = async () => {
    if (!destination.trim()) {
      setNotice('Enter your mobile money number.');
      return;
    }
    setRequesting(true);
    setNotice(null);
    const { data, error } = await supabase.rpc('request_promoter_payout', {
      p_destination: destination.trim(),
    });
    setRequesting(false);
    if (error || !data?.[0]) {
      setNotice(error?.message ?? 'Could not request the payout.');
      return;
    }
    const sentTo = destination.trim();
    track('payout_request');
    setDestination('');
    setNotice(`Payout requested 🎉 We'll send it to ${sentTo}.`);
    await load();
  };

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  const currency = rows[0]?.currency ?? 'UGX';
  const totalEarned = rows.reduce((n, r) => n + r.earned_minor, 0);
  const totalSold = rows.reduce((n, r) => n + r.tickets_sold, 0);

  const share = (r: Promotion) => {
    const link = `https://partytime.africa/e/${r.event_slug}?ref=${r.code}`;
    track('promote_share', { event_id: r.event_id, channel: 'native' });
    Share.share({ message: `Pull up to ${r.event_title} 🎉 Get your tickets:\n${link}` });
  };
  const shareWa = (r: Promotion) => {
    const link = `https://partytime.africa/e/${r.event_slug}?ref=${r.code}`;
    track('promote_share', { event_id: r.event_id, channel: 'whatsapp' });
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

        {available && available.amount > 0 ? (
          <ThemedView type="backgroundElement" style={styles.withdrawCard}>
            <SectionLabel color={Gold}>WITHDRAW</SectionLabel>
            <ThemedText type="small" themeColor="textSecondary">
              Available to cash out now
            </ThemedText>
            <ThemedText style={styles.available}>
              {formatMoney(available.amount, available.currency)}
            </ThemedText>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
              placeholder="Mobile money number"
              placeholderTextColor={theme.textSecondary}
              value={destination}
              onChangeText={setDestination}
              keyboardType="phone-pad"
            />
            <Pressable
              style={[styles.withdrawBtn, { opacity: requesting ? 0.5 : 1 }]}
              disabled={requesting}
              onPress={requestPayout}>
              <ThemedText type="smallBold" style={styles.withdrawLabel}>
                Request payout
              </ThemedText>
            </Pressable>
            {notice ? (
              <ThemedText type="small" themeColor="textSecondary">
                {notice}
              </ThemedText>
            ) : null}
          </ThemedView>
        ) : notice ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.noticeAlone}>
            {notice}
          </ThemedText>
        ) : null}

        {payouts.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.withdrawCard}>
            <SectionLabel>PAYOUT HISTORY</SectionLabel>
            {payouts.map((p) => (
              <View key={p.id} style={styles.payoutRow}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{formatMoney(p.amount_minor, p.currency)}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {p.destination}
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.payoutStatus}>
                  {p.status}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}

        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : rows.length === 0 ? (
          <ThemedView type="backgroundElement" style={styles.emptyCard}>
            <ThemedText type="subtitle">Earn by promoting events 💸</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              Every ticket sold through your link puts money in your pocket. Here&apos;s how:
            </ThemedText>
            <View style={styles.steps}>
              <View style={styles.step}>
                <ThemedText style={styles.stepNum}>1</ThemedText>
                <ThemedText type="small" style={styles.stepText}>
                  Open any event and tap “Promote &amp; earn” to get your personal link.
                </ThemedText>
              </View>
              <View style={styles.step}>
                <ThemedText style={styles.stepNum}>2</ThemedText>
                <ThemedText type="small" style={styles.stepText}>
                  Share it on WhatsApp, status, or wherever your people are.
                </ThemedText>
              </View>
              <View style={styles.step}>
                <ThemedText style={styles.stepNum}>3</ThemedText>
                <ThemedText type="small" style={styles.stepText}>
                  Earn a cut of every ticket you sell — then cash out to mobile money.
                </ThemedText>
              </View>
            </View>
            <Pressable style={styles.browse} onPress={() => router.push('/')}>
              <ThemedText type="smallBold" style={styles.browseLabel}>
                Browse events to promote
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
  withdrawCard: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  available: {
    fontFamily: DisplayFont,
    fontSize: 28,
    color: Gold,
    marginBottom: Spacing.one,
  },
  input: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  withdrawBtn: {
    backgroundColor: Gold,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  withdrawLabel: {
    color: '#1A1403',
  },
  noticeAlone: {
    textAlign: 'center',
  },
  payoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingTop: Spacing.two,
  },
  payoutStatus: {
    color: StateGo,
    textTransform: 'capitalize',
  },
  flex: { flex: 1 },
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
  steps: {
    gap: Spacing.two,
    marginVertical: Spacing.one,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Gold,
    color: '#1A1403',
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '700',
    overflow: 'hidden',
  },
  stepText: {
    flex: 1,
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
