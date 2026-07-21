import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
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

import { Avatars } from '@/components/avatars';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import {
  Brand,
  BrandGradient,
  BrandGradientLocations,
  MaxContentWidth,
  OnBrand,
  Spacing,
  StateGo,
  StateMaybe,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/hooks/use-theme';
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
    return (
      <ThemedText type="smallBold" style={{ color: StateGo }}>
        {confirmed === 'declined'
          ? 'Thanks for letting the host know.'
          : `You're on the list, ${guestName.trim()}! 🎉`}
      </ThemedText>
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
        <ThemedText style={styles.infoIcon}>💬</ThemedText>
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
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const theme = useTheme();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [goingCount, setGoingCount] = useState<number | null>(null);
  const [goingNames, setGoingNames] = useState<string[]>([]);
  const [guestList, setGuestList] = useState<
    Pick<Tables<'rsvps'>, 'guest_name' | 'status' | 'plus_ones'>[]
  >([]);
  const [myRsvp, setMyRsvp] = useState<Pick<Tables<'rsvps'>, 'id' | 'status'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blastMessage, setBlastMessage] = useState('');
  const [blastBusy, setBlastBusy] = useState(false);
  const [blastResult, setBlastResult] = useState<string | null>(null);

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

    const isHost = session?.user.id === eventRow.host_id;
    const [{ data: host }, { count }, { data: going }, myRsvpResult, guestListResult] =
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
              .select('id, status')
              .eq('event_id', eventRow.id)
              .eq('profile_id', session.user.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
        isHost
          ? supabase
              .from('rsvps')
              .select('guest_name, status, plus_ones')
              .eq('event_id', eventRow.id)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [] }),
      ]);
    setHostName(host?.display_name ?? null);
    setGoingCount(count ?? null);
    setGoingNames((going ?? []).map((r) => r.guest_name));
    setMyRsvp(myRsvpResult.data ?? null);
    setGuestList(guestListResult.data ?? []);
    setLoading(false);
  }, [slug, session]);

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

  const sendBlast = async () => {
    if (!event || !blastMessage.trim()) return;
    setBlastBusy(true);
    setBlastResult(null);
    const { data, error: fnError } = await supabase.functions.invoke('notify-guests', {
      body: { event_id: event.id, message: blastMessage.trim(), audience: 'going' },
    });
    setBlastBusy(false);
    if (fnError || data?.error) {
      setBlastResult(data?.error || 'Could not send. SMS may not be set up yet.');
      return;
    }
    setBlastMessage('');
    setBlastResult(
      data?.sent > 0
        ? `Sent to ${data.sent} guest${data.sent === 1 ? '' : 's'}. 📣`
        : (data?.note ?? 'No guests with phone numbers yet.'),
    );
  };

  const rsvp = async (status: RsvpStatus) => {
    if (!session || !event) return;
    setSaving(true);
    setError(null);
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
      });
      if (insertError) setError(insertError.message);
    }
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
  const statusEmoji: Record<RsvpStatus, string> = {
    going: '🔥',
    maybe: '🤔',
    declined: '😢',
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {event.cover_url ? (
            <Image source={{ uri: event.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <LinearGradient
              colors={BrandGradient}
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
            <ThemedText type="smallBold" style={styles.heroKicker}>
              {shortDate.toUpperCase()}
            </ThemedText>
            <ThemedText type="title">{event.title}</ThemedText>
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
          <ThemedView type="backgroundElement" style={styles.infoCard}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
              ARE YOU PULLING UP?
            </ThemedText>
            {session ? (
              <>
                <RsvpButtons current={myRsvp?.status ?? null} disabled={saving} onPick={rsvp} />
                {myRsvp ? (
                  <ThemedText type="small" themeColor="textSecondary" style={styles.center}>
                    {RSVP_CONFIRM[myRsvp.status]}
                  </ThemedText>
                ) : null}
              </>
            ) : (
              <GuestRsvp slug={event.slug} eventId={event.id} />
            )}
            {error ? <ThemedText type="small">{error}</ThemedText> : null}
          </ThemedView>

          <ThemedView type="backgroundElement" style={styles.infoCard}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoIcon}>📅</ThemedText>
              <ThemedText type="smallBold">{startsAt}</ThemedText>
            </View>
            {event.venue_name || event.address ? (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoIcon}>📍</ThemedText>
                <View style={styles.infoTextColumn}>
                  {event.venue_name ? (
                    <ThemedText type="smallBold">{event.venue_name}</ThemedText>
                  ) : null}
                  {event.address ? (
                    <ThemedText type="small" themeColor="textSecondary">
                      {event.address}
                    </ThemedText>
                  ) : null}
                </View>
              </View>
            ) : null}
          </ThemedView>

          {event.description ? (
            <ThemedText style={styles.description}>{event.description}</ThemedText>
          ) : null}

          {goingNames.length > 0 ? (
            <ThemedView type="backgroundElement" style={styles.infoCard}>
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
                WHO&apos;S THERE
              </ThemedText>
              <Avatars names={goingNames} />
            </ThemedView>
          ) : null}

          {isHost ? (
            <ThemedView type="backgroundElement" style={styles.infoCard}>
              <ThemedText type="subtitle">Guest list ({guestList.length})</ThemedText>
              {guestList.length === 0 ? (
                <ThemedText type="small" themeColor="textSecondary">
                  No RSVPs yet. Share the link to get people on the list.
                </ThemedText>
              ) : (
                guestList.map((g, i) => (
                  <View key={`${g.guest_name}-${i}`} style={styles.guestRow}>
                    <ThemedText type="small">{statusEmoji[g.status]}</ThemedText>
                    <ThemedText type="smallBold" style={styles.guestName}>
                      {g.guest_name}
                      {g.plus_ones > 0 ? ` +${g.plus_ones}` : ''}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {g.status}
                    </ThemedText>
                  </View>
                ))
              )}

              <View style={styles.blastDivider} />
              <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
                📣 TEXT YOUR GUESTS
              </ThemedText>
              <TextInput
                style={[styles.guestInput, { color: theme.text, backgroundColor: theme.background }]}
                placeholder="e.g. Doors at 6 — don't be late!"
                placeholderTextColor={theme.textSecondary}
                value={blastMessage}
                onChangeText={setBlastMessage}
                multiline
              />
              <Pressable
                style={[styles.blastButton, { opacity: blastBusy || !blastMessage.trim() ? 0.5 : 1 }]}
                disabled={blastBusy || !blastMessage.trim()}
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

          <PartyChat eventId={event.id} />
        </View>
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
    textAlign: 'center',
  },
  scroll: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Spacing.six,
  },
  hero: {
    height: 380,
    justifyContent: 'flex-end',
  },
  heroContent: {
    padding: Spacing.four,
    gap: Spacing.two,
  },
  heroKicker: {
    color: '#FFE3D2',
    letterSpacing: 2,
  },
  heroChips: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
    flexWrap: 'wrap',
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
  kicker: {
    letterSpacing: 2,
  },
  infoCard: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  infoIcon: {
    fontSize: 18,
    width: 24,
    textAlign: 'center',
  },
  infoTextColumn: {
    flex: 1,
    gap: Spacing.half,
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
  onState: {
    color: OnBrand,
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
  guestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.one,
  },
  guestName: {
    flex: 1,
  },
  blastDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginTop: Spacing.two,
  },
  blastButton: {
    backgroundColor: '#3DDC97',
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
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
