import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { generateSlug } from '@/lib/slug';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Visibility = Tables<'events'>['visibility'];

const VISIBILITY_OPTIONS: { value: Visibility; label: string; hint: string }[] = [
  { value: 'public', label: 'Public', hint: 'Anyone can find it in the feed' },
  { value: 'unlisted', label: 'Unlisted', hint: 'Only people with the link' },
  { value: 'private', label: 'Private', hint: 'Only invited guests' },
];

// Accepts "2026-08-01 20:00" (device timezone); the DB stores timestamptz.
function parseStartsAt(text: string): string | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

export default function CreateEventScreen() {
  const theme = useTheme();
  const { session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [startsAtText, setStartsAtText] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in on the Profile tab to host an event.</ThemedText>
      </ThemedView>
    );
  }

  const submit = async (status: 'draft' | 'published') => {
    setError(null);
    if (!title.trim()) {
      setError('Give your event a title.');
      return;
    }
    const startsAt = parseStartsAt(startsAtText);
    if (startsAt === undefined) {
      setError('Could not read the date — use the format 2026-08-01 20:00');
      return;
    }
    setBusy(true);
    const slug = generateSlug(title);
    const { error: insertError } = await supabase.from('events').insert({
      host_id: session.user.id,
      title: title.trim(),
      slug,
      description: description.trim() || null,
      venue_name: venueName.trim() || null,
      address: address.trim() || null,
      starts_at: startsAt,
      visibility,
      status,
    });
    setBusy(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.replace({ pathname: '/event/[slug]', params: { slug } });
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <TextInput
          style={inputStyle}
          placeholder="Event title"
          placeholderTextColor={theme.textSecondary}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={[...inputStyle, styles.multiline]}
          placeholder="What's the vibe? (description)"
          placeholderTextColor={theme.textSecondary}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TextInput
          style={inputStyle}
          placeholder="Date & time — e.g. 2026-08-01 20:00"
          placeholderTextColor={theme.textSecondary}
          value={startsAtText}
          onChangeText={setStartsAtText}
          autoCapitalize="none"
        />
        <TextInput
          style={inputStyle}
          placeholder="Venue name"
          placeholderTextColor={theme.textSecondary}
          value={venueName}
          onChangeText={setVenueName}
        />
        <TextInput
          style={inputStyle}
          placeholder="Address"
          placeholderTextColor={theme.textSecondary}
          value={address}
          onChangeText={setAddress}
        />

        <ThemedText type="smallBold">Who can see it?</ThemedText>
        <View style={styles.visibilityRow}>
          {VISIBILITY_OPTIONS.map((option) => {
            const selected = visibility === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => setVisibility(option.value)}
                style={[styles.visibilityButton, selected && styles.visibilitySelected]}>
                <ThemedText type="smallBold" style={selected ? styles.selectedLabel : undefined}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ThemedText type="small">
          {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.hint}
        </ThemedText>

        {error ? <ThemedText type="small">{error}</ThemedText> : null}

        <Pressable
          style={[styles.primaryButton, { opacity: busy ? 0.5 : 1 }]}
          disabled={busy}
          onPress={() => submit('published')}>
          <ThemedText type="smallBold" style={styles.selectedLabel}>
            Publish event
          </ThemedText>
        </Pressable>
        <Pressable disabled={busy} onPress={() => submit('draft')}>
          <ThemedText type="link" style={styles.draftLink}>
            Save as draft instead
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  center: {
    justifyContent: 'center',
    padding: Spacing.four,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  input: {
    borderRadius: Spacing.two,
    padding: Spacing.three,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#8884',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  visibilityButton: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Spacing.two,
    borderWidth: 1,
    borderColor: '#208AEF',
  },
  visibilitySelected: {
    backgroundColor: '#208AEF',
  },
  selectedLabel: {
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: '#208AEF',
    borderRadius: Spacing.two,
    padding: Spacing.three,
    alignItems: 'center',
  },
  draftLink: {
    textAlign: 'center',
  },
});
