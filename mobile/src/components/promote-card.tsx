import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Linking, Pressable, Share, StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DisplayFont, Gold, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';

type Promo = { code: string; commission_bps: number };
type Stats = { tickets_sold: number; earned_minor: number };

// The Hype Engine's front door: turn any guest into a promoter. They get a
// personal share link (?ref=CODE); when it sells a ticket, fulfill_paid_order
// credits their earnings.
export function PromoteCard({
  eventId,
  slug,
  title,
  currency,
  promoterBps,
}: {
  eventId: string;
  slug: string;
  title: string;
  currency: string;
  promoterBps: number;
}) {
  const { session } = useAuth();
  const [promo, setPromo] = useState<Promo | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [aiCaption, setAiCaption] = useState<string | null>(null);
  const [captionBusy, setCaptionBusy] = useState(false);
  const [busy, setBusy] = useState(false);

  const link = promo ? `https://partytime.africa/e/${slug}?ref=${promo.code}` : '';
  const pct = promo ? Math.round(promo.commission_bps / 100) : Math.round(promoterBps / 100);

  const loadStats = useCallback(async () => {
    const { data } = await supabase.rpc('my_promotions');
    const mine = (data ?? []).find((r) => r.event_id === eventId);
    if (mine) {
      setPromo({ code: mine.code, commission_bps: mine.commission_bps });
      setStats({
        tickets_sold: Number(mine.tickets_sold),
        earned_minor: Number(mine.earned_minor),
      });
    }
  }, [eventId]);

  useEffect(() => {
    if (session) loadStats();
  }, [session, loadStats]);

  const getLink = async () => {
    if (!session) {
      router.push('/profile');
      return;
    }
    setBusy(true);
    const { data } = await supabase.rpc('get_or_create_referral', { p_event_id: eventId });
    const row = data?.[0];
    if (row) {
      setPromo({ code: row.code, commission_bps: row.commission_bps });
      await loadStats();
    }
    setBusy(false);
  };

  // Host has promotion switched off (and the viewer isn't already a promoter).
  if (promoterBps <= 0 && !promo) return null;

  const genCaption = async () => {
    setCaptionBusy(true);
    const { data } = await supabase.functions.invoke('promo-caption', { body: { title, link } });
    setCaptionBusy(false);
    if (data?.caption) setAiCaption(data.caption as string);
  };

  const shareMessage = aiCaption ?? `Pull up to ${title} 🎉 Get your tickets here:\n${link}`;
  const share = () => Share.share({ message: shareMessage });
  const shareWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    Linking.canOpenURL(url).then((ok) => Linking.openURL(ok ? url : shareMessage));
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <SectionLabel color={Gold}>PROMOTE &amp; EARN</SectionLabel>

      {!promo ? (
        <>
          <ThemedText type="small" themeColor="textSecondary" style={styles.pitch}>
            Share this event with your people and earn a cut of every ticket you sell. Your link,
            your money. 💸
          </ThemedText>
          <Pressable
            style={[styles.cta, { opacity: busy ? 0.5 : 1 }]}
            disabled={busy}
            onPress={getLink}>
            <ThemedText type="smallBold" style={styles.ctaLabel}>
              {session ? 'Get my link & earn' : 'Sign in to promote'}
            </ThemedText>
          </Pressable>
        </>
      ) : (
        <>
          <ThemedText type="small" themeColor="textSecondary">
            You earn <ThemedText type="smallBold" style={styles.pct}>{pct}%</ThemedText> of every
            ticket sold through your link.
          </ThemedText>

          <View style={styles.linkBox}>
            <ThemedText type="small" numberOfLines={1} style={styles.linkText}>
              {link.replace('https://', '')}
            </ThemedText>
          </View>

          {aiCaption ? (
            <View style={styles.captionBox}>
              <ThemedText type="small" style={styles.captionText}>
                {aiCaption}
              </ThemedText>
            </View>
          ) : null}

          <Pressable
            style={[styles.captionBtn, { opacity: captionBusy ? 0.5 : 1 }]}
            disabled={captionBusy}
            onPress={genCaption}>
            <ThemedText type="smallBold" style={styles.captionBtnText}>
              {captionBusy ? 'Writing…' : aiCaption ? '✨ Rewrite caption' : '✨ Write my caption'}
            </ThemedText>
          </Pressable>

          <View style={styles.shareRow}>
            <Pressable style={[styles.shareBtn, styles.shareGhost]} onPress={share}>
              <ThemedText type="smallBold">Share link</ThemedText>
            </Pressable>
            <Pressable style={[styles.shareBtn, styles.shareWa]} onPress={shareWhatsApp}>
              <ThemedText type="smallBold" style={styles.onState}>
                WhatsApp
              </ThemedText>
            </Pressable>
          </View>

          {stats ? (
            <View style={styles.stats}>
              <View style={styles.statTile}>
                <ThemedText style={styles.statNum}>{stats.tickets_sold}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  sold via you
                </ThemedText>
              </View>
              <View style={styles.statTile}>
                <ThemedText style={[styles.statNum, styles.earned]}>
                  {formatMoney(stats.earned_minor, currency)}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  earned
                </ThemedText>
              </View>
            </View>
          ) : null}
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.22)',
  },
  pitch: {
    lineHeight: 20,
  },
  cta: {
    backgroundColor: Gold,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  ctaLabel: {
    color: '#1A1403',
  },
  pct: {
    color: Gold,
  },
  linkBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  linkText: {
    color: StateGo,
  },
  captionBox: {
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 12,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.25)',
  },
  captionText: {
    lineHeight: 19,
  },
  captionBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.4)',
  },
  captionBtnText: {
    color: Gold,
  },
  shareRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  shareBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 14,
  },
  shareGhost: {
    backgroundColor: '#243527',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shareWa: {
    backgroundColor: StateGo,
  },
  onState: {
    color: OnBrand,
  },
  stats: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  statTile: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    gap: 2,
  },
  statNum: {
    fontFamily: DisplayFont,
    fontSize: 22,
    color: '#EFF6EE',
  },
  earned: {
    color: Gold,
  },
});
