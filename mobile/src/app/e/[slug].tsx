import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatars } from '@/components/avatars';
import { KineticReveal } from '@/components/kinetic-reveal';
import { PhotoAlbum } from '@/components/photo-album';
import { Playlist } from '@/components/playlist';
import { PromoteCard } from '@/components/promote-card';
import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MerchShop } from '@/components/merch-shop';
import { TicketTiers } from '@/components/ticket-tiers';
import { VenueTables } from '@/components/venue-tables';
import {
  Brand,
  BrandGradient,
  BrandGradientLocations,
  Gold,
  MaxContentWidth,
  OnBrand,
  Spacing,
  StateGo,
  StateMaybe,
} from '@/constants/theme';
import { getEventTheme } from '@/constants/event-themes';
import { track } from '@/lib/analytics';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';
import { tapLight, tapMedium } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type RsvpStatus = Tables<'rsvps'>['status'];

const RSVP_OPTIONS: { status: RsvpStatus; label: string; emoji: string; color: string }[] = [
  { status: 'going', label: 'Going', emoji: '🔥', color: StateGo },
  { status: 'maybe', label: 'Maybe', emoji: '🤔', color: StateMaybe },
  { status: 'declined', label: "Can't", emoji: '😢', color: '#33473A' },
];

const RSVP_CONFIRM: Record<RsvpStatus, string> = {
  going: "🔥 You're on the list — see you there!",
  maybe: "We'll save you a maybe. Change anytime.",
  declined: '😢 Next one, then.',
};

const HERO_HEIGHT = 380;

function inviteUrl(slug: string) {
  return `https://partytime.africa/e/${slug}`;
}

