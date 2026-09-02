import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Appear } from '@/components/appear';
import { ReportMenu } from '@/components/report-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { getEventTheme } from '@/constants/event-themes';
import {
  BrandGradient,
  BrandGradientLocations,
  Brand,
  DisplayFont,
  MaxContentWidth,
  OnBrand,
  Spacing,
  StateGo,
} from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { tapLight } from '@/lib/haptics';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Ev = Pick<Tables<'events'>, 'slug' | 'title' | 'starts_at' | 'venue_name' | 'timezone' | 'cover_url' | 'theme'>;

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('');
}

export default function PublicProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useAuth();
  const [profile, setProfile] = useState<Pick<Tables<'profiles'>, 'display_name' | 'avatar_url' | 'city' | 'created_at'> | null>(null);
  const [events, setEvents] = useState<Ev[]>([]);
  const [status, setStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const isMe = session?.user.id === id;

  const load = useCallback(async () => {
    const now = new Date().toISOString();
    const [pRes, eRes, sRes] = await Promise.all([
      supabase.from('profiles').select('display_name, avatar_url, city, created_at').eq('id', id).maybeSingle(),
      supabase
        .from('events')
        .select('slug, title, starts_at, venue_name, timezone, cover_url, theme')
        .eq('host_id', id)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .gte('starts_at', now)
        .order('starts_at', { ascending: true })
        .limit(10),
      session && !isMe ? supabase.rpc('friend_status', { p_other: id }) : Promise.resolve({ data: 'none' }),
    ]);
    if (pRes.data) setProfile(pRes.data);
    setEvents((eRes.data ?? []) as Ev[]);
    setStatus(typeof sRes.data === 'string' ? sRes.data : 'none');
    setLoading(false);
  }, [id, session, isMe]);

  useEffect(() => {
    load();
  }, [load]);

  const addFriend = async () => {
    if (!session) {
      router.push('/profile');
      return;
    }
    tapLight();
    setStatus('pending_out');
    const { data } = await supabase.rpc('request_friend', { p_other: id });
    if (typeof data === 'string') setStatus(data);
  };
  const accept = async () => {
    tapLight();
    setStatus('friends');
    await supabase.rpc('respond_friend', { p_other: id, p_accept: true });
  };
  const removeFriend = async () => {
    setStatus('none');
    await supabase.rpc('remove_friend', { p_other: id });
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }

  const name = profile?.display_name ?? 'Someone';
  const since = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} contentFit="cover" />
            ) : (
              <ThemedText style={styles.avatarText}>{initials(name)}</ThemedText>
            )}
          </View>
          <ThemedText style={styles.name}>{name}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {[profile?.city, since ? `Since ${since}` : null].filter(Boolean).join('  ·  ')}
          </ThemedText>
        </View>

        {!isMe ? (
          <View style={styles.actions}>
            {status === 'friends' ? (
              <Pressable style={[styles.btn, styles.ghost]} onPress={removeFriend}>
                <ThemedText type="smallBold" style={{ color: StateGo }}>
                  ✓ Friends
                </ThemedText>
              </Pressable>
            ) : status === 'pending_in' ? (
              <Pressable style={[styles.btn, styles.primary]} onPress={accept}>
                <ThemedText type="smallBold" style={styles.onBrand}>
                  Accept request
                </ThemedText>
              </Pressable>
            ) : status === 'pending_out' ? (
              <Pressable style={[styles.btn, styles.ghost]} disabled>
                <ThemedText type="smallBold" themeColor="textSecondary">
                  Requested
                </ThemedText>
              </Pressable>
            ) : (
              <Pressable style={[styles.btn, styles.primary]} onPress={addFriend}>
                <ThemedText type="smallBold" style={styles.onBrand}>
                  + Add friend
                </ThemedText>
              </Pressable>
            )}
            <Pressable
              style={[styles.btn, styles.ghost]}
              onPress={() => router.push({ pathname: '/dm/[id]', params: { id, name } })}>
              <ThemedText type="smallBold">💬 Message</ThemedText>
            </Pressable>
            <View style={styles.moreBtn}>
              <ReportMenu
                targetType="user"
                targetId={id}
                targetOwnerId={id}
                targetName={name}
                onBlocked={() => router.back()}
                tint="#EFF6EE"
              />
            </View>
          </View>
        ) : null}

        {events.length > 0 ? (
          <View style={styles.section}>
            <ThemedText type="smallBold" themeColor="textSecondary" style={styles.kicker}>
              HOSTING
            </ThemedText>
            {events.map((e, i) => {
              const vibe = getEventTheme(e.theme);
              return (
                <Appear key={e.slug} index={i}>
                  <Pressable
                    style={styles.eventRow}
                    onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: e.slug } })}>
                    {e.cover_url ? (
                      <Image source={{ uri: e.cover_url }} style={styles.eventThumb} contentFit="cover" />
                    ) : (
                      <LinearGradient
                        colors={vibe.gradient}
                        locations={BrandGradientLocations}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.eventThumb}
                      />
                    )}
                    <View style={styles.flex}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {e.title}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                        {e.starts_at
                          ? new Date(e.starts_at).toLocaleDateString(undefined, {
                              weekday: 'short', day: 'numeric', month: 'short', timeZone: e.timezone,
                            })
                          : 'Date TBA'}
                        {e.venue_name ? ` · ${e.venue_name}` : ''}
                      </ThemedText>
                    </View>
                  </Pressable>
                </Appear>
              );
            })}
          </View>
        ) : null}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: Spacing.one, paddingTop: Spacing.three },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#243527',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: Spacing.two,
  },
  avatarImg: { width: '100%', height: '100%' },
  avatarText: { fontFamily: DisplayFont, fontSize: 28, color: '#EFF6EE' },
  name: { fontFamily: DisplayFont, fontSize: 26, color: '#EFF6EE' },
  actions: { flexDirection: 'row', gap: Spacing.two },
  btn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.three, borderRadius: 999 },
  primary: { backgroundColor: Brand },
  ghost: { backgroundColor: '#243527', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  moreBtn: {
    backgroundColor: '#243527',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: Spacing.two,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onBrand: { color: OnBrand },
  section: { gap: Spacing.two },
  kicker: { letterSpacing: 2, fontSize: 11 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: '#19231B',
    borderRadius: 16,
    padding: Spacing.two,
  },
  eventThumb: { width: 56, height: 56, borderRadius: 12 },
  flex: { flex: 1 },
});
