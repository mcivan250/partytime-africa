import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Gold, MaxContentWidth, OnBrand, Spacing, StateGo, StateMaybe } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type EventRow = Pick<
  Tables<'events'>,
  | 'id'
  | 'slug'
  | 'title'
  | 'starts_at'
  | 'timezone'
  | 'currency'
  | 'host_id'
  | 'is_ticketed'
  | 'promoter_bps'
>;
type Tier = Pick<Tables<'ticket_tiers'>, 'name' | 'sold' | 'quantity' | 'price_minor' | 'currency'>;
type TableRow = Pick<Tables<'venue_tables'>, 'price_minor' | 'status'>;
type Rsvp = Pick<Tables<'rsvps'>, 'guest_name' | 'status' | 'plus_ones'>;
type MerchPickup = Pick<Tables<'merch_purchases'>, 'id' | 'buyer_name' | 'quantity' | 'status'> & {
  merch_items: { name: string; price_minor: number } | null;
  merch_variants: { label: string } | null;
};
type Leader = { promoter_name: string; tickets_sold: number; earned_minor: number };

const STATUS_EMOJI: Record<Rsvp['status'], string> = { going: '🔥', maybe: '🤔', declined: '😢' };

function StatTile({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <ThemedView type="backgroundElement" style={styles.tile}>
      <ThemedText
        type="title"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={[styles.tileNumber, color ? { color } : null]}>
        {value}
      </ThemedText>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.tileLabel}>
        {label}
      </ThemedText>
    </ThemedView>
  );
}

