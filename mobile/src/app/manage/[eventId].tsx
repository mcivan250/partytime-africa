import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

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
type Tier = Pick<Tables<'ticket_tiers'>, 'id' | 'name' | 'sold' | 'quantity' | 'price_minor' | 'currency'>;
type TableRow = Pick<Tables<'venue_tables'>, 'price_minor' | 'status'>;
type Guest = {
  rsvp_id: string;
  profile_id: string | null;
  guest_name: string;
  guest_phone: string | null;
  status: 'going' | 'maybe' | 'declined';
  plus_ones: number;
  avatar_url: string | null;
  username: string | null;
  created_at: string;
  plus_one_names: string[];
};
type MyEvent = { id: string; title: string; starts_at: string | null };
type MerchPickup = Pick<Tables<'merch_purchases'>, 'id' | 'buyer_name' | 'quantity' | 'status'> & {
  merch_items: { name: string; price_minor: number } | null;
  merch_variants: { label: string } | null;
};
type Leader = { promoter_name: string; tickets_sold: number; earned_minor: number };
type Cohost = { profile_id: string; name: string; status: string };

const STATUS_EMOJI: Record<Guest['status'], string> = { going: '🔥', maybe: '🤔', declined: '😢' };

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
  const [cohosts, setCohosts] = useState<Cohost[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [myEvents, setMyEvents] = useState<MyEvent[]>([]);
  const [reinviteBusy, setReinviteBusy] = useState<string | null>(null);
  const [reinviteNote, setReinviteNote] = useState<string | null>(null);
  const [ticketStatuses, setTicketStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [blast, setBlast] = useState('');
  const [blastBusy, setBlastBusy] = useState(false);
  const [blastResult, setBlastResult] = useState<string | null>(null);
  const [editTierId, setEditTierId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState('');
  const [savingTier, setSavingTier] = useState(false);

  const load = useCallback(async () => {
    const { data: ev } = await supabase
      .from('events')
      .select('id, slug, title, starts_at, timezone, currency, host_id, is_ticketed, promoter_bps')
      .eq('id', eventId)
      .maybeSingle();
    setEvent(ev);
    if (ev) {
      const [tiersRes, tablesRes, merchRes, guestRes, ticketRes, myEventsRes] = await Promise.all([
        supabase.from('ticket_tiers').select('id, name, sold, quantity, price_minor, currency').eq('event_id', ev.id).order('position'),
        supabase.from('venue_tables').select('price_minor, status').eq('event_id', ev.id),
        supabase
          .from('merch_purchases')
          .select('id, buyer_name, quantity, status, merch_items(name, price_minor), merch_variants(label)')
          .eq('event_id', ev.id)
          .order('created_at', { ascending: false }),
        supabase.rpc('host_guest_list', { p_event_id: ev.id }),
        supabase.from('tickets').select('status').eq('event_id', ev.id),
        supabase
          .from('events')
          .select('id, title, starts_at')
          .eq('host_id', ev.host_id)
          .neq('id', ev.id)
          .order('starts_at', { ascending: false }),
      ]);
      setTiers(tiersRes.data ?? []);
      setTables(tablesRes.data ?? []);
      setMerch((merchRes.data ?? []) as unknown as MerchPickup[]);
      setGuests((guestRes.data ?? []) as Guest[]);
      setMyEvents((myEventsRes.data ?? []) as MyEvent[]);
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

      const { data: chs } = await supabase.rpc('event_cohosts', { p_event_id: ev.id });
      setCohosts((chs ?? []) as Cohost[]);
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
      setBlastResult(data?.error || 'Could not send — please try again.');
      return;
    }
    setBlast('');
    setBlastResult(data?.note ?? 'Message sent. 📣');
  };

  const startEditTier = (t: Tier) => {
    setEditTierId(t.id);
    setEditQty(String(t.quantity));
  };

  const saveTierQty = async (t: Tier) => {
    const next = Math.trunc(Number(editQty));
    if (!Number.isFinite(next) || next < 1) return;
    if (next < t.sold) {
      setBlastResult(`Can't set below ${t.sold} — that many are already sold.`);
      return;
    }
    setSavingTier(true);
    const { error } = await supabase.from('ticket_tiers').update({ quantity: next }).eq('id', t.id);
    setSavingTier(false);
    if (error) {
      setBlastResult(error.message);
      return;
    }
    setTiers((prev) => prev.map((x) => (x.id === t.id ? { ...x, quantity: next } : x)));
    setEditTierId(null);
  };

  const respondCohost = async (profileId: string, accept: boolean) => {
    setCohosts((prev) =>
      accept
        ? prev.map((c) => (c.profile_id === profileId ? { ...c, status: 'accepted' } : c))
        : prev.filter((c) => c.profile_id !== profileId),
    );
    await supabase.rpc('respond_cohost', {
      p_event_id: eventId,
      p_profile_id: profileId,
      p_accept: accept,
    });
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

  const reinviteTo = async (target: MyEvent) => {
    if (!event) return;
    setReinviteBusy(target.id);
    setReinviteNote(null);
    const { data, error } = await supabase.rpc('invite_past_guests', {
      p_source_event: event.id,
      p_target_event: target.id,
    });
    setReinviteBusy(null);
    if (error) {
      setReinviteNote(error.message);
      return;
    }
    const res = data as { notified: number; skipped: number };
    const parts = [`Invited ${res.notified} guest${res.notified === 1 ? '' : 's'} to “${target.title}”.`];
    if (res.skipped > 0) {
      parts.push(`${res.skipped} phone-only guest${res.skipped === 1 ? '' : 's'} couldn't be reached in-app.`);
    }
    setReinviteNote(parts.join(' '));
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

  const going = guests.filter((r) => r.status === 'going').length;
  const maybe = guests.filter((r) => r.status === 'maybe').length;
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
            {tiers.map((t) => (
              <View key={t.id} style={styles.tierRow}>
                <ThemedText type="smallBold" style={styles.flex}>
                  {t.name}
                </ThemedText>
                {editTierId === t.id ? (
                  <View style={styles.tierEditRow}>
                    <TextInput
                      style={[styles.qtyInput, { color: theme.text, backgroundColor: theme.background }]}
                      value={editQty}
                      onChangeText={setEditQty}
                      keyboardType="number-pad"
                      autoFocus
                    />
                    <Pressable
                      style={[styles.qtyBtn, styles.qtySave, { opacity: savingTier ? 0.5 : 1 }]}
                      disabled={savingTier}
                      onPress={() => saveTierQty(t)}>
                      <ThemedText type="smallBold" style={styles.qtySaveText}>
                        Save
                      </ThemedText>
                    </Pressable>
                    <Pressable style={styles.qtyBtn} onPress={() => setEditTierId(null)}>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        Cancel
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.tierEditRow} onPress={() => startEditTier(t)} hitSlop={6}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {t.sold}/{t.quantity} · {formatMoney(t.sold * t.price_minor, t.currency)}
                    </ThemedText>
                    <ThemedText type="smallBold" style={styles.editLink}>
                      Edit
                    </ThemedText>
                  </Pressable>
                )}
              </View>
            ))}
            <ThemedText type="small" themeColor="textSecondary" style={styles.tierHint}>
              Tap “Edit” to add or reduce tickets on a tier. You can&apos;t go below the number already sold.
            </ThemedText>
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

        {cohosts.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.headingRow}>
              <View style={styles.headingBar} />
              <ThemedText type="subtitle">Co-hosts</ThemedText>
            </View>
            {cohosts.map((c) => (
              <View key={c.profile_id} style={styles.tierRow}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{c.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {c.status === 'requested' ? 'wants to co-host' : 'co-host'}
                  </ThemedText>
                </View>
                {c.status === 'requested' ? (
                  <View style={styles.cohostActions}>
                    <Pressable style={styles.acceptBtn} onPress={() => respondCohost(c.profile_id, true)}>
                      <ThemedText type="smallBold" style={styles.onBrand}>
                        Accept
                      </ThemedText>
                    </Pressable>
                    <Pressable style={styles.refuseBtn} onPress={() => respondCohost(c.profile_id, false)}>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        Refuse
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <ThemedText type="smallBold" style={{ color: StateGo }}>
                    ✓
                  </ThemedText>
                )}
              </View>
            ))}
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
          <SectionLabel>MESSAGE YOUR GUESTS</SectionLabel>
          <ThemedText type="small" themeColor="textSecondary">
            Everyone going gets it in their notifications (and by SMS if set up).
          </ThemedText>
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
              Send to everyone going
            </ThemedText>
          </Pressable>
          {blastResult ? (
            <ThemedText type="small" themeColor="textSecondary">
              {blastResult}
            </ThemedText>
          ) : null}
        </ThemedView>

        <ThemedView type="backgroundElement" style={styles.card}>
          <ThemedText type="subtitle">Guest list ({guests.length})</ThemedText>
          {guests.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              No RSVPs yet. Share the event to get people on the list.
            </ThemedText>
          ) : (
            guests.map((g) => (
              <View key={g.rsvp_id} style={styles.guestBlock}>
                <View style={styles.guestRow}>
                  {g.avatar_url ? (
                    <Image source={{ uri: g.avatar_url }} style={styles.guestAvatar} contentFit="cover" />
                  ) : (
                    <View style={[styles.guestAvatar, styles.guestAvatarFallback]}>
                      <ThemedText type="smallBold">{g.guest_name.slice(0, 1).toUpperCase()}</ThemedText>
                    </View>
                  )}
                  <View style={styles.flex}>
                    <ThemedText type="smallBold">
                      {STATUS_EMOJI[g.status]} {g.guest_name}
                      {g.plus_ones > 0 ? ` +${g.plus_ones}` : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {g.username ? `@${g.username}` : g.profile_id ? 'Member' : 'Guest'}
                      {' · '}
                      {g.status}
                    </ThemedText>
                  </View>
                  {g.guest_phone ? (
                    <Pressable
                      style={styles.callBtn}
                      onPress={() => Linking.openURL(`tel:${g.guest_phone}`)}>
                      <ThemedText type="smallBold" style={styles.callBtnText}>
                        📞 {g.guest_phone}
                      </ThemedText>
                    </Pressable>
                  ) : null}
                </View>
                {g.plus_one_names.length > 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.plusNames}>
                    Bringing: {g.plus_one_names.join(', ')}
                  </ThemedText>
                ) : null}
              </View>
            ))
          )}
        </ThemedView>

        {myEvents.length > 0 && guests.length > 0 ? (
          <ThemedView type="backgroundElement" style={styles.card}>
            <View style={styles.headingRow}>
              <View style={styles.headingBar} />
              <ThemedText type="subtitle">Invite these guests to another event</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary">
              Send everyone who came to a notification for one of your other events. Members with an
              account get it instantly.
            </ThemedText>
            {myEvents.map((ev) => (
              <View key={ev.id} style={styles.tierRow}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{ev.title}</ThemedText>
                  {ev.starts_at ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {new Date(ev.starts_at).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </ThemedText>
                  ) : null}
                </View>
                <Pressable
                  style={[styles.inviteBtn, { opacity: reinviteBusy === ev.id ? 0.5 : 1 }]}
                  disabled={reinviteBusy === ev.id}
                  onPress={() => reinviteTo(ev)}>
                  <ThemedText type="smallBold" style={styles.onBrand}>
                    {reinviteBusy === ev.id ? 'Sending…' : 'Invite'}
                  </ThemedText>
                </Pressable>
              </View>
            ))}
            {reinviteNote ? (
              <ThemedText type="small" themeColor="textSecondary">
                {reinviteNote}
              </ThemedText>
            ) : null}
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
  cohostActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  acceptBtn: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  refuseBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
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
  tierEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  editLink: { color: StateGo },
  qtyInput: {
    borderRadius: 10,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    minWidth: 64,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  qtyBtn: { paddingVertical: Spacing.one, paddingHorizontal: Spacing.two, borderRadius: 999 },
  qtySave: { backgroundColor: Brand },
  qtySaveText: { color: OnBrand },
  tierHint: { marginTop: Spacing.two, lineHeight: 18 },
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
  guestBlock: {
    paddingVertical: Spacing.two,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    gap: Spacing.one,
  },
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  guestAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  guestAvatarFallback: {
    backgroundColor: '#243527',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusNames: {
    marginLeft: 38 + Spacing.three,
    lineHeight: 18,
  },
  callBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  callBtnText: { color: StateGo },
  inviteBtn: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
});
