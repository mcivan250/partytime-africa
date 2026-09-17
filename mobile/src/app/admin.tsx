import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Platform, Pressable, ScrollView, Share, StyleSheet, TextInput, View } from 'react-native';

import { Appear } from '@/components/appear';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Coral, MaxContentWidth, OnBrand, Spacing, StateGo, StateMaybe } from '@/constants/theme';
import { tapSuccess } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/money';
import { pickImage, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

type Member = { id: string; name: string; city: string | null; suspended: boolean; created_at: string };
type Post = { id: string; author_name: string; body: string; image_path: string | null; created_at: string };
type Venue = {
  id: string;
  name: string;
  kind: string;
  city: string | null;
  cover_url: string | null;
  logo_url: string | null;
  menu_url: string | null;
};
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
type Report = {
  id: string;
  target_type: string;
  target_id: string | null;
  reason: string;
  note: string | null;
  status: string;
  created_at: string;
  reporter: string;
  target_owner: string;
  target_owner_id: string | null;
};
type EventPerf = {
  id: string;
  slug: string;
  title: string;
  starts_at: string | null;
  cover_url: string | null;
  featured: boolean;
  status: string;
  is_ticketed: boolean;
  views: number;
  checkouts: number;
  paid_orders: number;
  tickets_sold: number;
  gross_minor: number;
  currency: string;
};
type Campaign = {
  id: string;
  code: string;
  name: string;
  kind: string;
  event_id: string | null;
  event_slug: string | null;
  notes: string | null;
  active: boolean;
  created_at: string;
  scans: number;
  app_opens: number;
  signups: number;
  rsvps: number;
  checkouts: number;
};
type EventLite = { id: string; title: string };
type Readiness = {
  payments: { configured: boolean; mode: string; live: boolean };
  ai: { gemini: boolean; anthropic: boolean };
  otp: { whatsapp: boolean; sms: boolean; pepper: boolean };
  tickets: { qr_secret: boolean };
  reminders: { cron_secret: boolean };
  data: { upcoming_events: number; paid_last_30d: number; last_paid_at: string | null };
};
type TabKey = 'launch' | 'analytics' | 'events' | 'activations' | 'bookings' | 'payouts' | 'members' | 'content' | 'venues';
const TABS: { key: TabKey; label: string }[] = [
  { key: 'launch', label: 'Launch' },
  { key: 'analytics', label: 'Analytics' },
  { key: 'events', label: 'Events' },
  { key: 'activations', label: 'Activations' },
  { key: 'bookings', label: 'Bookings' },
  { key: 'payouts', label: 'Payouts' },
  { key: 'members', label: 'Members' },
  { key: 'content', label: 'Content' },
  { key: 'venues', label: 'Venues' },
];

const SITE = 'https://partytime.africa';
const CAMPAIGN_KINDS = ['popup', 'billboard', 'installation', 'launch', 'flyer', 'other'];

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

function statusColor(s: 'ok' | 'warn' | 'bad' | 'info') {
  return s === 'ok' ? StateGo : s === 'warn' ? StateMaybe : s === 'bad' ? Coral : '#8FA895';
}
function CheckRow({ label, sub, state }: { label: string; sub: string; state: 'ok' | 'warn' | 'bad' | 'info' }) {
  return (
    <ThemedView type="backgroundElement" style={styles.checkRow}>
      <View style={[styles.checkDot, { backgroundColor: statusColor(state) }]} />
      <View style={styles.flex}>
        <ThemedText type="smallBold">{label}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.checkSub}>
          {sub}
        </ThemedText>
      </View>
    </ThemedView>
  );
}

