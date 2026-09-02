import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Appear } from '@/components/appear';
import { EmptyState } from '@/components/empty-state';
import { ReportMenu } from '@/components/report-menu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomNavInset, Brand, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { tapLight } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-context';
import { pickImage, publicUrl, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

const CITY = 'Kampala';

type Post = {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar: string | null;
  body: string;
  tag: string | null;
  image_path: string | null;
  event_id: string | null;
  event_slug: string | null;
  event_title: string | null;
  like_count: number;
  reply_count: number;
  i_reacted: boolean;
  created_at: string;
};

const TAGS: { key: string; label: string }[] = [
  { key: 'going', label: '🔥 Going out' },
  { key: 'looking', label: '🎟 Need tickets' },
  { key: 'selling', label: '💸 Got tickets' },
  { key: 'vibe', label: '📍 Vibe check' },
  { key: 'shoutout', label: '📣 Shoutout' },
];

function tagLabel(key: string | null) {
  return TAGS.find((t) => t.key === key)?.label ?? null;
}

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

export function CityFeed() {
  const theme = useTheme();
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [body, setBody] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Awaited<ReturnType<typeof pickImage>>>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('city_feed', { p_city: CITY });
    setPosts((data ?? []) as Post[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const choosePhoto = async () => {
    try {
      const img = await pickImage([4, 5]);
      if (img) {
        setPhoto(img);
        setPhotoUri(`data:${img.mimeType};base64,${img.base64}`);
      }
    } catch {
      // ignore — user can try again
    }
  };

  const post = async () => {
    if (!session) {
      router.push('/profile');
      return;
    }
    const text = body.trim();
    if (!text && !photo) return;
    setPosting(true);
    let imagePath: string | null = null;
    if (photo) {
      try {
        imagePath = (await uploadImage('feed', session.user.id, photo)).path;
      } catch {
        setPosting(false);
        return;
      }
    }
    const { error } = await supabase.from('feed_posts').insert({
      author_id: session.user.id,
      city: CITY,
      body: text || '📷',
      tag,
      image_path: imagePath,
    });
    setPosting(false);
    if (!error) {
      setBody('');
      setTag(null);
      setPhoto(null);
      setPhotoUri(null);
      await load();
    }
  };

  const toggleLike = async (p: Post) => {
    if (!session) {
      router.push('/profile');
      return;
    }
    tapLight();
    const next = !p.i_reacted;
    setPosts((prev) =>
      prev.map((x) =>
        x.id === p.id
          ? { ...x, i_reacted: next, like_count: Math.max(0, x.like_count + (next ? 1 : -1)) }
          : x,
      ),
    );
    const { error } = next
      ? await supabase.from('feed_reactions').insert({ post_id: p.id, profile_id: session.user.id })
      : await supabase
          .from('feed_reactions')
          .delete()
          .eq('post_id', p.id)
          .eq('profile_id', session.user.id);
    if (error) {
      setPosts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    }
  };

  const composer = (
    <View style={styles.composer}>
      <TextInput
        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
        placeholder="What's the move tonight? Ask, share, hype…"
        placeholderTextColor={theme.textSecondary}
        value={body}
        onChangeText={setBody}
        multiline
        maxLength={500}
      />
      <View style={styles.tagRow}>
        {TAGS.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setTag(tag === t.key ? null : t.key)}
            style={[styles.tagChip, tag === t.key && styles.tagChipOn]}>
            <ThemedText type="small" style={tag === t.key ? styles.tagOnText : undefined}>
              {t.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      {photoUri ? (
        <Pressable onPress={() => { setPhoto(null); setPhotoUri(null); }} style={styles.photoPreviewWrap}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} contentFit="cover" />
          <View style={styles.photoRemove}>
            <ThemedText type="smallBold" style={styles.photoRemoveText}>✕ Remove</ThemedText>
          </View>
        </Pressable>
      ) : null}

      <View style={styles.composerActions}>
        <Pressable style={styles.photoBtn} onPress={choosePhoto}>
          <ThemedText type="smallBold" themeColor="textSecondary">📷 Photo</ThemedText>
        </Pressable>
        <Pressable
          style={[styles.postButton, { opacity: posting || (!body.trim() && !photo) ? 0.5 : 1 }]}
          disabled={posting || (!body.trim() && !photo)}
          onPress={post}>
          <ThemedText type="smallBold" style={styles.postLabel}>
            {session ? 'Post to the feed' : 'Sign in to post'}
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );

  return (
    <FlatList
      data={loading ? [] : posts}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={composer}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.text} />
      }
      ListEmptyComponent={
        loading ? (
          <ActivityIndicator color={Brand} style={styles.loader} />
        ) : (
          <EmptyState
            glyph="🌙"
            title="The night's just starting"
            subtitle="Be the first to say something — who's pulling up tonight, who's got a spare ticket, where's the vibe?"
          />
        )
      }
      renderItem={({ item, index }) => (
        <Appear index={index}>
          <PostCard post={item} onLike={() => toggleLike(item)} onBlocked={load} />
        </Appear>
      )}
    />
  );
}

function PostCard({ post, onLike, onBlocked }: { post: Post; onLike: () => void; onBlocked: () => void }) {
  const label = tagLabel(post.tag);
  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.cardHead}>
        <Pressable
          style={styles.cardHeadMain}
          onPress={() => router.push({ pathname: '/u/[id]', params: { id: post.author_id } })}>
          <View style={styles.avatar}>
            <ThemedText style={styles.avatarText}>{initials(post.author_name)}</ThemedText>
          </View>
          <View style={styles.flex}>
            <ThemedText type="smallBold">{post.author_name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {timeAgo(post.created_at)} ago
            </ThemedText>
          </View>
        </Pressable>
        {label ? (
          <View style={styles.flair}>
            <ThemedText type="small" style={styles.flairText}>
              {label}
            </ThemedText>
          </View>
        ) : null}
        <ReportMenu
          targetType="feed_post"
          targetId={post.id}
          targetOwnerId={post.author_id}
          targetName={post.author_name}
          onBlocked={onBlocked}
        />
      </View>

      <ThemedText style={styles.body}>{post.body}</ThemedText>

      {post.image_path ? (
        <Image
          source={{ uri: publicUrl('feed', post.image_path) }}
          style={styles.postImage}
          contentFit="cover"
        />
      ) : null}

      {post.event_id && post.event_slug ? (
        <Pressable
          style={styles.eventChip}
          onPress={() => router.push({ pathname: '/e/[slug]', params: { slug: post.event_slug! } })}>
          <ThemedText type="small" style={styles.eventChipText}>
            ✦ {post.event_title}
          </ThemedText>
        </Pressable>
      ) : null}

      <View style={styles.actions}>
        <Pressable onPress={onLike} hitSlop={8} style={styles.action}>
          <ThemedText type="smallBold" style={post.i_reacted ? styles.liked : styles.actionText}>
            🔥 {post.like_count > 0 ? post.like_count : 'Hype'}
          </ThemedText>
        </Pressable>
        <Pressable
          hitSlop={8}
          style={styles.action}
          onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}>
          <ThemedText type="smallBold" style={styles.actionText}>
            💬 {post.reply_count > 0 ? post.reply_count : 'Reply'}
          </ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: Spacing.three,
    paddingBottom: BottomNavInset,
    paddingTop: Spacing.one,
  },
  loader: {
    marginTop: Spacing.five,
  },
  empty: {
    textAlign: 'center',
    marginTop: Spacing.five,
    lineHeight: 20,
  },
  flex: {
    flex: 1,
  },
  composer: {
    gap: Spacing.two,
    marginBottom: Spacing.one,
  },
  input: {
    borderRadius: 16,
    padding: Spacing.three,
    minHeight: 60,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tagChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  tagChipOn: {
    backgroundColor: Brand,
    borderColor: 'transparent',
  },
  tagOnText: {
    color: OnBrand,
  },
  composerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  photoBtn: {
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    justifyContent: 'center',
  },
  postButton: {
    flex: 1,
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  postLabel: {
    color: OnBrand,
  },
  photoPreviewWrap: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 360,
  },
  photoRemove: {
    position: 'absolute',
    top: Spacing.two,
    right: Spacing.two,
    backgroundColor: 'rgba(7,15,10,0.7)',
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  photoRemoveText: {
    color: '#fff',
  },
  postImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    maxHeight: 420,
    borderRadius: 14,
    backgroundColor: '#243527',
  },
  card: {
    borderRadius: 18,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  cardHeadMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#243527',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: StateGo,
    fontSize: 13,
    fontWeight: '700',
  },
  flair: {
    backgroundColor: 'rgba(29,201,107,0.14)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  flairText: {
    color: StateGo,
  },
  body: {
    lineHeight: 21,
  },
  eventChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#243527',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  eventChipText: {
    color: StateGo,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.three,
    marginTop: Spacing.half,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    color: '#94A697',
  },
  liked: {
    color: StateGo,
  },
});
