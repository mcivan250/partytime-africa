import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Gold, MaxContentWidth, OnBrand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Invite = {
  name: string;
  inviter_name: string;
  claimed: boolean;
  event: {
    slug: string;
    title: string;
    cover_url: string | null;
    starts_at: string | null;
    venue_name: string | null;
    timezone: string;
  };
};

export default function PlusOneInviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { session, loading: authLoading } = useAuth();
  const [invite, setInvite] = useState<Invite | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);

  const loadInvite = useCallback(async () => {
    const { data, error: fnError } = await supabase.functions.invoke('plus-one-invite', {
      body: { token },
    });
    if (fnError || data?.error) {
      setError(data?.error || 'This invite could not be opened.');
      setLoading(false);
      return null;
    }
    setInvite(data as Invite);
    setLoading(false);
    return data as Invite;
  }, [token]);

  const claim = useCallback(async () => {
    setClaiming(true);
    const { data, error: rpcError } = await supabase.rpc('claim_plus_one', { p_token: token });
    setClaiming(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    const slug = (data as { slug?: string })?.slug;
    if (slug) router.replace({ pathname: '/e/[slug]', params: { slug } });
  }, [token]);

  useEffect(() => {
    loadInvite();
  }, [loadInvite]);

  // Once signed in, claim automatically and drop into the event.
  useEffect(() => {
    if (!authLoading && session && invite && !claiming) {
      claim();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, session, invite]);

  const goSignUp = async () => {
    await AsyncStorage.setItem('pending_plus_one', String(token));
    router.push('/(tabs)/profile');
  };

  if (loading || authLoading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }

  if (error || !invite) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText type="subtitle" style={styles.center}>
          {error ?? 'Invite not found.'}
        </ThemedText>
        <Pressable style={styles.secondaryBtn} onPress={() => router.replace('/(tabs)')}>
          <ThemedText type="smallBold">Explore Party Time</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  const when = invite.event.starts_at
    ? new Date(invite.event.starts_at).toLocaleString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: invite.event.timezone,
      })
    : 'Date to be announced';

  // Signed in: we're claiming in the background.
  if (session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
        <ThemedText type="small" themeColor="textSecondary">
          Adding you to {invite.event.title}…
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {invite.event.cover_url ? (
          <Image source={{ uri: invite.event.cover_url }} style={styles.cover} contentFit="cover" />
        ) : (
          <View style={[styles.cover, styles.coverFallback]}>
            <ThemedText style={styles.coverEmoji}>🎉</ThemedText>
          </View>
        )}

        <ThemedText style={styles.kicker}>
          {invite.inviter_name} added you as their +1
        </ThemedText>
        <ThemedText type="title">{invite.event.title}</ThemedText>

        <View style={styles.metaCard}>
          <ThemedText type="smallBold" style={styles.metaLabel}>
            WHEN
          </ThemedText>
          <ThemedText type="smallBold">{when}</ThemedText>
          {invite.event.venue_name ? (
            <>
              <ThemedText type="smallBold" style={[styles.metaLabel, styles.metaSpace]}>
                WHERE
              </ThemedText>
              <ThemedText type="smallBold">{invite.event.venue_name}</ThemedText>
            </>
          ) : null}
        </View>

        <ThemedText type="small" themeColor="textSecondary" style={styles.blurb}>
          Hey {invite.name} 👋 Create your free Party Time account to lock in your spot, get event
          updates, and see who else is going.
        </ThemedText>

        <Pressable style={styles.primaryBtn} onPress={goSignUp}>
          <ThemedText type="smallBold" style={styles.onBrand}>
            Create my free account
          </ThemedText>
        </Pressable>
        <Pressable
          style={styles.secondaryBtn}
          onPress={() =>
            router.push({ pathname: '/e/[slug]', params: { slug: invite.event.slug } })
          }>
          <ThemedText type="smallBold">Just view the event</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.three },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  cover: { width: '100%', height: 200, borderRadius: 22 },
  coverFallback: { backgroundColor: '#19231B', alignItems: 'center', justifyContent: 'center' },
  coverEmoji: { fontSize: 56 },
  kicker: { color: Gold, fontWeight: '700' },
  metaCard: {
    backgroundColor: '#19231B',
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.half,
  },
  metaLabel: { color: 'rgba(255,255,255,0.5)', letterSpacing: 1, fontSize: 11 },
  metaSpace: { marginTop: Spacing.two },
  blurb: { lineHeight: 20 },
  primaryBtn: {
    backgroundColor: Brand,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  onBrand: { color: OnBrand },
  secondaryBtn: {
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
  },
});
