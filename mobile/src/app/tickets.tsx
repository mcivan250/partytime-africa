import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, BrandGradient, BrandGradientLocations, MaxContentWidth, OnBrand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type WalletTicket = {
  id: string;
  attendee_name: string;
  qr_code: string;
  status: 'valid' | 'checked_in' | 'void';
  events: { title: string; starts_at: string | null; venue_name: string | null; timezone: string } | null;
  ticket_tiers: { name: string } | null;
};

function formatWhen(t: WalletTicket) {
  const s = t.events?.starts_at;
  if (!s) return 'Date TBA';
  return new Date(s).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: t.events?.timezone,
  });
}

const STATUS_LABEL: Record<WalletTicket['status'], string> = {
  valid: '● Valid',
  checked_in: '✓ Checked in',
  void: '✕ Void',
};

type WalletMerch = {
  id: string;
  buyer_name: string;
  qr_code: string;
  quantity: number;
  status: string;
  merch_items: { name: string } | null;
  merch_variants: { label: string } | null;
  events: { title: string; venue_name: string | null } | null;
};

export default function TicketsScreen() {
  const { session } = useAuth();
  const [tickets, setTickets] = useState<WalletTicket[]>([]);
  const [merch, setMerch] = useState<WalletMerch[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    const [ticketRes, merchRes] = await Promise.all([
      supabase
        .from('tickets')
        .select(
          'id, attendee_name, qr_code, status, orders!inner(profile_id), events(title, starts_at, venue_name, timezone), ticket_tiers(name)',
        )
        .eq('orders.profile_id', session.user.id),
      supabase
        .from('merch_purchases')
        .select(
          'id, buyer_name, qr_code, quantity, status, orders!inner(profile_id), merch_items(name), merch_variants(label), events(title, venue_name)',
        )
        .eq('orders.profile_id', session.user.id),
    ]);
    if (ticketRes.data) setTickets(ticketRes.data as unknown as WalletTicket[]);
    if (merchRes.data) setMerch(merchRes.data as unknown as WalletMerch[]);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in to see your tickets.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">My tickets</ThemedText>
        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : tickets.length === 0 && merch.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            No tickets yet. When you buy a ticket or merch it shows up here with a QR pass that
            scans at the door — even offline.
          </ThemedText>
        ) : (
          tickets.map((t) => (
            <ThemedView key={t.id} type="backgroundElement" style={styles.pass}>
              <LinearGradient
                colors={BrandGradient}
                locations={BrandGradientLocations}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.passTop}>
                <ThemedText type="smallBold" style={styles.passKicker}>
                  {(t.ticket_tiers?.name ?? 'TICKET').toUpperCase()}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.passTitle}>
                  {t.events?.title ?? 'Event'}
                </ThemedText>
              </LinearGradient>
              <View style={styles.passBody}>
                <View style={styles.qrBox}>
                  <QRCode value={t.qr_code} size={104} backgroundColor="#FFFFFF" color="#0B120D" />
                </View>
                <View style={styles.passInfo}>
                  <ThemedText type="smallBold">{t.attendee_name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {formatWhen(t)}
                  </ThemedText>
                  {t.events?.venue_name ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {t.events.venue_name}
                    </ThemedText>
                  ) : null}
                  <ThemedText type="smallBold" style={styles.status}>
                    {STATUS_LABEL[t.status]}
                  </ThemedText>
                </View>
              </View>
            </ThemedView>
          ))
        )}

        {merch.length > 0 ? (
          <>
            <ThemedText type="subtitle" style={styles.sectionHeading}>
              🛍️ Merch pickups
            </ThemedText>
            {merch.map((m) => {
              const collected = m.status === 'collected';
              const size =
                m.merch_variants?.label && m.merch_variants.label !== 'One size'
                  ? ` · ${m.merch_variants.label}`
                  : '';
              return (
                <ThemedView key={m.id} type="backgroundElement" style={styles.pass}>
                  <View style={styles.merchTop}>
                    <ThemedText type="smallBold" style={styles.merchKicker}>
                      {(m.merch_items?.name ?? 'MERCH').toUpperCase()}
                      {size.toUpperCase()}
                    </ThemedText>
                    <ThemedText type="subtitle">{m.events?.title ?? 'Event'}</ThemedText>
                  </View>
                  <View style={styles.passBody}>
                    <View style={styles.qrBox}>
                      <QRCode value={m.qr_code} size={104} backgroundColor="#FFFFFF" color="#0B120D" />
                    </View>
                    <View style={styles.passInfo}>
                      <ThemedText type="smallBold">
                        {m.buyer_name}
                        {m.quantity > 1 ? ` ×${m.quantity}` : ''}
                      </ThemedText>
                      {m.events?.venue_name ? (
                        <ThemedText type="small" themeColor="textSecondary">
                          {m.events.venue_name}
                        </ThemedText>
                      ) : null}
                      <ThemedText type="smallBold" style={styles.status}>
                        {collected ? '✓ Collected' : '● Show at pickup'}
                      </ThemedText>
                    </View>
                  </View>
                </ThemedView>
              );
            })}
          </>
        ) : null}
      </ScrollView>
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
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  loader: {
    marginTop: Spacing.six,
  },
  empty: {
    lineHeight: 20,
    marginTop: Spacing.three,
  },
  pass: {
    borderRadius: 22,
    overflow: 'hidden',
  },
  passTop: {
    padding: Spacing.four,
    gap: Spacing.half,
  },
  passKicker: {
    color: OnBrand,
    opacity: 0.8,
    letterSpacing: 2,
  },
  passTitle: {
    color: OnBrand,
  },
  passBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.four,
    padding: Spacing.four,
  },
  qrBox: {
    padding: Spacing.two,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  passInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  status: {
    color: Brand,
    marginTop: Spacing.one,
  },
  sectionHeading: {
    marginTop: Spacing.four,
  },
  merchTop: {
    padding: Spacing.four,
    paddingBottom: 0,
    gap: Spacing.half,
  },
  merchKicker: {
    color: Brand,
    letterSpacing: 2,
  },
});
