import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { EmptyState } from '@/components/empty-state';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Spacing, StateGo } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Convo = {
  other_id: string;
  name: string;
  avatar_url: string | null;
  last_body: string;
  last_at: string;
  unread: number;
};

function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export default function MessagesScreen() {
  const { session } = useAuth();
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('my_conversations');
    setConvos((data ?? []).map((c) => ({ ...c, unread: Number(c.unread) })) as Convo[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in to message people.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : convos.length === 0 ? (
          <EmptyState
            glyph="💬"
            title="No messages yet"
            subtitle="Message a host from any event page, or say hi to someone from the feed."
          />
        ) : (
          convos.map((c, i) => (
            <Appear key={c.other_id} index={i}>
              <Pressable
                onPress={() =>
                  router.push({ pathname: '/dm/[id]', params: { id: c.other_id, name: c.name } })
                }
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
                <View style={styles.avatar}>
                  {c.avatar_url ? (
                    <Image source={{ uri: c.avatar_url }} style={styles.avatarImg} contentFit="cover" />
                  ) : (
                    <ThemedText style={styles.avatarText}>{initials(c.name)}</ThemedText>
                  )}
                </View>
                <View style={styles.flex}>
                  <View style={styles.rowTop}>
                    <ThemedText type="smallBold" numberOfLines={1} style={styles.flex}>
                      {c.name}
                    </ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      {timeAgo(c.last_at)}
                    </ThemedText>
                  </View>
                  <ThemedText
                    type="small"
                    themeColor={c.unread > 0 ? 'text' : 'textSecondary'}
                    numberOfLines={1}>
                    {c.last_body}
                  </ThemedText>
                </View>
                {c.unread > 0 ? (
                  <View style={styles.badge}>
                    <ThemedText style={styles.badgeText}>{c.unread}</ThemedText>
                  </View>
                ) : null}
              </Pressable>
            </Appear>
          ))
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
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  loader: { marginTop: Spacing.six },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.three,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  pressed: { opacity: 0.6 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#243527',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { color: StateGo, fontWeight: '700' },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#07130B', fontSize: 12, fontWeight: '700' },
});