export default function ManageEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const theme = useTheme();
  const { session } = useAuth();
  const [event, setEvent] = useState<EventRow | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [merch, setMerch] = useState<MerchPickup[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [ticketStatuses, setTicketStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [blast, setBlast] = useState('');
  const [blastBusy, setBlastBusy] = useState(false);
  const [blastResult, setBlastResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: ev } = await supabase
      .from('events')
      .select('id, slug, title, starts_at, timezone, currency, host_id, is_ticketed, promoter_bps')
      .eq('id', eventId)
      .maybeSingle();
    setEvent(ev);
    if (ev) {
      const [tiersRes, tablesRes, merchRes, rsvpRes, ticketRes] = await Promise.all([
        supabase.from('ticket_tiers').select('name, sold, quantity, price_minor, currency').eq('event_id', ev.id).order('position'),
        supabase.from('venue_tables').select('price_minor, status').eq('event_id', ev.id),
        supabase
          .from('merch_purchases')
          .select('id, buyer_name, quantity, status, merch_items(name, price_minor), merch_variants(label)')
          .eq('event_id', ev.id)
          .order('created_at', { ascending: false }),
        supabase.from('rsvps').select('guest_name, status, plus_ones').eq('event_id', ev.id).order('created_at', { ascending: false }),
        supabase.from('tickets').select('status').eq('event_id', ev.id),
      ]);
      setTiers(tiersRes.data ?? []);
      setTables(tablesRes.data ?? []);
      setMerch((merchRes.data ?? []) as unknown as MerchPickup[]);
      setRsvps(rsvpRes.data ?? []);
      setTicketStatuses((ticketRes.data ?? []).map((t) => t.status));

      const { data: board } = await supabase.rpc('event_promoter_leaderboard', { p_event_id: ev.id });
      setLeaders(
        (board ?? [])
          .map((b) => ({
            promoter_name: b.promoter_name,
            tickets_sold: Number(b.tickets_sold),
            earned_minor: Number(b.earned_minor),
          }))
          .filter((b) => b.tickets_sold > 0),
      );
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const sendBlast = async () => {
    if (!event || !blast.trim()) return;
    setBlastBusy(true);
    setBlastResult(null);
    const { data, error } = await supabase.functions.invoke('notify-guests', {
      body: { event_id: event.id, message: blast.trim(), audience: 'going' },
    });
    setBlastBusy(false);
    if (error || data?.error) {
      setBlastResult(data?.error || 'Could not send. SMS may not be set up yet.');
      return;
    }
    setBlast('');
    setBlastResult(data?.sent > 0 ? `Sent to ${data.sent} guest(s). 📣` : (data?.note ?? 'No guests with phone numbers yet.'));
  };

  const setRate = async (bps: number) => {
    if (!event) return;
    setEvent({ ...event, promoter_bps: bps });
    await supabase.rpc('set_promoter_rate', { p_event_id: event.id, p_bps: bps });
  };

  const markCollected = async (id: string) => {
    setMerch((prev) => prev.map((m) => (m.id === id ? { ...m, status: 'collected' } : m)));
    await supabase
      .from('merch_purchases')
      .update({ status: 'collected', collected_at: new Date().toISOString() })
      .eq('id', id);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }

  if (!event || (session && event.host_id !== session.user.id)) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>You don&apos;t manage this event.</ThemedText>
      </ThemedView>
    );
  }

  const going = rsvps.filter((r) => r.status === 'going').length;
  const maybe = rsvps.filter((r) => r.status === 'maybe').length;
  const sold = tiers.reduce((n, t) => n + t.sold, 0);
  const bookedTables = tables.filter((t) => t.status === 'booked');
  const tableRevenueMinor = bookedTables.reduce((n, t) => n + t.price_minor, 0);
  const merchUnits = merch.reduce((n, m) => n + m.quantity, 0);
  const merchRevenueMinor = merch.reduce((n, m) => n + m.quantity * (m.merch_items?.price_minor ?? 0), 0);
  const merchCollected = merch.filter((m) => m.status === 'collected').length;
  const revenueMinor =
    tiers.reduce((n, t) => n + t.sold * t.price_minor, 0) + tableRevenueMinor + merchRevenueMinor;
  const checkedIn = ticketStatuses.filter((s) => s === 'checked_in').length;
  const hasSales = event.is_ticketed || tables.length > 0 || merch.length > 0;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <ThemedText type="title">{event.title}</ThemedText>
        <Pressable onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: event.slug } })}>
          <ThemedText type="link">View public event page →</ThemedText>
        </Pressable>

        <View style={styles.tileGrid}>
          <StatTile value={String(going)} label="GOING" color={StateGo} />
          <StatTile value={String(maybe)} label="MAYBE" color={StateMaybe} />
          {event.is_ticketed ? (
            <>
              <StatTile value={String(sold)} label="TICKETS SOLD" />
              <StatTile value={`${checkedIn}/${ticketStatuses.length}`} label="CHECKED IN" />
            </>
          ) : null}
          {tables.length > 0 ? (
            <StatTile value={`${bookedTables.length}/${tables.length}`} label="TABLES BOOKED" />
          ) : null}
          {merch.length > 0 ? (
            <StatTile value={`${merchCollected}/${merchUnits}`} label="MERCH COLLECTED" />
          ) : null}
          {hasSales ? (
            <StatTile value={formatMoney(revenueMinor, event.currency)} label="REVENUE" color={Gold} />
          ) : null}
        </View>

        {event.is_ticketed ? (
          <Pressable
            style={styles.scanButton}
            onPress={() => router.push({ pathname: '/check-in/[eventId]', params: { eventId: event.id } })}>
            <ThemedText type="smallBold" style={styles.onBrand}>
              🎫 Scan tickets at the door
            </ThemedText>
          </Pressable>
        ) : null}

        {event.is_ticketed && tiers.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.headingRow}>
              <View style={styles.headingBar} />
              <ThemedText type="subtitle">Ticket sales</ThemedText>
            </View>
            {tiers.map((t, i) => (
              <View key={`${t.name}-${i}`} style={styles.tierRow}>
                <ThemedText type="smallBold" style={styles.flex}>
                  {t.name}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {t.sold}/{t.quantity} · {formatMoney(t.sold * t.price_minor, t.currency)}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}

        {merch.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.headingRow}>
              <View style={styles.headingBar} />
              <ThemedText type="subtitle">Merch pickups ({merchCollected}/{merchUnits})</ThemedText>
            </View>
            {merch.map((m) => {
              const collected = m.status === 'collected';
              const size =
                m.merch_variants?.label && m.merch_variants.label !== 'One size'
                  ? ` · ${m.merch_variants.label}`
                  : '';
              return (
                <View key={m.id} style={styles.tierRow}>
                  <View style={styles.flex}>
                    <ThemedText type="smallBold">
                      {m.buyer_name}
                      {m.quantity > 1 ? ` ×${m.quantity}` : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {m.merch_items?.name ?? 'Item'}
                      {size}
                    </ThemedText>
                  </View>
                  {collected ? (
                    <ThemedText type="smallBold" style={{ color: StateGo }}>
                      ✓ Collected
                    </ThemedText>
                  ) : (
                    <Pressable style={styles.collectButton} onPress={() => markCollected(m.id)}>
                      <ThemedText type="smallBold" style={styles.onBrand}>
                        Mark collected
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              );
            })}
          </ThemedView>
        ) : null}

        <ThemedView type="backgroundElement" style={styles.card}>
          <View style={styles.headingRow}>
            <View style={styles.headingBar} />
            <ThemedText type="subtitle">Promoter payouts</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary">
            Pay guests a cut to promote your event — they share their link, you sell out. Set the
            commission per ticket sold.
          </ThemedText>
          <View style={styles.rateRow}>
            {[0, 500, 1000, 1500, 2000].map((bps) => {
              const on = event.promoter_bps === bps;
              return (
                <Pressable
                  key={bps}
                  onPress={() => setRate(bps)}
                  style={[styles.rateChip, on && styles.rateChipOn]}>
                  <ThemedText type="smallBold" style={on ? styles.onBrand : undefined}>
                    {bps === 0 ? 'Off' : `${bps / 100}%`}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </ThemedView>

        {leaders.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.headingRow}>
              <View style={styles.headingBar} />
              <ThemedText type="subtitle">Top promoters</ThemedText>
            </View>
            {leaders.map((l, i) => (
              <View key={`${l.promoter_name}-${i}`} style={styles.tierRow}>
                <ThemedText type="smallBold" style={styles.rank}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </ThemedText>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{l.promoter_name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {l.tickets_sold} sold
                  </ThemedText>
                </View>
                <ThemedText type="smallBold" style={styles.leaderEarned}>
                  {formatMoney(l.earned_minor, event.currency)}
                </ThemedText>
              </View>
            ))}
          </ThemedView>
        ) : null}

        <ThemedView type="backgroundElement" style={styles.card}>
          <SectionLabel>TEXT YOUR GUESTS</SectionLabel>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
            placeholder="e.g. Doors at 6 — don't be late!"
            placeholderTextColor={theme.textSecondary}
            value={blast}
            onChangeText={setBlast}
            multiline
          />
          <Pressable
            style={[styles.blastButton, { opacity: blastBusy || !blast.trim() ? 0.5 : 1 }]}
            disabled={blastBusy || !blast.trim()}
            onPress={sendBlast}>
            <ThemedText type="smallBold" style={styles.onState}>
              Send SMS to everyone going
            </ThemedText>
          </Pressable>
          {blastResult ? (
            <ThemedText type="small" themeColor="textSecondary">
              {blastResult}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Guest list ({rsvps.length})</ThemedText>
          {rsvps.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No RSVPs yet. Share the event to get people on the list.
            </ThemedText>
          ) : (
            rsvps.map((g, i) => (
              <View key={`${g.guest_name}-${i}`} style={styles.guestRow}>
                <ThemedText type="small">{STATUS_EMOJI[g.status]}</ThemedText>
                <ThemedText type="smallBold" style={styles.flex}>
                  {g.guest_name}
                  {g.plus_ones > 0 ? ` +${g.plus_ones}` : ''}
                </ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {g.status}
                </ThemedText>
              </View>
            ))
          )}
        </ThemedView>
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
  tileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    minWidth: 100,
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  tileNumber: {
    fontSize: 26,
    lineHeight: 30,
  },
  tileLabel: {
    letterSpacing: 1,
  },
  scanButton: {
    backgroundColor: Brand,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  onBrand: { color: OnBrand },
  rateRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  rateChip: {
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  rateChipOn: {
    backgroundColor: Brand,
    borderColor: 'transparent',
  },
  rank: {
    width: 28,
  },
  leaderEarned: {
    color: Gold,
  },
  onState: { color: OnBrand },
  card: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  headingBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: Brand,
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  collectButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  flex: { flex: 1 },
  input: {
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  blastButton: {
    backgroundColor: StateGo,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
});
