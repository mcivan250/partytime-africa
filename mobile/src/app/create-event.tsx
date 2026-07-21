import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { generateSlug } from '@/lib/slug';
import { pickImage, uploadImage } from '@/lib/storage';
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
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<Awaited<ReturnType<typeof pickImage>>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>Sign in on the Profile tab to host an event.</ThemedText>
      </ThemedView>
    );
  }

  const chooseCover = async () => {
    setError(null);
    try {
      const picked = await pickImage([16, 9]);
      if (picked) {
        setCoverImage(picked);
        setCoverUri(`data:${picked.mimeType};base64,${picked.base64}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not open the photo library.');
    }
  };

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
    try {
      let coverUrl: string | null = null;
      if (coverImage) {
        coverUrl = await uploadImage('event-covers', session.user.id, coverImage);
      }
      const slug = generateSlug(title);
      const { error: insertError } = await supabase.from('events').insert({
        host_id: session.user.id,
        title: title.trim(),
        slug,
        description: description.trim() || null,
        venue_name: venueName.trim() || null,
        address: address.trim() || null,
        starts_at: startsAt,
        cover_url: coverUrl,
        visibility,
        status,
      });
      if (insertError) {
        setError(insertError.message);
        return;
      }
      router.replace({ pathname: '/e/[slug]', params: { slug } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = [
    styles.input,
    { color: theme.text, backgroundColor: theme.backgroundElement },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={chooseCover} style={styles.coverPicker}>
          {coverUri ? (
            <Image source={{ uri: coverUri }} style={styles.coverPreview} contentFit="cover" />
          ) : (
            <ThemedView type="backgroundElement" style={styles.coverPlaceholder}>
              <ThemedText type="small">+ Add a cover photo</ThemedText>
            </ThemedView>
          )}
        </Pressable>
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
  coverPicker: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#8886',
    borderRadius: Spacing.three,
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
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: Brand,
  },
  visibilitySelected: {
    backgroundColor: Brand,
  },
  selectedLabel: {
    color: '#fff',
  },
  primaryButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    padding: Spacing.three,
    alignItems: 'center',
  },
  draftLink: {
    textAlign: 'center',
  },
});
