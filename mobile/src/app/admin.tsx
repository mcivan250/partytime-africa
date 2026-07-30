import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { tapSuccess } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/money';
import { pickImage, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

type Member = { id: string; name: string; city: string | null; suspended: boolean; created_at: string };
type Post = { id: string; author_name: string; body: string; image_path: string | null; created_at: string };
type Venue = { id: string; name: string; kind: string; city: string | null; cover_url: string | null };
type Reservation = {
  id: string;
  venue_name: string;
  guest_name: string;
  party_size: number;
  reserved_for: string;
  note: string | null;
  status: string;
};
type Claim = { id: string; venue_name: string; claimant: string; note: string | null };
type Payout = {
  id: string;
  promoter: string;
  amount_minor: number;
  currency: string;
  destination: string;
  status: string;
  created_at: string;
};

type FunnelRow = { name: string; events: number; users: number };
type TabKey = 'analytics' | 'bookings' | 'payouts' | 'members' | 'content' | 'venues';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'analytics', label: 'Analytics' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'members', label: 'Members' },
  { key: 'content', label: 'Content' },
  { key: 'venues', label: 'Venues' },
];

// Readable labels + funnel order for the tracked events.
const FUNNEL_LABEL: Record<string, string> = {
  app_open: 'App opens',
  event_view: 'Event views',
  sign_up: 'Sign-ups',
  rsvp: 'RSVPs',
  checkout_start: 'Checkouts started',
  promote_share: 'Promoter shares',
  reservation_request: 'Table requests',
  payout_request: 'Payout requests',
};
const FUNNEL_ORDER = [
  'app_open',
  'event_view',
  'sign_up',
  'rsvp',
  'checkout_start',
  'promote_share',
  'reservation_request',
  'payout_request',
];

const VENUE_KINDS = ['bar', 'restaurant', 'club', 'lounge'];

