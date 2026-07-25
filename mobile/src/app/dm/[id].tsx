import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { Brand, MaxContentWidth, OnBrand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export default function DmThreadScreen() {
  const { id: other, name } = useLocalSearchParams<{ id: string; name?: string }>();
  const theme = useTheme();
  const { session } = useAuth();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const me = session.user.id;
    const { data } = await supabase
      .from('dm_messages')
      .select('id, sender_id, body, created_at')
      .or(
        `and(sender_id.eq.${me},recipient_id.eq.${other}),and(sender_id.eq.${other},recipient_id.eq.${me})`,
      )
      .order('created_at', { ascending: true })
      .limit(200);
    setMessages((data ?? []) as Msg[]);
    setLoading(false);
    // Mark their messages read.
    await supabase
      .from('dm_messages')
      .update({ read_at: new Date().toISOString() })
      .eq('sender_id', other)
      .eq('recipient_id', me)
      .is('read_at', null);
  }, [session, other]);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    const b = text.trim();
    if (!b || !session || sending) return;
    setSending(true);
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      sender_id: session.user.id,
      body: b,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setText('');
    const { error } = await supabase
      .from('dm_messages')
      .insert({ sender_id: session.user.id, recipient_id: other, body: b });
    setSending(false);
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(b);
    } else {
      load();
    }
  };

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in to message.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}>
        {name ? (
          <ThemedText type="smallBold" style={styles.header}>
            {name}
          </ThemedText>
        ) : null}
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: false })}>
          {loading ? (
            <ActivityIndicator color={Brand} style={styles.loader} />
          ) : messages.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.empty}>
              Say hi 👋
            </ThemedText>
          ) : (
            messages.map((m) => {
              const mine = m.sender_id === session.user.id;
              return (
                <View key={m.id} style={[styles.bubbleRow, mine ? styles.mineRow : styles.theirRow]}>
                  <View style={[styles.bubble, mine ? styles.mine : styles.their]}>
                    <ThemedText style={mine ? styles.mineText : undefined}>{m.body}</ThemedText>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>

        <View style={[styles.composer, { backgroundColor: theme.background }]}>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            placeholder="Message…"
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
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  header: {
    textAlign: 'center',
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  loader: { marginTop: Spacing.six },
  empty: { textAlign: 'center', marginTop: Spacing.six },
  bubbleRow: { flexDirection: 'row' },
  mineRow: { justifyContent: 'flex-end' },
  theirRow: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  mine: { backgroundColor: Brand, borderBottomRightRadius: 4 },
  their: { backgroundColor: '#243527', borderBottomLeftRadius: 4 },
  mineText: { color: OnBrand },
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
  sendLabel: { color: OnBrand },
});
