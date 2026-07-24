import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Post = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: { display_name: string | null } | null;
};
type Reply = {
  id: string;
  body: string;
  created_at: string;
  author: { display_name: string | null } | null;
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

export default function PostThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { session } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const [postRes, repliesRes] = await Promise.all([
      supabase
        .from('feed_posts')
        .select('id, author_id, body, created_at, author:profiles(display_name)')
        .eq('id', id)
        .maybeSingle(),
      supabase
        .from('feed_replies')
        .select('id, body, created_at, author:profiles(display_name)')
        .eq('post_id', id)
        .order('created_at', { ascending: true }),
    ]);
    if (postRes.data) setPost(postRes.data as unknown as Post);
    if (repliesRes.data) setReplies(repliesRes.data as unknown as Reply[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (!session || !text.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from('feed_replies')
      .insert({ post_id: id, author_id: session.user.id, body: text.trim() });
    setSending(false);
    if (!error) {
      setText('');
      await load();
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {post ? (
            <ThemedView type="backgroundElement" style={styles.postCard}>
              <ThemedText type="smallBold">{post.author?.display_name ?? 'Someone'}</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                {timeAgo(post.created_at)} ago
              </ThemedText>
              <ThemedText style={styles.postBody}>{post.body}</ThemedText>
            </ThemedView>
          ) : (
            <ThemedText style={styles.center}>Post not found.</ThemedText>
          )}

          <ThemedText type="smallBold" themeColor="textSecondary" style={styles.repliesLabel}>
            {replies.length > 0 ? `${replies.length} REPL${replies.length === 1 ? 'Y' : 'IES'}` : 'NO REPLIES YET'}
          </ThemedText>

          {replies.map((r) => (
            <View key={r.id} style={styles.reply}>
              <View style={styles.replyBar} />
              <View style={styles.flex}>
                <View style={styles.replyHead}>
                  <ThemedText type="smallBold">{r.author?.display_name ?? 'Someone'}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {timeAgo(r.created_at)} ago
                  </ThemedText>
                </View>
                <ThemedText style={styles.replyBody}>{r.body}</ThemedText>
              </View>
            </View>
          ))}
        </ScrollView>

        {session ? (
          <View style={[styles.composer, { backgroundColor: theme.background }]}>
            <TextInput
              style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
              placeholder="Reply…"
              placeholderTextColor={theme.textSecondary}
              value={text}
              onChangeText={setText}
              multiline
            />
            <Pressable
              style={[styles.send, { opacity: sending || !text.trim() ? 0.5 : 1 }]}
              disabled={sending || !text.trim()}
              onPress={send}>
              <ThemedText type="smallBold" style={styles.sendLabel}>
                Send
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <ThemedText type="small" themeColor="textSecondary" style={styles.signInHint}>
            Sign in to join the conversation.
          </ThemedText>
        )}
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
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
    padding: Spacing.four,
    gap: Spacing.three,
  },
  postCard: {
    borderRadius: 18,
    padding: Spacing.four,
    gap: Spacing.half,
  },
  postBody: {
    lineHeight: 22,
    marginTop: Spacing.two,
  },
  repliesLabel: {
    letterSpacing: 2,
    fontSize: 11,
    marginTop: Spacing.two,
  },
  reply: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  replyBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.10)',
  },
  replyHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  replyBody: {
    lineHeight: 21,
    marginTop: 2,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.two,
    padding: Spacing.three,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  input: {
    flex: 1,
    borderRadius: 16,
    padding: Spacing.three,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  send: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  sendLabel: {
    color: OnBrand,
  },
  signInHint: {
    textAlign: 'center',
    padding: Spacing.four,
  },
});