export default function AdminScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<TabKey>('analytics');
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [funnelDays, setFunnelDays] = useState(7);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  // New-venue form.
  const [vName, setVName] = useState('');
  const [vKind, setVKind] = useState('bar');
  const [vCity, setVCity] = useState('Kampala');
  const [vAddress, setVAddress] = useState('');
  const [vDesc, setVDesc] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [mRes, pRes, vRes, rRes] = await Promise.all([
      supabase.rpc('admin_members'),
      supabase.rpc('admin_recent_posts'),
      supabase.from('venues').select('id, name, kind, city, cover_url').order('name'),
      supabase.rpc('admin_list_reservations'),
    ]);
    if (mRes.error && pRes.error) {
      setDenied(true);
    } else {
      setMembers((mRes.data ?? []) as Member[]);
      setPosts((pRes.data ?? []) as Post[]);
      setVenues((vRes.data ?? []) as Venue[]);
      setReservations((rRes.data ?? []) as Reservation[]);
      const [{ data: cRows }, { data: payRows }] = await Promise.all([
        supabase.rpc('admin_list_claims'),
        supabase.rpc('admin_list_promoter_payouts'),
      ]);
      setClaims((cRows ?? []) as Claim[]);
      setPayouts((payRows ?? []) as Payout[]);
    }
    setLoading(false);
  }, []);

  const loadFunnel = useCallback(async (days: number) => {
    const { data } = await supabase.rpc('admin_funnel', { p_days: days });
    setFunnel((data ?? []) as FunnelRow[]);
  }, []);

  useEffect(() => {
    if (session) loadFunnel(funnelDays);
  }, [session, funnelDays, loadFunnel]);

  const markPayout = async (p: Payout, status: 'processing' | 'paid' | 'failed') => {
    setPayouts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status } : x)));
    const { error } = await supabase.rpc('admin_mark_promoter_payout', { p_id: p.id, p_status: status });
    if (error) {
      Alert.alert('Could not update', error.message);
      setPayouts((prev) => prev.map((x) => (x.id === p.id ? { ...x, status: p.status } : x)));
      return;
    }
    tapSuccess();
  };

  const resolveClaim = async (c: Claim, approve: boolean) => {
    setClaims((prev) => prev.filter((x) => x.id !== c.id));
    const { error } = await supabase.rpc('admin_resolve_claim', { p_id: c.id, p_approve: approve });
    if (error) {
      Alert.alert('Could not update', error.message);
      load();
      return;
    }
    tapSuccess();
    if (approve) load();
  };

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  const toggleSuspend = async (m: Member) => {
    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, suspended: !x.suspended } : x)));
    await supabase.rpc('admin_set_suspended', { p_id: m.id, p_suspended: !m.suspended });
  };

  const removePost = async (p: Post) => {
    setPosts((prev) => prev.filter((x) => x.id !== p.id));
    await supabase.rpc('admin_delete_post', { p_id: p.id });
  };

  const createVenue = async () => {
    if (!vName.trim()) {
      Alert.alert('Name required', 'Give the venue a name first.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase.rpc('admin_create_venue', {
      p_name: vName.trim(),
      p_kind: vKind,
      p_city: vCity.trim() || 'Kampala',
      p_address: vAddress.trim(),
      p_description: vDesc.trim(),
      p_phone: vPhone.trim(),
    });
    setSaving(false);
    if (error) {
      Alert.alert('Could not add venue', error.message);
      return;
    }
    tapSuccess();
    setVenues((prev) =>
      [
        ...prev,
        {
          id: (data as string) ?? Math.random().toString(),
          name: vName.trim(),
          kind: vKind,
          city: vCity.trim() || 'Kampala',
          cover_url: null,
        },
      ].sort((a, b) => a.name.localeCompare(b.name)),
    );
    setVName('');
    setVAddress('');
    setVDesc('');
    setVPhone('');
  };

  const setCover = async (v: Venue) => {
    try {
      const picked = await pickImage([16, 9]);
      if (!picked) return;
      setUploadingId(v.id);
      const { url } = await uploadImage('venue-covers', v.id, picked);
      const { error } = await supabase.rpc('admin_set_venue_cover', { p_id: v.id, p_cover_url: url });
      if (error) throw error;
      setVenues((prev) => prev.map((x) => (x.id === v.id ? { ...x, cover_url: url } : x)));
      tapSuccess();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not set the photo.');
    } finally {
      setUploadingId(null);
    }
  };

  const setReservation = async (r: Reservation, status: 'confirmed' | 'declined') => {
    setReservations((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
    const { error } = await supabase.rpc('admin_set_reservation_status', { p_id: r.id, p_status: status });
    if (error) {
      Alert.alert('Could not update', error.message);
      setReservations((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: r.status } : x)));
      return;
    }
    tapSuccess();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }
  if (denied) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Admins only.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.segmentWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.segment}>
          {TABS.map((t) => (
            <Pressable key={t.key} style={[styles.segItem, tab === t.key && styles.segOn]} onPress={() => setTab(t.key)}>
              <ThemedText type="smallBold" numberOfLines={1} style={tab === t.key ? styles.segOnText : styles.segText}>
                {t.label}
                {t.key === 'payouts' && payouts.some((p) => p.status === 'requested') ? ' •' : ''}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'analytics' ? (
          (() => {
            const byName = new Map(funnel.map((f) => [f.name, f]));
            const rows = FUNNEL_ORDER.map((n) => ({
              name: n,
              label: FUNNEL_LABEL[n] ?? n,
              events: byName.get(n)?.events ?? 0,
              users: byName.get(n)?.users ?? 0,
            }));
            const max = Math.max(1, ...rows.map((r) => r.events));
            const anyData = rows.some((r) => r.events > 0);
            return (
              <>
                <View style={styles.dayRow}>
                  {[7, 30, 90].map((d) => (
                    <Pressable
                      key={d}
                      style={[styles.dayChip, funnelDays === d && styles.dayChipOn]}
                      onPress={() => setFunnelDays(d)}>
                      <ThemedText type="small" style={funnelDays === d ? styles.segOnText : styles.segText}>
                        {d}d
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
                {!anyData ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                    No activity tracked yet in this window. Once people use the app, your funnel — opens,
                    views, sign-ups, RSVPs, checkouts, shares — shows up here.
                  </ThemedText>
                ) : (
                  rows.map((r) => (
                    <ThemedView key={r.name} type="backgroundElement" style={styles.funnelCard}>
                      <View style={styles.funnelTop}>
                        <ThemedText type="smallBold">{r.label}</ThemedText>
                        <ThemedText type="smallBold" style={styles.funnelNum}>
                          {r.events}
                          <ThemedText type="small" themeColor="textSecondary">
                            {'  '}· {r.users} {r.users === 1 ? 'user' : 'users'}
                          </ThemedText>
                        </ThemedText>
                      </View>
                      <View style={styles.barTrack}>
                        <View style={[styles.barFill, { width: `${Math.round((r.events / max) * 100)}%` }]} />
                      </View>
                    </ThemedView>
                  ))
                )}
              </>
            );
          })()
        ) : tab === 'bookings' ? (
          reservations.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              No table requests yet. When guests reserve a table, they&apos;ll show up here to confirm.
            </ThemedText>
          ) : (
            reservations.map((r) => {
              const pending = r.status === 'requested';
              return (
                <ThemedView key={r.id} type="backgroundElement" style={styles.bookingCard}>
                  <View style={styles.bookingTop}>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{r.venue_name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {r.guest_name} · party of {r.party_size}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {new Date(r.reserved_for).toLocaleString(undefined, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </ThemedText>
                      {r.note ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.bookingNote}>
                          “{r.note}”
                        </ThemedText>
                      ) : null}
                    </View>
                    {!pending ? (
                      <View
                        style={[
                          styles.statusPill,
                          r.status === 'confirmed' ? styles.statusConfirmed : styles.statusDeclined,
                        ]}>
                        <ThemedText
                          type="small"
                          style={r.status === 'confirmed' ? styles.unsuspendText : styles.suspendText}>
                          {r.status === 'confirmed' ? 'Confirmed' : 'Declined'}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  {pending ? (
                    <View style={styles.bookingActions}>
                      <Pressable
                        style={[styles.actionBtn, styles.unsuspend, styles.flex]}
                        onPress={() => setReservation(r, 'confirmed')}>
                        <ThemedText type="smallBold" style={styles.unsuspendText}>
                          Confirm
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        style={[styles.actionBtn, styles.suspend, styles.flex]}
                        onPress={() => setReservation(r, 'declined')}>
                        <ThemedText type="smallBold" style={styles.suspendText}>
                          Decline
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : null}
                </ThemedView>
              );
            })
          )
        ) : tab === 'payouts' ? (
          payouts.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              No payout requests yet. When promoters cash out, requests land here to mark paid.
            </ThemedText>
          ) : (
            payouts.map((p) => {
              const open = p.status === 'requested' || p.status === 'processing';
              return (
                <ThemedView key={p.id} type="backgroundElement" style={styles.bookingCard}>
                  <View style={styles.bookingTop}>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{formatMoney(p.amount_minor, p.currency)}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {p.promoter} · {p.destination}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {new Date(p.created_at).toLocaleDateString()} · {p.status}
                      </ThemedText>
                    </View>
                    {!open ? (
                      <View
                        style={[
                          styles.statusPill,
                          p.status === 'paid' ? styles.statusConfirmed : styles.statusDeclined,
                        ]}>
                        <ThemedText
                          type="small"
                          style={p.status === 'paid' ? styles.unsuspendText : styles.suspendText}>
                          {p.status === 'paid' ? 'Paid' : 'Failed'}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  {open ? (
                    <View style={styles.bookingActions}>
                      <Pressable style={[styles.actionBtn, styles.unsuspend, styles.flex]} onPress={() => markPayout(p, 'paid')}>
                        <ThemedText type="smallBold" style={styles.unsuspendText}>
                          Mark paid
                        </ThemedText>
                      </Pressable>
                      {p.status === 'requested' ? (
                        <Pressable style={[styles.actionBtn, styles.processingBtn]} onPress={() => markPayout(p, 'processing')}>
                          <ThemedText type="smallBold" style={styles.processingText}>
                            Processing
                          </ThemedText>
                        </Pressable>
                      ) : null}
                      <Pressable style={[styles.actionBtn, styles.suspend]} onPress={() => markPayout(p, 'failed')}>
                        <ThemedText type="smallBold" style={styles.suspendText}>
                          Fail
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : null}
                </ThemedView>
              );
            })
          )
        ) : tab === 'venues' ? (
          <>
            {claims.length > 0 ? (
              <ThemedView type="backgroundElement" style={styles.formCard}>
                <ThemedText type="smallBold">Venue claims ({claims.length})</ThemedText>
                {claims.map((c) => (
                  <View key={c.id} style={styles.row}>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{c.venue_name}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {c.claimant}
                        {c.note ? ` · “${c.note}”` : ''}
                      </ThemedText>
                    </View>
                    <Pressable style={[styles.actionBtn, styles.unsuspend]} onPress={() => resolveClaim(c, true)}>
                      <ThemedText type="smallBold" style={styles.unsuspendText}>
                        Approve
                      </ThemedText>
                    </Pressable>
                    <Pressable style={[styles.actionBtn, styles.suspend]} onPress={() => resolveClaim(c, false)}>
                      <ThemedText type="smallBold" style={styles.suspendText}>
                        Decline
                      </ThemedText>
                    </Pressable>
                  </View>
                ))}
              </ThemedView>
            ) : null}
            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedText type="smallBold">Add a venue</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Name (e.g. The Alchemist)"
                placeholderTextColor="#66766A"
                value={vName}
                onChangeText={setVName}
              />
              <View style={styles.kindRow}>
                {VENUE_KINDS.map((k) => (
                  <Pressable
                    key={k}
                    style={[styles.kindChip, vKind === k && styles.kindChipOn]}
                    onPress={() => setVKind(k)}>
                    <ThemedText type="small" style={vKind === k ? styles.segOnText : styles.segText}>
                      {k}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              <View style={styles.formRow}>
                <TextInput
                  style={[styles.input, styles.flex]}
                  placeholder="City"
                  placeholderTextColor="#66766A"
                  value={vCity}
                  onChangeText={setVCity}
                />
                <TextInput
                  style={[styles.input, styles.flex]}
                  placeholder="Phone"
                  placeholderTextColor="#66766A"
                  value={vPhone}
                  onChangeText={setVPhone}
                  keyboardType="phone-pad"
                />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Address"
                placeholderTextColor="#66766A"
                value={vAddress}
                onChangeText={setVAddress}
              />
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Short description"
                placeholderTextColor="#66766A"
                value={vDesc}
                onChangeText={setVDesc}
                multiline
              />
              <Pressable
                style={[styles.saveBtn, saving && styles.disabled]}
                disabled={saving}
                onPress={createVenue}>
                {saving ? (
                  <ActivityIndicator color={OnBrand} />
                ) : (
                  <ThemedText type="smallBold" style={styles.segOnText}>
                    Add venue
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>

            {venues.map((v) => (
              <ThemedView key={v.id} type="backgroundElement" style={styles.row}>
                {v.cover_url ? (
                  <Image source={{ uri: v.cover_url }} style={styles.venueThumb} contentFit="cover" />
                ) : (
                  <View style={[styles.venueThumb, styles.venueThumbEmpty]}>
                    <ThemedText type="small" themeColor="textSecondary">
                      No photo
                    </ThemedText>
                  </View>
                )}
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{v.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {v.kind} · {v.city ?? 'Kampala'}
                  </ThemedText>
                </View>
                <Pressable
                  style={styles.photoBtn}
                  disabled={uploadingId === v.id}
                  onPress={() => setCover(v)}>
                  {uploadingId === v.id ? (
                    <ActivityIndicator color={Brand} />
                  ) : (
                    <ThemedText type="smallBold" style={styles.photoText}>
                      {v.cover_url ? 'Replace' : '📷 Photo'}
                    </ThemedText>
                  )}
                </Pressable>
              </ThemedView>
            ))}
          </>
        ) : tab === 'members'
          ? members.map((m) => (
              <ThemedView key={m.id} type="backgroundElement" style={styles.row}>
                <View style={styles.flex}>
                  <ThemedText type="smallBold">
                    {m.name}
                    {m.suspended ? '  🚫' : ''}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {m.city ?? 'Kampala'} · joined {new Date(m.created_at).toLocaleDateString()}
                  </ThemedText>
                </View>
                <Pressable
                  style={[styles.actionBtn, m.suspended ? styles.unsuspend : styles.suspend]}
                  onPress={() => toggleSuspend(m)}>
                  <ThemedText type="smallBold" style={m.suspended ? styles.unsuspendText : styles.suspendText}>
                    {m.suspended ? 'Reinstate' : 'Suspend'}
                  </ThemedText>
                </Pressable>
              </ThemedView>
            ))
          : posts.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                No feed posts yet.
              </ThemedText>
            ) : (
              posts.map((p) => (
                <ThemedView key={p.id} type="backgroundElement" style={styles.postCard}>
                  <ThemedText type="smallBold">{p.author_name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {p.body}
                    {p.image_path ? '  📷' : ''}
                  </ThemedText>
                  <Pressable style={styles.removeBtn} onPress={() => removePost(p)}>
                    <ThemedText type="smallBold" style={styles.removeText}>
                      Remove post
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ))
            )}
        <View style={styles.pad} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  segmentWrap: {
    marginHorizontal: Spacing.four,
    marginTop: Spacing.four,
    marginBottom: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#19231B',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segItem: { alignItems: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 999 },
  segOn: { backgroundColor: Brand },
  segText: { color: '#94A697' },
  segOnText: { color: OnBrand },
  content: {
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 16,
    padding: Spacing.three,
  },
  actionBtn: { borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, alignItems: 'center' },
  suspend: { backgroundColor: 'rgba(247,53,88,0.15)' },
  suspendText: { color: '#F73558' },
  unsuspend: { backgroundColor: 'rgba(61,220,151,0.15)' },
  unsuspendText: { color: StateGo },
  postCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  removeBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  removeText: { color: '#F73558' },
  empty: { textAlign: 'center', marginTop: Spacing.six },
  pad: { height: Spacing.six },
  formCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two, marginBottom: Spacing.two },
  formRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    backgroundColor: '#243527',
    borderRadius: 12,
    padding: Spacing.three,
    color: '#EFF6EE',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  multiline: { minHeight: 60 },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  kindChip: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  kindChipOn: { backgroundColor: Brand, borderColor: 'transparent' },
  saveBtn: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  disabled: { opacity: 0.6 },
  bookingCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  bookingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  bookingNote: { fontStyle: 'italic', marginTop: 2 },
  bookingActions: { flexDirection: 'row', gap: Spacing.two },
  statusPill: { borderRadius: 999, paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  statusConfirmed: { backgroundColor: 'rgba(61,220,151,0.15)' },
  statusDeclined: { backgroundColor: 'rgba(247,53,88,0.15)' },
  processingBtn: { backgroundColor: 'rgba(255,184,77,0.15)' },
  processingText: { color: '#FFB84D' },
  dayRow: { flexDirection: 'row', gap: Spacing.two, marginBottom: Spacing.one },
  dayChip: {
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  dayChipOn: { backgroundColor: Brand, borderColor: 'transparent' },
  funnelCard: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  funnelTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  funnelNum: { color: '#EFF6EE' },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: '#243527', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999, backgroundColor: Brand },
  venueThumb: { width: 52, height: 52, borderRadius: 12 },
  venueThumbEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#243527' },
  photoBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    minWidth: 72,
    alignItems: 'center',
  },
  photoText: { color: '#EFF6EE' },
});
