import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Person = { id: string; name: string; avatar_url: string | null };

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

function Avatar({ p }: { p: Person }) {
  return (
    <View style={styles.avatar}>
      {p.avatar_url ? (
        <Image source={{ uri: p.avatar_url }} style={styles.avatarImg} contentFit="cover" />
      ) : (
        <ThemedText style={styles.avatarText}>{initials(p.name)}</ThemedText>
      )}
    </View>
  );
}

export default function FriendsScreen() {
  const { session } = useAuth();
  const [friends, setFriends] = useState<Person[]>([]);
  const [requests, setRequests] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [fRes, rRes] = await Promise.all([supabase.rpc('my_friends'), supabase.rpc('friend_requests')]);
    setFriends((fRes.data ?? []) as Person[]);
    setRequests((rRes.data ?? []) as Person[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  const respond = async (p: Person, accept: boolean) => {
    setRequests((prev) => prev.filter((x) => x.id !== p.id));
    if (accept) setFriends((prev) => [p, ...prev]);
    await supabase.rpc('respond_friend', { p_other: p.id, p_accept: accept });
  };

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in to see your friends.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : (
          <>
            {requests.length > 0 ? (
              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
                  REQUESTS
                </ThemedText>
                {requests.map((p) => (
                  <View key={p.id} style={styles.row}>
                    <Pressable style={styles.person} onPress={() => router.push({ pathname: '/u/[id]', params: { id: p.id } })}>
                      <Avatar p={p} />
                      <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
                        {p.name}
                      </ThemedText>
                    </Pressable>
                    <Pressable style={styles.accept} onPress={() => respond(p, true)}>
                      <ThemedText type="smallBold" style={styles.onBrand}>
                        Accept
                      </ThemedText>
                    </Pressable>
                    <Pressable style={styles.decline} onPress={() => respond(p, false)}>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        ✕
                      </ThemedText>
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}

            {friends.length === 0 && requests.length === 0 ? (
              <EmptyState
                glyph="👯"
                title="No friends yet"
                subtitle="Add people from the feed, a chat, or someone's profile — then plan your nights together."
              />
            ) : (
              <View style={styles.section}>
                <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
                  {friends.length} FRIEND{friends.length === 1 ? '' : 'S'}
                </ThemedText>
                {friends.map((p) => (
                  <Pressable key={p.id} style={styles.row} onPress={() => router.push({ pathname: '/u/[id]', params: { id: p.id } })}>
                    <Avatar p={p} />
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
                      {p.name}
                    </ThemedText>
                    <Pressable
                      style={styles.msgBtn}
                      onPress={() => router.push({ pathname: '/dm/[id]', params: { id: p.id, name: p.name } })}>
                      <ThemedText type="smallBold" themeColor="textSecondary">
                        💬
                      </ThemedText>
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  loader: { marginTop: Spacing.six },
  section: { gap: Spacing.two },
  kicker: { letterSpacing: 2, fontSize: 11 },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  person: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  flex: { flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#243527',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: StateGo, fontWeight: '700' },
  accept: { backgroundColor: Brand, borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  onBrand: { color: OnBrand },
  decline: { paddingHorizontal: Spacing.two, paddingVertical: Spacing.two },
  msgBtn: { paddingHorizontal: Spacing.two },
});
