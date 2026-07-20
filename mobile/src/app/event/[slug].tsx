import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type RsvpStatus = Tables<'rsvps'>['status'];

const RSVP_OPTIONS: { status: RsvpStatus; label: string }[] = [
  { status: 'going', label: 'Going' },
  { status: 'maybe', label: 'Maybe' },
  { status: 'declined', label: "Can't go" },
];

export default function EventScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { session } = useAuth();
  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [hostName, setHostName] = useState<string | null>(null);
  const [goingCount, setGoingCount] = useState<number | null>(null);
  const [myRsvp, setMyRsvp] = useState<Pick<Tables<'rsvps'>, 'id' | 'status'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    const [{ data: host }, { count }, myRsvpResult] = await Promise.all([
      supabase.from('profiles').select('display_name').eq('id', eventRow.host_id).maybeSingle(),
      // Only readable when the host made the guest list visible; ignore failures.
      supabase
        .from('rsvps')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventRow.id)
        .eq('status', 'going'),
      session
        ? supabase
            .from('rsvps')
            .select('id, status')
            .eq('event_id', eventRow.id)
            .eq('profile_id', session.user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setHostName(host?.display_name ?? null);
    setGoingCount(count ?? null);
    setMyRsvp(myRsvpResult.data ?? null);
    setLoading(false);
  }, [slug, session]);

  useEffect(() => {
    load();
  }, [load]);

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
        <ActivityIndicator />
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

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {event.cover_url ? (
          <Image source={{ uri: event.cover_url }} style={styles.cover} contentFit="cover" />
        ) : null}
        <ThemedText type="title">{event.title}</ThemedText>
        {hostName ? <ThemedText type="small">Hosted by {hostName}</ThemedText> : null}

        <ThemedView type="backgroundElement" style={styles.infoCard}>
          <ThemedText type="smallBold">{startsAt}</ThemedText>
          {event.venue_name ? <ThemedText type="small">{event.venue_name}</ThemedText> : null}
          {event.address ? <ThemedText type="small">{event.address}</ThemedText> : null}
          {goingCount !== null && goingCount > 0 ? (
            <ThemedText type="small">
              {goingCount} {goingCount === 1 ? 'person is' : 'people are'} going
            </ThemedText>
          ) : null}
        </ThemedView>

        {event.description ? <ThemedText>{event.description}</ThemedText> : null}

        <ThemedView type="backgroundElement" style={styles.infoCard}>
          <ThemedText type="subtitle">Are you coming?</ThemedText>
          {session ? (
            <View style={styles.rsvpRow}>
              {RSVP_OPTIONS.map(({ status, label }) => {
                const selected = myRsvp?.status === status;
                return (
                  <Pressable
                    key={status}
                    disabled={saving}
                    onPress={() => rsvp(status)}
                    style={[styles.rsvpButton, selected && styles.rsvpButtonSelected]}>
                    <ThemedText
                      type="smallBold"
                      style={selected ? styles.rsvpLabelSelected : undefined}>
                      {label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          ) : (
            <Pressable style={styles.signInButton} onPress={() => router.push('/profile')}>
              <ThemedText type="smallBold" style={styles.rsvpLabelSelected}>
                Sign in to RSVP
              </ThemedText>
            </Pressable>
          )}
          {error ? <ThemedText type="small">{error}</ThemedText> : null}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Spacing.three,
  },
  infoCard: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  rsvpRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  rsvpButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#208AEF',
  },
  rsvpButtonSelected: {
    backgroundColor: '#208AEF',
  },
  rsvpLabelSelected: {
    color: '#fff',
  },
  signInButton: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
  },
});