export default function AdminScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<TabKey>('launch');
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);
  const [funnel, setFunnel] = useState<FunnelRow[]>([]);
  const [funnelDays, setFunnelDays] = useState(7);
  const [perf, setPerf] = useState<EventPerf[]>([]);
  const [perfDays, setPerfDays] = useState(30);
  const [featuringId, setFeaturingId] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [linkEvents, setLinkEvents] = useState<EventLite[]>([]);
  const [cName, setCName] = useState('');
  const [cKind, setCKind] = useState('popup');
  const [cEventId, setCEventId] = useState<string | null>(null);
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
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
      supabase.from('venues').select('id, name, kind, city, cover_url, logo_url, menu_url').order('name'),
      supabase.rpc('admin_list_reservations'),
    ]);
    if (mRes.error && pRes.error) {
      setDenied(true);
    } else {
      setMembers((mRes.data ?? []) as Member[]);
      setPosts((pRes.data ?? []) as Post[]);
      setVenues((vRes.data ?? []) as Venue[]);
      setReservations((rRes.data ?? []) as Reservation[]);
      const [{ data: cRows }, { data: payRows }, { data: repRows }] = await Promise.all([
        supabase.rpc('admin_list_claims'),
        supabase.rpc('admin_list_promoter_payouts'),
        supabase.rpc('admin_list_reports'),
      ]);
      setClaims((cRows ?? []) as Claim[]);
      setPayouts((payRows ?? []) as Payout[]);
      setReports((repRows ?? []) as Report[]);
    }
    setLoading(false);
  }, []);

  const loadFunnel = useCallback(async (days: number) => {
    const { data } = await supabase.rpc('admin_funnel', { p_days: days });
    setFunnel((data ?? []) as FunnelRow[]);
  }, []);

  const loadPerf = useCallback(async (days: number) => {
    const { data } = await supabase.rpc('admin_event_performance', { p_days: days });
    setPerf((data ?? []) as EventPerf[]);
  }, []);

  const loadReadiness = useCallback(async () => {
    setReadinessLoading(true);
    const { data } = await supabase.functions.invoke('admin-readiness');
    setReadiness((data as Readiness | null) ?? null);
    setReadinessLoading(false);
  }, []);

  const loadCampaigns = useCallback(async () => {
    const now = new Date().toISOString();
    const [{ data: camps }, { data: evs }] = await Promise.all([
      supabase.rpc('admin_list_campaigns'),
      supabase
        .from('events')
        .select('id, title')
        .eq('status', 'published')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true })
        .limit(30),
    ]);
    setCampaigns((camps ?? []) as Campaign[]);
    setLinkEvents((evs ?? []) as EventLite[]);
  }, []);

  const createCampaign = async () => {
    if (!cName.trim()) {
      Alert.alert('Name it', 'Give the activation a name (e.g. "Acacia Mall pop-up").');
      return;
    }
    setCreatingCampaign(true);
    const { error } = await supabase.rpc('admin_create_campaign', {
      p_name: cName.trim(),
      p_kind: cKind,
      p_event_id: cEventId,
    });
    setCreatingCampaign(false);
    if (error) {
      Alert.alert('Could not create', error.message);
      return;
    }
    tapSuccess();
    setCName('');
    setCEventId(null);
    loadCampaigns();
  };

  const toggleCampaign = async (c: Campaign) => {
    const next = !c.active;
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: next } : x)));
    const { error } = await supabase.rpc('admin_set_campaign_active', { p_id: c.id, p_active: next });
    if (error) {
      setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: c.active } : x)));
      Alert.alert('Could not update', error.message);
      return;
    }
    tapSuccess();
  };

  const shareCampaign = async (c: Campaign) => {
    const url = `${SITE}/go/${c.code}`;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        Alert.alert('Link copied', url);
        return;
      } catch {
        // fall through to Share
      }
    }
    try {
      await Share.share({ message: `${c.name} — ${url}`, url });
    } catch {
      // user dismissed
    }
  };

  useEffect(() => {
    if (session) loadFunnel(funnelDays);
  }, [session, funnelDays, loadFunnel]);

  useEffect(() => {
    if (session) loadPerf(perfDays);
  }, [session, perfDays, loadPerf]);

  useEffect(() => {
    if (session) loadCampaigns();
  }, [session, loadCampaigns]);

  useEffect(() => {
    if (session) loadReadiness();
  }, [session, loadReadiness]);

  // Premium placement is the revenue lever: featuring an event pins it to the
  // top of Discover. Toggling it here is the paid-placement control.
  const toggleFeatured = async (e: EventPerf) => {
    const next = !e.featured;
    setFeaturingId(e.id);
    setPerf((prev) => prev.map((x) => (x.id === e.id ? { ...x, featured: next } : x)));
    const { error } = await supabase.rpc('admin_set_event_featured', { p_id: e.id, p_featured: next });
    setFeaturingId(null);
    if (error) {
      Alert.alert('Could not update placement', error.message);
      setPerf((prev) => prev.map((x) => (x.id === e.id ? { ...x, featured: e.featured } : x)));
      return;
    }
    tapSuccess();
  };

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

  const resolveReport = async (r: Report, status: 'reviewed' | 'actioned' | 'dismissed') => {
    setReports((prev) => prev.filter((x) => x.id !== r.id));
    const { error } = await supabase.rpc('admin_resolve_report', { p_id: r.id, p_status: status });
    if (error) {
      Alert.alert('Could not update', error.message);
      load();
      return;
    }
    tapSuccess();
  };

  const suspendReported = async (r: Report) => {
    if (!r.target_owner_id) return;
    await supabase.rpc('admin_set_suspended', { p_id: r.target_owner_id, p_suspended: true });
    resolveReport(r, 'actioned');
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
          logo_url: null,
          menu_url: null,
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

  const setLogo = async (v: Venue) => {
    try {
      const picked = await pickImage([1, 1]);
      if (!picked) return;
      setUploadingId(v.id);
      const { url } = await uploadImage('venue-covers', `${v.id}/logo`, picked);
      const { error } = await supabase.rpc('set_venue_logo', { p_id: v.id, p_logo_url: url });
      if (error) throw error;
      setVenues((prev) => prev.map((x) => (x.id === v.id ? { ...x, logo_url: url } : x)));
      tapSuccess();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not set the logo.');
    } finally {
      setUploadingId(null);
    }
  };

  const addPhoto = async (v: Venue) => {
    try {
      const picked = await pickImage([4, 3]);
      if (!picked) return;
      setUploadingId(v.id);
      const { url } = await uploadImage('venue-covers', `${v.id}/gallery`, picked);
      const { error } = await supabase.rpc('add_venue_photo', { p_venue_id: v.id, p_url: url });
      if (error) throw error;
      tapSuccess();
      Alert.alert('Photo added', 'It now shows in the venue’s gallery.');
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not add the photo.');
    } finally {
      setUploadingId(null);
    }
  };

  // Menus are uploaded as an image (a photo of the menu) — no crop.
  const setMenu = async (v: Venue) => {
    try {
      const picked = await pickImage([3, 4], false);
      if (!picked) return;
      setUploadingId(v.id);
      const { url } = await uploadImage('venue-covers', `${v.id}/menu`, picked);
      const { error } = await supabase.rpc('set_venue_menu', { p_id: v.id, p_menu_url: url });
      if (error) throw error;
      setVenues((prev) => prev.map((x) => (x.id === v.id ? { ...x, menu_url: url } : x)));
      tapSuccess();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not set the menu.');
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
                {t.key === 'content' && reports.length > 0 ? ' •' : ''}
              </ThemedText>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'launch' ? (
          readinessLoading && !readiness ? (
            <ActivityIndicator color={Brand} style={{ marginTop: Spacing.six }} />
          ) : !readiness ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Couldn&apos;t load the readiness check. Pull to refresh, or tap Re-check below.
            </ThemedText>
          ) : (
            (() => {
              const r = readiness;
              const paymentsState = r.payments.live ? 'ok' : r.payments.configured ? 'warn' : 'bad';
              const ready = r.payments.live && r.data.upcoming_events > 0 && (r.ai.gemini || r.ai.anthropic);
              const lastPaid = r.data.last_paid_at
                ? new Date(r.data.last_paid_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
                : null;
              return (
                <>
                  <ThemedView type="backgroundElement" style={[styles.launchHead, { borderColor: ready ? 'rgba(61,220,151,0.4)' : 'rgba(255,61,110,0.4)' }]}>
                    <ThemedText type="smallBold" style={{ color: ready ? StateGo : Coral }}>
                      {ready ? '● Ready to sell' : '● Not ready to sell yet'}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary" style={styles.checkSub}>
                      {ready
                        ? 'Payments are live, the AI is connected, and there are upcoming events.'
                        : 'Fix the red items below before taking real money.'}
                    </ThemedText>
                  </ThemedView>

                  <CheckRow
                    label="Payments (Pesapal)"
                    state={paymentsState}
                    sub={
                      !r.payments.configured
                        ? 'Keys missing — checkout will fail.'
                        : r.payments.live
                          ? 'Live — real mobile-money & card payments.'
                          : `Configured, but in ${r.payments.mode} mode. Switch PESAPAL_ENV to live to take real money.`
                    }
                  />
                  <CheckRow
                    label="AI concierge"
                    state={r.ai.gemini || r.ai.anthropic ? 'ok' : 'bad'}
                    sub={
                      r.ai.gemini
                        ? 'Gemini connected — Plan my night & Ops are live.'
                        : r.ai.anthropic
                          ? 'Anthropic connected.'
                          : 'No AI key set — Plan my night & Ops Copilot will fail.'
                    }
                  />
                  <CheckRow
                    label="Upcoming events"
                    state={r.data.upcoming_events > 0 ? 'ok' : 'bad'}
                    sub={
                      r.data.upcoming_events > 0
                        ? `${r.data.upcoming_events} upcoming public events in the feed.`
                        : 'No upcoming events — the feed is empty. Publish or seed events.'
                    }
                  />
                  <CheckRow
                    label="Ticket security"
                    state={r.tickets.qr_secret ? 'ok' : 'warn'}
                    sub={
                      r.tickets.qr_secret
                        ? 'Rotating QR secret set.'
                        : 'Using the service-role fallback. Set TICKET_QR_SECRET to isolate the signing key.'
                    }
                  />
                  <CheckRow
                    label="Guest phone verification (OTP)"
                    state={r.otp.whatsapp || r.otp.sms ? 'ok' : 'warn'}
                    sub={
                      r.otp.whatsapp
                        ? 'WhatsApp OTP ready.'
                        : r.otp.sms
                          ? 'SMS OTP (Africa’s Talking) ready.'
                          : 'Off — optional, but recommended before scaling.'
                    }
                  />
                  <CheckRow
                    label="Event reminders"
                    state={r.reminders.cron_secret ? 'ok' : 'warn'}
                    sub={r.reminders.cron_secret ? 'Reminder cron secured.' : 'CRON_SECRET not set — scheduled reminders may not run.'}
                  />
                  <CheckRow
                    label="Sales activity"
                    state="info"
                    sub={
                      lastPaid
                        ? `Last paid order ${lastPaid} · ${r.data.paid_last_30d} in the last 30 days.`
                        : 'No paid orders yet — run one real end-to-end test once payments are live.'
                    }
                  />

                  <Pressable style={[styles.saveBtn, readinessLoading && styles.disabled]} disabled={readinessLoading} onPress={loadReadiness}>
                    {readinessLoading ? (
                      <ActivityIndicator color={OnBrand} />
                    ) : (
                      <ThemedText type="smallBold" style={styles.segOnText}>
                        Re-check
                      </ThemedText>
                    )}
                  </Pressable>
                </>
              );
            })()
          )
        ) : tab === 'analytics' ? (
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
        ) : tab === 'events' ? (
          <>
            <View style={styles.dayRow}>
              {[7, 30, 90].map((d) => (
                <Pressable
                  key={d}
                  style={[styles.dayChip, perfDays === d && styles.dayChipOn]}
                  onPress={() => setPerfDays(d)}>
                  <ThemedText type="small" style={perfDays === d ? styles.segOnText : styles.segText}>
                    {d}d
                  </ThemedText>
                </Pressable>
              ))}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.perfHint}>
              Which events are landing — and who to give premium placement. Featuring pins an event to
              the top of Discover; sell that spot to promoters and advertisers.
            </ThemedText>
            {perf.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                No live or upcoming events to rank yet. Published events appear here with views, sales
                and conversion so you can spot winners and boost them.
              </ThemedText>
            ) : (
              perf.map((e, i) => {
                const conv = e.views > 0 ? Math.round((e.paid_orders / e.views) * 100) : 0;
                // Simple health read: momentum from attention + whether it's converting.
                const signal =
                  e.views >= 40 && (e.paid_orders > 0 || !e.is_ticketed)
                    ? { label: '🔥 Hot', color: StateGo }
                    : e.views >= 40
                      ? { label: '👀 High interest', color: '#FFB84D' }
                      : e.views > 0
                        ? { label: '🌱 Warming up', color: '#8FA895' }
                        : { label: '💤 Quiet', color: '#8FA895' };
                const when = e.starts_at
                  ? new Date(e.starts_at).toLocaleDateString(undefined, {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })
                  : 'Date TBA';
                return (
                  <Appear key={e.id} index={i}>
                  <ThemedView type="backgroundElement" style={styles.perfCard}>
                    <View style={styles.perfTop}>
                      <View style={styles.flex}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {e.title}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {when}
                          {e.status === 'draft' ? ' · draft' : ''}
                        </ThemedText>
                      </View>
                      <View style={[styles.signalPill, { backgroundColor: `${signal.color}22` }]}>
                        <ThemedText type="small" style={{ color: signal.color }}>
                          {signal.label}
                        </ThemedText>
                      </View>
                    </View>
                    <View style={styles.metricRow}>
                      <View style={styles.metric}>
                        <ThemedText type="smallBold">{e.views}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          views
                        </ThemedText>
                      </View>
                      <View style={styles.metric}>
                        <ThemedText type="smallBold">{e.is_ticketed ? e.tickets_sold : '—'}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          tickets
                        </ThemedText>
                      </View>
                      <View style={styles.metric}>
                        <ThemedText type="smallBold">{e.is_ticketed ? `${conv}%` : '—'}</ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          convert
                        </ThemedText>
                      </View>
                      <View style={styles.metric}>
                        <ThemedText type="smallBold">
                          {e.gross_minor > 0 ? formatMoney(e.gross_minor, e.currency) : '—'}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          gross
                        </ThemedText>
                      </View>
                    </View>
                    <Pressable
                      style={[styles.featureBtn, e.featured ? styles.featureOn : styles.featureOff]}
                      disabled={featuringId === e.id}
                      onPress={() => toggleFeatured(e)}>
                      {featuringId === e.id ? (
                        <ActivityIndicator color={e.featured ? OnBrand : Brand} />
                      ) : (
                        <ThemedText type="smallBold" style={e.featured ? styles.segOnText : styles.featureOffText}>
                          {e.featured ? '★ Featured — premium placement' : '☆ Give premium placement'}
                        </ThemedText>
                      )}
                    </Pressable>
                  </ThemedView>
                  </Appear>
                );
              })
            )}
          </>
        ) : tab === 'activations' ? (
          <>
            <ThemedText type="small" themeColor="textSecondary" style={styles.perfHint}>
              Experiential marketing, measured. Create an activation for each real-world moment — a
              pop-up, billboard, installation or launch — get a QR link, and see exactly what people
              did after they scanned it: opened the app, signed up, RSVP’d, checked out.
            </ThemedText>

            <ThemedView type="backgroundElement" style={styles.formCard}>
              <ThemedText type="smallBold">New activation</ThemedText>
              <TextInput
                style={styles.input}
                placeholder="Name (e.g. Acacia Mall pop-up)"
                placeholderTextColor="#66766A"
                value={cName}
                onChangeText={setCName}
              />
              <View style={styles.kindRow}>
                {CAMPAIGN_KINDS.map((k) => (
                  <Pressable
                    key={k}
                    style={[styles.kindChip, cKind === k && styles.kindChipOn]}
                    onPress={() => setCKind(k)}>
                    <ThemedText type="small" style={cKind === k ? styles.segOnText : styles.segText}>
                      {k}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
              {linkEvents.length > 0 ? (
                <>
                  <ThemedText type="small" themeColor="textSecondary">
                    Link to an event (optional) — sends scanners straight to it:
                  </ThemedText>
                  <View style={styles.kindRow}>
                    {linkEvents.map((e) => (
                      <Pressable
                        key={e.id}
                        style={[styles.kindChip, cEventId === e.id && styles.kindChipOn]}
                        onPress={() => setCEventId(cEventId === e.id ? null : e.id)}>
                        <ThemedText type="small" style={cEventId === e.id ? styles.segOnText : styles.segText} numberOfLines={1}>
                          {e.title}
                        </ThemedText>
                      </Pressable>
                    ))}
                  </View>
                </>
              ) : null}
              <Pressable
                style={[styles.saveBtn, creatingCampaign && styles.disabled]}
                disabled={creatingCampaign}
                onPress={createCampaign}>
                {creatingCampaign ? (
                  <ActivityIndicator color={OnBrand} />
                ) : (
                  <ThemedText type="smallBold" style={styles.segOnText}>
                    Create activation & link
                  </ThemedText>
                )}
              </Pressable>
            </ThemedView>

            {campaigns.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                No activations yet. Create one above, print the QR on your pop-up or poster, and watch
                the funnel fill in.
              </ThemedText>
            ) : (
              campaigns.map((c, i) => (
                <Appear key={c.id} index={i}>
                  <ThemedView type="backgroundElement" style={styles.perfCard}>
                    <View style={styles.perfTop}>
                      <View style={styles.flex}>
                        <ThemedText type="smallBold" numberOfLines={1}>
                          {c.name}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {c.kind}
                          {c.event_slug ? ' · linked to event' : ''}
                          {!c.active ? ' · paused' : ''}
                        </ThemedText>
                      </View>
                      <Pressable
                        style={[styles.signalPill, { backgroundColor: c.active ? 'rgba(61,220,151,0.15)' : 'rgba(148,166,151,0.15)' }]}
                        onPress={() => toggleCampaign(c)}>
                        <ThemedText type="small" style={{ color: c.active ? StateGo : '#8FA895' }}>
                          {c.active ? 'Active' : 'Paused'}
                        </ThemedText>
                      </Pressable>
                    </View>

                    <Pressable style={styles.linkRow} onPress={() => shareCampaign(c)}>
                      <ThemedText type="small" style={styles.linkText} numberOfLines={1}>
                        {SITE.replace('https://', '')}/go/{c.code}
                      </ThemedText>
                      <ThemedText type="smallBold" style={styles.copyBtn}>
                        {Platform.OS === 'web' ? 'Copy' : 'Share'}
                      </ThemedText>
                    </Pressable>

                    <View style={styles.metricRow}>
                      {[
                        { n: c.scans, l: 'scans' },
                        { n: c.app_opens, l: 'opens' },
                        { n: c.signups, l: 'signups' },
                        { n: c.rsvps, l: 'RSVPs' },
                        { n: c.checkouts, l: 'checkouts' },
                      ].map((m) => (
                        <View key={m.l} style={styles.metric}>
                          <ThemedText type="smallBold">{m.n}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary">
                            {m.l}
                          </ThemedText>
                        </View>
                      ))}
                    </View>
                  </ThemedView>
                </Appear>
              ))
            )}
          </>
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
              <ThemedView key={v.id} type="backgroundElement" style={styles.venueCard}>
                <View style={styles.row}>
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
                    <ThemedText type="small" themeColor="textSecondary">
                      {v.logo_url ? 'Logo ✓' : 'No logo'} · {v.menu_url ? 'Menu ✓' : 'No menu'}
                    </ThemedText>
                  </View>
                  {uploadingId === v.id ? <ActivityIndicator color={Brand} /> : null}
                </View>
                <View style={styles.venueActions}>
                  <Pressable style={styles.miniBtn} disabled={uploadingId === v.id} onPress={() => setCover(v)}>
                    <ThemedText type="smallBold" style={styles.photoText}>
                      {v.cover_url ? '📷 Cover' : '📷 Cover'}
                    </ThemedText>
                  </Pressable>
                  <Pressable style={styles.miniBtn} disabled={uploadingId === v.id} onPress={() => setLogo(v)}>
                    <ThemedText type="smallBold" style={styles.photoText}>
                      🏷️ Logo
                    </ThemedText>
                  </Pressable>
                  <Pressable style={styles.miniBtn} disabled={uploadingId === v.id} onPress={() => addPhoto(v)}>
                    <ThemedText type="smallBold" style={styles.photoText}>
                      ＋ Photo
                    </ThemedText>
                  </Pressable>
                  <Pressable style={styles.miniBtn} disabled={uploadingId === v.id} onPress={() => setMenu(v)}>
                    <ThemedText type="smallBold" style={styles.photoText}>
                      📄 Menu
                    </ThemedText>
                  </Pressable>
                </View>
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
          : (
              <>
                {reports.length > 0 ? (
                  <>
                    <ThemedText type="smallBold" style={styles.modHeading}>
                      🚩 Reports ({reports.length})
                    </ThemedText>
                    {reports.map((r) => (
                      <ThemedView key={r.id} type="backgroundElement" style={styles.reportCard}>
                        <ThemedText type="smallBold" style={styles.reportReason}>
                          {r.reason}
                        </ThemedText>
                        <ThemedText type="small" themeColor="textSecondary">
                          {r.target_type} · reported by {r.reporter}
                          {r.target_owner !== '—' ? ` · owner: ${r.target_owner}` : ''}
                        </ThemedText>
                        {r.note ? (
                          <ThemedText type="small" themeColor="textSecondary" style={styles.bookingNote}>
                            “{r.note}”
                          </ThemedText>
                        ) : null}
                        <View style={styles.bookingActions}>
                          <Pressable
                            style={[styles.actionBtn, styles.processingBtn]}
                            onPress={() => resolveReport(r, 'dismissed')}>
                            <ThemedText type="smallBold" style={styles.processingText}>
                              Dismiss
                            </ThemedText>
                          </Pressable>
                          <Pressable
                            style={[styles.actionBtn, styles.unsuspend]}
                            onPress={() => resolveReport(r, 'reviewed')}>
                            <ThemedText type="smallBold" style={styles.unsuspendText}>
                              Mark reviewed
                            </ThemedText>
                          </Pressable>
                          {r.target_owner_id ? (
                            <Pressable
                              style={[styles.actionBtn, styles.suspend]}
                              onPress={() => suspendReported(r)}>
                              <ThemedText type="smallBold" style={styles.suspendText}>
                                Suspend user
                              </ThemedText>
                            </Pressable>
                          ) : null}
                        </View>
                      </ThemedView>
                    ))}
                    <ThemedText type="smallBold" style={styles.modHeading}>
                      Feed posts
                    </ThemedText>
                  </>
                ) : null}
                {posts.length === 0 ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
                    {reports.length === 0 ? 'No reports or feed posts yet.' : 'No feed posts yet.'}
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
              </>
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
    backgroundColor: '#131C16',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segItem: { alignItems: 'center', paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, borderRadius: 999 },
  segOn: { backgroundColor: Brand },
  segText: { color: '#8FA895' },
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
  modHeading: { marginTop: Spacing.two, marginBottom: Spacing.one },
  reportCard: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(247,53,88,0.3)',
  },
  reportReason: { color: '#F73558' },
  removeBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  removeText: { color: '#F73558' },
  empty: { textAlign: 'center', marginTop: Spacing.six },
  pad: { height: Spacing.six },
  formCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two, marginBottom: Spacing.two },
  formRow: { flexDirection: 'row', gap: Spacing.two },
  input: {
    backgroundColor: '#1D2A21',
    borderRadius: 12,
    padding: Spacing.three,
    color: '#F2F7F1',
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
  launchHead: {
    borderRadius: 16,
    padding: Spacing.three,
    gap: 4,
    borderWidth: 1,
    marginBottom: Spacing.one,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderRadius: 14,
    padding: Spacing.three,
  },
  checkDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 5,
  },
  checkSub: { lineHeight: 18, marginTop: 2 },
  perfHint: { marginBottom: Spacing.two, lineHeight: 18 },
  perfCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  perfTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  signalPill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: Spacing.two },
  metricRow: { flexDirection: 'row', gap: Spacing.two },
  metric: { flex: 1, alignItems: 'center', gap: 2 },
  featureBtn: { borderRadius: 999, paddingVertical: Spacing.two, alignItems: 'center', borderWidth: 1 },
  featureOn: { backgroundColor: Brand, borderColor: 'transparent' },
  featureOff: { backgroundColor: 'transparent', borderColor: 'rgba(212,175,55,0.55)' },
  featureOffText: { color: '#D4AF37' },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: '#0E140F',
    borderRadius: 12,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  linkText: { flex: 1, color: '#93A899', fontFamily: 'SpaceGrotesk_400Regular' },
  copyBtn: { color: Brand },
  funnelCard: { borderRadius: 14, padding: Spacing.three, gap: Spacing.two },
  funnelTop: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  funnelNum: { color: '#F2F7F1' },
  barTrack: { height: 8, borderRadius: 999, backgroundColor: '#1D2A21', overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 999, backgroundColor: Brand },
  venueThumb: { width: 52, height: 52, borderRadius: 12 },
  venueThumbEmpty: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#1D2A21' },
  venueCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  venueActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  miniBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  photoBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    minWidth: 72,
    alignItems: 'center',
  },
  photoText: { color: '#F2F7F1' },
});