function RsvpButtons({
  current,
  disabled,
  onPick,
}: {
  current: RsvpStatus | null;
  disabled?: boolean;
  onPick: (status: RsvpStatus) => void;
}) {
  return (
    <View style={styles.rsvpRow}>
      {RSVP_OPTIONS.map((opt) => {
        const selected = current === opt.status;
        const darkLabel = selected && opt.status !== 'declined';
        return (
          <Pressable
            key={opt.status}
            disabled={disabled}
            onPress={() => onPick(opt.status)}
            style={[
              styles.rsvp,
              selected && { backgroundColor: opt.color, borderColor: 'transparent' },
            ]}>
            <ThemedText style={styles.rsvpEmoji}>{opt.emoji}</ThemedText>
            <ThemedText type="smallBold" style={darkLabel ? styles.onState : undefined}>
              {opt.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

// Guest RSVP form for signed-out visitors (the web invite-link path). Inserts
// go through the rsvp-guest Edge Function since RLS blocks anonymous inserts.
function GuestRsvp({ slug, eventId }: { slug: string; eventId: string }) {
  const theme = useTheme();
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState<RsvpStatus | null>(null);

  const submit = async (status: RsvpStatus) => {
    setError(null);
    if (!guestName.trim()) {
      setError('Please enter your name first.');
      return;
    }
    setBusy(true);
    const { data, error: fnError } = await supabase.functions.invoke('rsvp-guest', {
      body: {
        slug,
        guest_name: guestName.trim(),
        guest_phone: guestPhone.trim() || undefined,
        status,
      },
    });
    setBusy(false);
    if (fnError || data?.error) {
      setError(data?.error || 'Could not save your RSVP. Please try again.');
      return;
    }
    if (data?.edit_token) {
      await AsyncStorage.setItem(`guest_rsvp:${eventId}`, data.edit_token);
    }
    setConfirmed(status);
  };

  if (confirmed) {
    if (confirmed === 'declined') {
      return (
        <ThemedText type="smallBold" style={{ color: StateGo }}>
          Thanks for letting the host know.
        </ThemedText>
      );
    }
    return (
      <View style={styles.guestForm}>
        <ThemedText type="smallBold" style={{ color: StateGo }}>
          You&apos;re on the list, {guestName.trim()}! 🎉
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Know someone who&apos;d love this? Invite them 👇
        </ThemedText>
        <Pressable
          style={[styles.shareButton, styles.shareWhatsApp]}
          onPress={() =>
            Share.share({ message: `You're invited! RSVP here: https://partytime.africa/e/${slug}` })
          }>
          <ThemedText type="smallBold" style={styles.onState}>
            Invite a friend
          </ThemedText>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.guestForm}>
      <TextInput
        style={[styles.guestInput, { color: theme.text, backgroundColor: theme.background }]}
        placeholder="Your name — no account needed"
        placeholderTextColor={theme.textSecondary}
        value={guestName}
        onChangeText={setGuestName}
        autoCapitalize="words"
      />
      <TextInput
        style={[styles.guestInput, { color: theme.text, backgroundColor: theme.background }]}
        placeholder="Phone (optional) — for event updates"
        placeholderTextColor={theme.textSecondary}
        value={guestPhone}
        onChangeText={setGuestPhone}
        keyboardType="phone-pad"
        autoComplete="tel"
      />
      <RsvpButtons current={null} disabled={busy} onPick={submit} />
      {error ? <ThemedText type="small">{error}</ThemedText> : null}
      <Pressable onPress={() => router.push('/profile')}>
        <ThemedText type="link">Have an account? Sign in</ThemedText>
      </Pressable>
    </View>
  );
}

// Named plus-ones for a signed-in guest who's going. Each saved guest gets a
// unique "you're my +1" link they can be sent, which lets them RSVP and make a
// free account. Replaces the old numeric +1 stepper.
function PlusOnesEditor({ rsvpId, eventTitle }: { rsvpId: string; eventTitle: string }) {
  const theme = useTheme();
  const [rows, setRows] = useState<{ name: string; token: string | null }[]>([]);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('event_plus_ones')
        .select('name, invite_token')
        .eq('rsvp_id', rsvpId)
        .order('created_at');
      setRows((data ?? []).map((d) => ({ name: d.name, token: d.invite_token })));
      setLoaded(true);
    })();
  }, [rsvpId]);

  // Editing a name invalidates its old link until re-saved.
  const setName = (i: number, val: string) =>
    setRows((r) => r.map((x, idx) => (idx === i ? { name: val, token: null } : x)));
  const addRow = () => setRows((r) => (r.length < 20 ? [...r, { name: '', token: null }] : r));
  const removeRow = (i: number) => setRows((r) => r.filter((_, idx) => idx !== i));

  const save = async () => {
    setBusy(true);
    setNote(null);
    const names = rows.map((r) => r.name.trim()).filter(Boolean);
    const { data, error } = await supabase.rpc('set_plus_ones', { p_rsvp_id: rsvpId, p_names: names });
    setBusy(false);
    if (error) {
      setNote(error.message);
      return;
    }
    const next = ((data ?? []) as { name: string; invite_token: string }[]).map((d) => ({
      name: d.name,
      token: d.invite_token,
    }));
    setRows(next);
    setNote(next.length ? 'Saved. Send each guest their invite below. 🎉' : 'Saved.');
  };

  const shareOne = (name: string, token: string) => {
    const link = `https://partytime.africa/i/${token}`;
    Share.share({
      message: `Hey ${name}! You're my +1 to ${eventTitle} 🎉 Tap to RSVP and make your free Party Time account: ${link}`,
    });
  };

  if (!loaded) return null;

  return (
    <View style={styles.poWrap}>
      <ThemedText type="smallBold">Bringing guests? Add their names</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        Each guest gets their own invite link to RSVP and join Party Time.
      </ThemedText>
      {rows.map((r, i) => (
        <View key={i} style={styles.poRow}>
          <TextInput
            style={[styles.poInput, { color: theme.text, backgroundColor: theme.background }]}
            placeholder={`Guest ${i + 1} full name`}
            placeholderTextColor={theme.textSecondary}
            value={r.name}
            onChangeText={(v) => setName(i, v)}
            autoCapitalize="words"
          />
          {r.token ? (
            <Pressable style={styles.poShareBtn} onPress={() => shareOne(r.name, r.token!)}>
              <ThemedText type="smallBold" style={styles.onState}>
                Share
              </ThemedText>
            </Pressable>
          ) : null}
          <Pressable style={styles.poRemove} onPress={() => removeRow(i)} hitSlop={8}>
            <ThemedText type="smallBold" themeColor="textSecondary">
              ✕
            </ThemedText>
          </Pressable>
        </View>
      ))}
      <View style={styles.poActions}>
        <Pressable style={styles.poAddBtn} onPress={addRow}>
          <ThemedText type="smallBold">＋ Add a guest</ThemedText>
        </Pressable>
        <Pressable style={[styles.poSaveBtn, { opacity: busy ? 0.5 : 1 }]} disabled={busy} onPress={save}>
          <ThemedText type="smallBold" style={styles.onState}>
            Save guests
          </ThemedText>
        </Pressable>
      </View>
      {note ? (
        <ThemedText type="small" themeColor="textSecondary">
          {note}
        </ThemedText>
      ) : null}
    </View>
  );
}

type ChatRow = {
  id: string;
  body: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

// Party Chat — event comments. Readable by anyone when the host allows
// comments; only signed-in users can post (RLS enforced).
function PartyChat({ eventId }: { eventId: string }) {
  const theme = useTheme();
  const { session } = useAuth();
  const [messages, setMessages] = useState<ChatRow[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('comments')
      .select('id, body, created_at, profiles(display_name)')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
      .limit(100);
    if (data) setMessages(data as unknown as ChatRow[]);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!session || !text.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from('comments')
      .insert({ event_id: eventId, profile_id: session.user.id, body: text.trim() });
    setBusy(false);
    if (!error) {
      setText('');
      load();
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.infoCard}>
      <View style={styles.chatHeader}>
        <ThemedText type="subtitle">Party chat</ThemedText>
      </View>
      {messages.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No messages yet. Say hi 👋
        </ThemedText>
      ) : (
        messages.map((m) => (
          <View key={m.id} style={styles.chatMsg}>
            <ThemedText type="smallBold">{m.profiles?.display_name ?? 'Guest'}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {m.body}
            </ThemedText>
          </View>
        ))
      )}
      {session ? (
        <View style={styles.chatComposer}>
          <TextInput
            style={[styles.guestInput, styles.chatInput, { color: theme.text, backgroundColor: theme.background }]}
            placeholder="Message the party…"
            placeholderTextColor={theme.textSecondary}
            value={text}
            onChangeText={setText}
          />
          <Pressable style={styles.sendButton} disabled={busy} onPress={send}>
            <ThemedText type="smallBold" style={styles.onState}>
              Send
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        <Pressable onPress={() => router.push('/profile')}>
          <ThemedText type="link">Sign in to join the chat</ThemedText>
        </Pressable>
      )}
    </ThemedView>
  );
}

export default function EventScreen() {
  const { slug, ref } = useLocalSearchParams<{ slug: string; ref?: string }>();
  const referralCode = typeof ref === 'string' ? ref : undefined;
  const { session } = useAuth();
  const theme = useTheme();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [goingCount, setGoingCount] = useState<number | null>(null);
  const [goingNames, setGoingNames] = useState<string[]>([]);
  const [myRsvp, setMyRsvp] = useState<Pick<Tables<'rsvps'>, 'id' | 'status' | 'plus_ones'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [buyNotice, setBuyNotice] = useState<string | null>(null);
  const [cohostStatus, setCohostStatus] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [invitePrompt, setInvitePrompt] = useState(false);
  const [minTier, setMinTier] = useState<{ price_minor: number; currency: string } | null>(null);
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const rsvpY = useRef(0);
  const ticketsY = useRef(0);

  const scrollToSection = (y: number) => {
    scrollRef.current?.scrollTo({ y: HERO_HEIGHT + y - 12, animated: true });
  };

  const load = useCallback(async () => {
    const { data: eventRow, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (eventError || !eventRow) {
      setError(eventError?.message ?? 'Event not found — it may be private or unpublished.');
      setLoading(false);
      return;
    }
    setEvent(eventRow);
    track('event_view', { slug: eventRow.slug });

    const [{ data: host }, { count }, { data: going }, myRsvpResult, minTierResult] =
      await Promise.all([
        supabase.from('profiles').select('display_name').eq('id', eventRow.host_id).maybeSingle(),
        supabase
          .from('rsvps')
          .select('id', { count: 'exact', head: true })
          .eq('event_id', eventRow.id)
          .eq('status', 'going'),
        // Names for the "who's there" stack (RLS returns rows when the guest
        // list is visible or the viewer manages the event).
        supabase
          .from('rsvps')
          .select('guest_name')
          .eq('event_id', eventRow.id)
          .eq('status', 'going')
          .limit(30),
        session
          ? supabase
              .from('rsvps')
              .select('id, status, plus_ones')
              .eq('event_id', eventRow.id)
              .eq('profile_id', session.user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('ticket_tiers')
          .select('price_minor, currency')
          .eq('event_id', eventRow.id)
          .order('price_minor', { ascending: true })
          .limit(1)
          .maybeSingle(),
      ]);
    setHostName(host?.display_name ?? null);
    setGoingCount(count ?? null);
    setGoingNames((going ?? []).map((r) => r.guest_name));
    setMyRsvp(myRsvpResult.data ?? null);
    setMinTier(minTierResult.data ?? null);

    if (session && eventRow.host_id !== session.user.id) {
      const { data: ch } = await supabase
        .from('co_hosts')
        .select('status')
        .eq('event_id', eventRow.id)
        .eq('profile_id', session.user.id)
        .maybeSingle();
      setCohostStatus(ch?.status ?? null);
    } else {
      setCohostStatus(null);
    }
    if (session) {
      const { data: adm } = await supabase.rpc('is_admin');
      setIsAdmin(adm === true);
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  }, [slug, session]);

  const toggleFeatured = async () => {
    if (!event) return;
    const next = !event.featured;
    setEvent({ ...event, featured: next });
    const { error: fErr } = await supabase.rpc('admin_set_event_featured', {
      p_id: event.id,
      p_featured: next,
    });
    if (fErr) setEvent({ ...event, featured: !next });
  };

  const requestCohost = async () => {
    if (!session) {
      router.push('/profile');
      return;
    }
    tapMedium();
    await supabase.rpc('request_cohost', { p_event_id: event!.id });
    setCohostStatus('requested');
  };

  useEffect(() => {
    load();
  }, [load]);

  const inviteMessage = event
    ? `You're invited to ${event.title}! RSVP here: ${inviteUrl(event.slug)}`
    : '';

  const shareInvite = async () => {
    if (!event) return;
    await Share.share({ message: inviteMessage });
  };

  const shareWhatsApp = async () => {
    if (!event) return;
    const url = `https://wa.me/?text=${encodeURIComponent(inviteMessage)}`;
    const ok = await Linking.canOpenURL(url);
    if (ok) {
      Linking.openURL(url);
    } else {
      shareInvite();
    }
  };

  const buyTier = async (tier: { id: string }) => {
    tapMedium();
    if (!session) {
      setBuyNotice('Please sign in to buy a ticket.');
      router.push('/profile');
      return;
    }
    setBuyNotice('Starting secure checkout…');
    track('checkout_start', { kind: 'ticket' });
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, phone')
      .eq('id', session.user.id)
      .maybeSingle();
    const { data, error: fnError } = await supabase.functions.invoke('create-order', {
      body: {
        tier_id: tier.id,
        quantity: 1,
        buyer_name: profile?.display_name || session.user.email || 'Guest',
        buyer_phone: profile?.phone || '',
        email: session.user.email || '',
        referral_code: referralCode,
      },
    });
    if (fnError || data?.error || !data?.redirect_url) {
      setBuyNotice(data?.error || 'Could not start checkout. Payments may not be set up yet.');
      return;
    }
    setBuyNotice('Opening secure checkout — after paying, your ticket appears in My Tickets. 🎟');
    Linking.openURL(data.redirect_url);
  };

  const bookTable = async (table: { id: string }) => {
    tapMedium();
    if (!session) {
      setBuyNotice('Please sign in to book a table.');
      router.push('/profile');
      return;
    }
    setBuyNotice('Starting secure checkout…');
    track('checkout_start', { kind: 'table' });
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, phone')
      .eq('id', session.user.id)
      .maybeSingle();
    const { data, error: fnError } = await supabase.functions.invoke('create-order', {
      body: {
        table_id: table.id,
        buyer_name: profile?.display_name || session.user.email || 'Guest',
        buyer_phone: profile?.phone || '',
        email: session.user.email || '',
        referral_code: referralCode,
      },
    });
    if (fnError || data?.error || !data?.redirect_url) {
      setBuyNotice(data?.error || 'Could not start checkout. Payments may not be set up yet.');
      return;
    }
    setBuyNotice('Opening secure checkout — your table is confirmed once payment clears. 🍾');
    Linking.openURL(data.redirect_url);
  };

  const buyMerch = async (variant: { id: string }) => {
    tapMedium();
    if (!session) {
      setBuyNotice('Please sign in to buy merch.');
      router.push('/profile');
      return;
    }
    setBuyNotice('Starting secure checkout…');
    track('checkout_start', { kind: 'merch' });
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, phone')
      .eq('id', session.user.id)
      .maybeSingle();
    const { data, error: fnError } = await supabase.functions.invoke('create-order', {
      body: {
        merch_variant_id: variant.id,
        quantity: 1,
        buyer_name: profile?.display_name || session.user.email || 'Guest',
        buyer_phone: profile?.phone || '',
        email: session.user.email || '',
        referral_code: referralCode,
      },
    });
    if (fnError || data?.error || !data?.redirect_url) {
      setBuyNotice(data?.error || 'Could not start checkout. Payments may not be set up yet.');
      return;
    }
    setBuyNotice('Opening secure checkout — collect your merch at the event with the QR in My Tickets. 🛍️');
    Linking.openURL(data.redirect_url);
  };

  const rsvp = async (status: RsvpStatus) => {
    if (!session || !event) return;
    tapLight();
    setSaving(true);
    setError(null);
    // plus_ones is managed by PlusOnesEditor (named guests), so we don't touch
    // it here — only the status.
    if (myRsvp) {
      const { error: updateError } = await supabase
        .from('rsvps')
        .update({ status })
        .eq('id', myRsvp.id);
      if (updateError) setError(updateError.message);
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', session.user.id)
        .maybeSingle();
      const { error: insertError } = await supabase.from('rsvps').insert({
        event_id: event.id,
        profile_id: session.user.id,
        guest_name: profile?.display_name ?? session.user.email ?? 'Guest',
        status,
        plus_ones: 0,
      });
      if (insertError) setError(insertError.message);
      else track('rsvp', { status });
    }
    if (status === 'going') setInvitePrompt(true);
    await load();
    setSaving(false);
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }

  if (!event) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>{error ?? 'Event not found.'}</ThemedText>
      </ThemedView>
    );
  }

  const startsAt = event.starts_at
    ? new Date(event.starts_at).toLocaleString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: event.timezone,
      })
    : 'Date to be announced';
  const shortDate = event.starts_at
    ? new Date(event.starts_at).toLocaleDateString(undefined, {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        timeZone: event.timezone,
      })
    : 'Date TBA';
  const isHost = session?.user.id === event.host_id;
  const isManager = isHost || cohostStatus === 'accepted';
  const vibe = getEventTheme(event.theme);

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {event.cover_url ? (
            <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={vibe.gradient}
              locations={BrandGradientLocations}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <LinearGradient
            colors={['rgba(17,24,17,0.1)', 'rgba(17,24,17,0.6)', '#111811']}
            locations={[0, 0.55, 1]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <KineticReveal delay={80}>
              <View style={styles.heroDate}>
                <View style={[styles.heroDateBar, { backgroundColor: vibe.accent }]} />
                <ThemedText type="smallBold" style={styles.heroKicker}>
                  {shortDate.toUpperCase()}
                </ThemedText>
              </View>
            </KineticReveal>
            <KineticReveal delay={180}>
              <ThemedText type="title" style={styles.heroTitle}>
                {event.title}
              </ThemedText>
            </KineticReveal>
            {event.featured && event.sponsor_name ? (
              <View style={styles.sponsorChip}>
                <ThemedText type="smallBold" style={styles.sponsorChipText}>
                  ★ Sponsored by {event.sponsor_name}
                </ThemedText>
              </View>
            ) : null}
            <View style={styles.heroChips}>
              {hostName ? (
                <View style={styles.chip}>
                  <ThemedText type="small">Hosted by {hostName}</ThemedText>
                </View>
              ) : null}
              {goingCount !== null && goingCount > 0 ? (
                <View style={styles.chip}>
                  <ThemedText type="small">{goingCount} going</ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.body}>
          <ThemedView
            type="backgroundElement"
            style={styles.infoCard}
            onLayout={(e) => {
              rsvpY.current = e.nativeEvent.layout.y;
            }}>
            <SectionLabel>ARE YOU PULLING UP?</SectionLabel>
            {session ? (
              <>
                <RsvpButtons current={myRsvp?.status ?? null} disabled={saving} onPick={rsvp} />
                {myRsvp ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                    {RSVP_CONFIRM[myRsvp.status]}
                  </ThemedText>
                ) : null}
                {event.allow_plus_ones && myRsvp?.status === 'going' && myRsvp.id ? (
                  <PlusOnesEditor rsvpId={myRsvp.id} eventTitle={event.title} />
                ) : null}
                {invitePrompt && myRsvp?.status === 'going' ? (
                  <View style={styles.invitePrompt}>
                    <ThemedText type="smallBold" style={styles.invitePromptTitle}>
                      🎉 You&apos;re on the list!
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Bring the crew — every friend you invite makes the night better.
                    </ThemedText>
                    <View style={styles.shareRow}>
                      <Pressable style={[styles.shareButton, styles.shareWhatsApp]} onPress={shareWhatsApp}>
                        <ThemedText type="smallBold" style={styles.onState}>
                          Invite on WhatsApp
                        </ThemedText>
                      </Pressable>
                      <Pressable style={[styles.shareButton, styles.shareGhost]} onPress={shareInvite}>
                        <ThemedText type="smallBold">Share link</ThemedText>
                      </Pressable>
                    </View>
                  </View>
                ) : null}
              </>
            ) : (
              <GuestRsvp slug={event.slug} eventId={event.id} />
            )}
            {error ? <ThemedText type="small">{error}</ThemedText> : null}
          </ThemedView>

          {isAdmin ? (
            <Pressable style={styles.adminBar} onPress={toggleFeatured}>
              <ThemedText type="smallBold" style={styles.adminBarText}>
                {event.featured
                  ? '★ Featured on Discover — tap to remove'
                  : '☆ Feature this on Discover'}
              </ThemedText>
            </Pressable>
          ) : null}

          <ThemedView type="backgroundElement" style={styles.infoCard}>
            <View style={styles.infoBlock}>
              <SectionLabel>WHEN</SectionLabel>
              <ThemedText type="smallBold" style={styles.infoValue}>
                {startsAt}
              </ThemedText>
            </View>
            {event.venue_name || event.address ? (
              <View style={styles.infoBlock}>
                <SectionLabel>WHERE</SectionLabel>
                {event.venue_name ? (
                  event.venue_id ? (
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/v/[id]', params: { id: String(event.venue_id) } })
                      }>
                      <ThemedText type="smallBold" style={styles.venueLink}>
                        {event.venue_name}  ›
                      </ThemedText>
                    </Pressable>
                  ) : (
                    <ThemedText type="smallBold" style={styles.infoValue}>
                      {event.venue_name}
                    </ThemedText>
                  )
                ) : null}
                {event.address ? (
                  <ThemedText type="small" themeColor="textSecondary">
                    {event.address}
                  </ThemedText>
                ) : null}
              </View>
            ) : null}
          </ThemedView>

          {event.description ? (
            <ThemedText style={styles.description}>{event.description}</ThemedText>
          ) : null}

          {event.playlist_url ? <Playlist url={event.playlist_url} /> : null}

          <View
            onLayout={(e) => {
              ticketsY.current = e.nativeEvent.layout.y;
            }}>
            <TicketTiers
              eventId={event.id}
              currency={event.currency}
              isManager={isManager}
              onBuy={buyTier}
            />
          </View>

          <VenueTables
            eventId={event.id}
            currency={event.currency}
            isManager={isManager}
            onBook={bookTable}
          />

          <MerchShop
            eventId={event.id}
            currency={event.currency}
            isManager={isManager}
            onBuy={buyMerch}
          />
          {isHost ? (
            <Pressable
              style={styles.checkInButton}
              onPress={() => router.push({ pathname: '/manage/[eventId]', params: { eventId: event.id } })}>
              <ThemedText type="smallBold">Manage this event  ›</ThemedText>
            </Pressable>
          ) : session ? (
            cohostStatus === 'accepted' ? (
              <View style={styles.cohostNote}>
                <ThemedText type="smallBold" style={{ color: StateGo }}>
                  ✓ You&apos;re a co-host — you can manage tickets, tables &amp; merch above.
                </ThemedText>
              </View>
            ) : cohostStatus === 'requested' ? (
              <View style={styles.cohostNote}>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  ⏳ Co-host request sent — waiting for the host.
                </ThemedText>
              </View>
            ) : (
              <Pressable style={styles.checkInButton} onPress={requestCohost}>
                <ThemedText type="smallBold">🤝 Request to co-host</ThemedText>
              </Pressable>
            )
          ) : null}
          {session && !isHost ? (
            <Pressable
              style={styles.checkInButton}
              onPress={() =>
                router.push({ pathname: '/dm/[id]', params: { id: event.host_id, name: hostName ?? 'Host' } })
              }>
              <ThemedText type="smallBold">💬 Message the host</ThemedText>
            </Pressable>
          ) : null}
          {buyNotice ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
              {buyNotice}
            </ThemedText>
          ) : null}

          {goingNames.length > 0 ? (
            <ThemedView type="backgroundElement" style={styles.infoCard}>
              <SectionLabel>WHO&apos;S THERE</SectionLabel>
              <Avatars names={goingNames} />
            </ThemedView>
          ) : null}

          <View style={styles.shareRow}>
            <Pressable style={[styles.shareButton, styles.shareGhost]} onPress={shareInvite}>
              <ThemedText type="smallBold">Share</ThemedText>
            </Pressable>
            <Pressable style={[styles.shareButton, styles.shareWhatsApp]} onPress={shareWhatsApp}>
              <ThemedText type="smallBold" style={styles.onState}>
                Share on WhatsApp
              </ThemedText>
            </Pressable>
          </View>

          <PromoteCard
            eventId={event.id}
            slug={event.slug}
            title={event.title}
            currency={event.currency}
            promoterBps={event.promoter_bps}
          />

          {event.allow_guest_photos ? <PhotoAlbum eventId={event.id} /> : null}

          <PartyChat eventId={event.id} />
        </View>
      </ScrollView>

      {!isHost ? (
        <View style={[styles.stickyBar, { paddingBottom: Math.max(insets.bottom, Spacing.three) }]}>
          {event.is_ticketed ? (
            <>
              <View style={styles.stickyInfo}>
                <ThemedText type="small" themeColor="textSecondary">
                  {minTier ? 'From' : ' '}
                </ThemedText>
                <ThemedText type="subtitle" style={styles.stickyPrice}>
                  {minTier ? formatMoney(minTier.price_minor, minTier.currency) : 'Tickets'}
                </ThemedText>
              </View>
              <Pressable style={styles.stickyCta} onPress={() => scrollToSection(ticketsY.current)}>
                <ThemedText type="smallBold" style={styles.onState}>
                  Get tickets
                </ThemedText>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[styles.stickyCta, styles.stickyCtaWide]}
              onPress={() => scrollToSection(rsvpY.current)}>
              <ThemedText type="smallBold" style={styles.onState}>
                {myRsvp
                  ? `You're ${myRsvp.status === 'going' ? 'going 🔥' : myRsvp.status} · Change`
                  : 'RSVP now'}
              </ThemedText>
            </Pressable>
          )}
        </View>
      ) : null}
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
    textAlign: 'center',
  },
  scroll: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: 120,
  },
  stickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    backgroundColor: 'rgba(11,11,16,0.96)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  stickyInfo: {
    flex: 1,
  },
  stickyPrice: {
    fontSize: 18,
    lineHeight: 22,
  },
  stickyCta: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
    alignItems: 'center',
  },
  stickyCtaWide: {
    flex: 1,
  },
  hero: {
    height: HERO_HEIGHT,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroDate: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  heroDateBar: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: StateGo,
  },
  heroKicker: {
    color: '#EFF6EE',
    letterSpacing: 2,
  },
  heroTitle: {
    fontSize: 40,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  heroChips: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
    flexWrap: 'wrap',
  },
  sponsorChip: {
    alignSelf: 'flex-start',
    backgroundColor: Gold,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginTop: Spacing.one,
  },
  sponsorChipText: {
    color: '#07130B',
    letterSpacing: 0.3,
  },
  chip: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  body: {
    padding: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  infoCard: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  infoBlock: {
    gap: Spacing.two,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  venueLink: {
    fontSize: 16,
    lineHeight: 22,
    color: StateGo,
  },
  description: {
    lineHeight: 24,
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rsvp: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.half,
    paddingVertical: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#243527',
  },
  rsvpEmoji: {
    fontSize: 20,
  },
  plusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  flex: {
    flex: 1,
  },
  plusBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusSign: {
    fontSize: 18,
  },
  plusCount: {
    minWidth: 34,
    textAlign: 'center',
    fontSize: 16,
  },
  onState: {
    color: OnBrand,
  },
  invitePrompt: {
    marginTop: Spacing.two,
    padding: Spacing.three,
    borderRadius: 14,
    gap: Spacing.two,
    backgroundColor: 'rgba(29,201,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(29,201,107,0.35)',
  },
  invitePromptTitle: {
    color: StateGo,
  },
  adminBar: {
    borderRadius: 14,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Gold,
    backgroundColor: 'rgba(212,175,55,0.10)',
  },
  adminBarText: {
    color: Gold,
  },
  poWrap: {
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  poRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  poInput: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  poShareBtn: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  poRemove: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  poActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  poAddBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
  poSaveBtn: {
    flex: 1,
    backgroundColor: StateGo,
    borderRadius: 14,
    paddingVertical: Spacing.two,
    alignItems: 'center',
  },
  guestForm: {
    gap: Spacing.three,
  },
  guestInput: {
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  shareRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  shareButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 16,
  },
  shareGhost: {
    backgroundColor: '#243527',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  shareWhatsApp: {
    backgroundColor: StateGo,
  },
  checkInButton: {
    backgroundColor: '#243527',
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cohostNote: {
    borderRadius: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    backgroundColor: '#19231B',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  chatMsg: {
    gap: Spacing.half,
  },
  chatComposer: {
    flexDirection: 'row',
    gap: Spacing.two,
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
  },
  sendButton: {
    backgroundColor: Brand,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
});
