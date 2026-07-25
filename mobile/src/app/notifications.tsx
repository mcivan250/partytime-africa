import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Spacing, StateGo } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { formatMoney } from '@/lib/money';
import { supabase } from '@/lib/supabase';

type Note = {
  id: string;
  ntype: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
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

function render(n: Note): { icon: string; title: string; body: string; onPress: () => void } {
  const p = n.payload;
  if (n.ntype === 'earning') {
    return {
      icon: '💸',
      title: 'You earned!',
      body: `${formatMoney(Number(p.amount_minor ?? 0), String(p.currency ?? 'UGX'))} from ${p.event_title ?? 'an event'}`,
      onPress: () => router.push('/promotions'),
    };
  }
  if (n.ntype === 'feed_reply') {
    return {
      icon: '💬',
      title: `${p.actor ?? 'Someone'} replied to your post`,
      body: String(p.preview ?? ''),
      onPress: () => router.push({ pathname: '/post/[id]', params: { id: String(p.post_id) } }),
    };
  }
  if (n.ntype === 'dm') {
    return {
      icon: '✉️',
      title: `${p.actor ?? 'Someone'} messaged you`,
      body: String(p.preview ?? ''),
      onPress: () => router.push({ pathname: '/dm/[id]', params: { id: String(p.from_id), name: String(p.actor ?? '') } }),
    };
  }
  if (n.ntype === 'friend_request') {
    return {
      icon: '👋',
      title: `${p.actor ?? 'Someone'} sent you a friend request`,
      body: 'Tap to accept or decline',
      onPress: () => router.push('/friends'),
    };
  }
  if (n.ntype === 'reservation_update') {
    const confirmed = p.status === 'confirmed';
    const when = p.reserved_for
      ? new Date(String(p.reserved_for)).toLocaleString(undefined, {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    return {
      icon: confirmed ? '✅' : '😔',
      title: confirmed
        ? `Table confirmed at ${p.venue ?? 'the venue'}`
        : `Reservation declined at ${p.venue ?? 'the venue'}`,
      body: confirmed
        ? `Your table for ${p.party_size ?? ''} is set${when ? ` — ${when}` : ''}. See you there!`
        : `Sorry, ${p.venue ?? 'the venue'} couldn't take${when ? ` ${when}` : ' your booking'}. Try another night.`,
      onPress: () => router.push('/venues'),
    };
  }
  if (n.ntype === 'reservation') {
    return {
      icon: '🍽️',
      title: `New table request at ${p.venue ?? 'your venue'}`,
      body: `${p.actor ?? 'A guest'} · party of ${p.party_size ?? ''}`,
      onPress: () => router.push('/admin'),
    };
  }
  if (n.ntype === 'friend_accepted') {
    return {
      icon: '🤝',
      title: `${p.actor ?? 'Someone'} accepted your friend request`,
      body: "You're now friends",
      onPress: () => router.push({ pathname: '/u/[id]', params: { id: String(p.from_id) } }),
    };
  }
  return { icon: '🔔', title: 'Notification', body: '', onPress: () => {} };
}

export default function NotificationsScreen() {
  const { session } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('notifications')
      .select('id, ntype, payload, read_at, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    setNotes((data ?? []) as unknown as Note[]);
    setLoading(false);
    // Mark everything read on open.
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .is('read_at', null);
  }, []);

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in to see your notifications.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : notes.length === 0 ? (
          <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
            Nothing yet. Replies to your posts and your promoter earnings will land here. 🔔
          </ThemedText>
        ) : (
          notes.map((n, i) => {
            const r = render(n);
            const unread = !n.read_at;
            return (
              <Appear key={n.id} index={i}>
                <Pressable onPress={r.onPress} style={({ pressed }) => [pressed && styles.pressed]}>
                  <ThemedView type="backgroundElement" style={styles.card}>
                    {unread ? <View style={styles.dot} /> : null}
                    <ThemedText style={styles.icon}>{r.icon}</ThemedText>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">{r.title}</ThemedText>
                      {r.body ? (
                        <ThemedText type="small" themeColor="textSecondary" numberOfLines={2}>
                          {r.body}
                        </ThemedText>
                      ) : null}
                      <ThemedText type="small" themeColor="textSecondary" style={styles.time}>
                        {timeAgo(n.created_at)} ago
                      </ThemedText>
                    </View>
                  </ThemedView>
                </Pressable>
              </Appear>
            );
          })
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
  empty: { textAlign: 'center', marginTop: Spacing.six, lineHeight: 20 },
  pressed: { opacity: 0.7 },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.three,
    borderRadius: 16,
    padding: Spacing.three,
  },
  dot: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: StateGo,
  },
  icon: { fontSize: 22 },
  flex: { flex: 1, gap: 2 },
  time: { marginTop: 2 },
});
