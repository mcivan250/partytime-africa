import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Member = { id: string; name: string; city: string | null; suspended: boolean; created_at: string };
type Post = { id: string; author_name: string; body: string; image_path: string | null; created_at: string };

export default function AdminScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<'members' | 'content'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);

  const load = useCallback(async () => {
    const [mRes, pRes] = await Promise.all([
      supabase.rpc('admin_members'),
      supabase.rpc('admin_recent_posts'),
    ]);
    if (mRes.error && pRes.error) {
      setDenied(true);
    } else {
      setMembers((mRes.data ?? []) as Member[]);
      setPosts((pRes.data ?? []) as Post[]);
    }
    setLoading(false);
  }, []);

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
      <View style={styles.segment}>
        <Pressable style={[styles.segItem, tab === 'members' && styles.segOn]} onPress={() => setTab('members')}>
          <ThemedText type="smallBold" style={tab === 'members' ? styles.segOnText : styles.segText}>
            Members
          </ThemedText>
        </Pressable>
        <Pressable style={[styles.segItem, tab === 'content' && styles.segOn]} onPress={() => setTab('content')}>
          <ThemedText type="smallBold" style={tab === 'content' ? styles.segOnText : styles.segText}>
            Feed content
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'members'
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
  segment: {
    flexDirection: 'row',
    backgroundColor: '#19231B',
    borderRadius: 999,
    padding: 4,
    gap: 4,
    margin: Spacing.four,
    marginBottom: Spacing.two,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '90%',
  },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 999 },
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
  actionBtn: { borderRadius: 999, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three },
  suspend: { backgroundColor: 'rgba(247,53,88,0.15)' },
  suspendText: { color: '#F73558' },
  unsuspend: { backgroundColor: 'rgba(61,220,151,0.15)' },
  unsuspendText: { color: StateGo },
  postCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  removeBtn: { alignSelf: 'flex-start', paddingVertical: Spacing.one },
  removeText: { color: '#F73558' },
  empty: { textAlign: 'center', marginTop: Spacing.six },
  pad: { height: Spacing.six },
});
