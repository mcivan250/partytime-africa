import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { tapSuccess } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Member = { id: string; name: string; city: string | null; suspended: boolean; created_at: string };
type Post = { id: string; author_name: string; body: string; image_path: string | null; created_at: string };
type Venue = { id: string; name: string; kind: string; city: string | null };

const VENUE_KINDS = ['bar', 'restaurant', 'club', 'lounge'];

export default function AdminScreen() {
  const { session } = useAuth();
  const [tab, setTab] = useState<'members' | 'content' | 'venues'>('members');
  const [members, setMembers] = useState<Member[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
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

  const load = useCallback(async () => {
    const [mRes, pRes, vRes] = await Promise.all([
      supabase.rpc('admin_members'),
      supabase.rpc('admin_recent_posts'),
      supabase.from('venues').select('id, name, kind, city').order('name'),
    ]);
    if (mRes.error && pRes.error) {
      setDenied(true);
    } else {
      setMembers((mRes.data ?? []) as Member[]);
      setPosts((pRes.data ?? []) as Post[]);
      setVenues((vRes.data ?? []) as Venue[]);
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
      [...prev, { id: (data as string) ?? Math.random().toString(), name: vName.trim(), kind: vKind, city: vCity.trim() || 'Kampala' }].sort(
        (a, b) => a.name.localeCompare(b.name),
      ),
    );
    setVName('');
    setVAddress('');
    setVDesc('');
    setVPhone('');
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
        <Pressable style={[styles.segItem, tab === 'venues' && styles.segOn]} onPress={() => setTab('venues')}>
          <ThemedText type="smallBold" style={tab === 'venues' ? styles.segOnText : styles.segText}>
            Venues
          </ThemedText>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tab === 'venues' ? (
          <>
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
                <View style={styles.flex}>
                  <ThemedText type="smallBold">{v.name}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {v.kind} · {v.city ?? 'Kampala'}
                  </ThemedText>
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
});
