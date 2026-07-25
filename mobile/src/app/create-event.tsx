import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EVENT_THEMES } from '@/constants/event-themes';
import { Brand, BrandGradientLocations, DisplayFont, Gold, MaxContentWidth, OnBrand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { tapMedium } from '@/lib/haptics';
import { formatMoney } from '@/lib/money';
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
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [vibe, setVibe] = useState('forest');
  const [aiPrompt, setAiPrompt] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [isTicketed, setIsTicketed] = useState(false);
  const [suggestedTiers, setSuggestedTiers] = useState<{ name: string; price_minor: number }[]>([]);
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

  const draftIt = async () => {
    if (!aiPrompt.trim() || drafting) return;
    setError(null);
    tapMedium();
    setDrafting(true);
    const { data, error: fnError } = await supabase.functions.invoke('draft-event', {
      body: { prompt: aiPrompt.trim() },
    });
    setDrafting(false);
    const d = data?.draft;
    if (fnError || !d) {
      setError('Studio is busy — try again, or fill it in yourself.');
      return;
    }
    if (d.title) setTitle(d.title);
    if (d.description) setDescription(d.description);
    if (d.theme) setVibe(d.theme);
    setIsTicketed(!!d.is_ticketed);
    setSuggestedTiers(Array.isArray(d.tiers) ? d.tiers : []);
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
        coverUrl = (await uploadImage('event-covers', session.user.id, coverImage)).url;
      }
      const slug = generateSlug(title);
      const { data: created, error: insertError } = await supabase
        .from('events')
        .insert({
          host_id: session.user.id,
          title: title.trim(),
          slug,
          description: description.trim() || null,
          venue_name: venueName.trim() || null,
          address: address.trim() || null,
          starts_at: startsAt,
          cover_url: coverUrl,
          playlist_url: playlistUrl.trim() || null,
          visibility,
          theme: vibe,
          is_ticketed: isTicketed || suggestedTiers.length > 0,
          status,
        })
        .select('id')
        .single();
      if (insertError || !created) {
        setError(insertError?.message ?? 'Could not create the event.');
        return;
      }
      // Create the AI-suggested ticket tiers so the event is ready to sell.
      if (suggestedTiers.length > 0) {
        await supabase.from('ticket_tiers').insert(
          suggestedTiers.map((t, i) => ({
            event_id: created.id,
            name: t.name,
            price_minor: t.price_minor,
            currency: 'UGX',
            quantity: 200,
            position: i,
          })),
        );
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
    { color: theme.text, backgroundColor: theme.background },
  ];

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <ThemedText style={styles.introTitle}>Throw something{'\n'}worth showing up for.</ThemedText>
        </View>

        <ThemedView type="backgroundElement" style={styles.studio}>
          <SectionLabel color={Gold}>✨ EVENT STUDIO</SectionLabel>
          <ThemedText type="small" themeColor="textSecondary">
            Describe your event in a sentence — the studio drafts the rest.
          </ThemedText>
          <TextInput
            style={[styles.input, styles.studioInput, { color: theme.text, backgroundColor: theme.background }]}
            placeholder="e.g. amapiano rooftop party this Friday, 30k entry"
            placeholderTextColor={theme.textSecondary}
            value={aiPrompt}
            onChangeText={setAiPrompt}
            multiline
          />
          <Pressable
            style={[styles.studioBtn, { opacity: drafting || !aiPrompt.trim() ? 0.5 : 1 }]}
            disabled={drafting || !aiPrompt.trim()}
            onPress={draftIt}>
            <ThemedText type="smallBold" style={styles.studioLabel}>
              {drafting ? 'Drafting…' : '✨ Draft it for me'}
            </ThemedText>
          </Pressable>
          {suggestedTiers.length > 0 ? (
            <ThemedText type="small" themeColor="textSecondary">
              Suggested tickets:{' '}
              {suggestedTiers.map((t) => `${t.name} ${formatMoney(t.price_minor, 'UGX')}`).join('  ·  ')} — added on publish, editable later.
            </ThemedText>
          ) : null}
        </ThemedView>

        {/* Cover hero — the first thing people see, so we make it the star. */}
        <Pressable onPress={chooseCover} style={styles.coverPicker}>
          {coverUri ? (
            <>
              <Image source={{ uri: coverUri }} style={styles.coverPreview} contentFit="cover" />
              <View style={styles.coverChange}>
                <ThemedText type="smallBold" style={styles.coverChangeText}>
                  Tap to change
                </ThemedText>
              </View>
            </>
          ) : (
            <View style={styles.coverPlaceholder}>
              <LinearGradient
                colors={['rgba(29,201,107,0.16)', 'rgba(17,24,17,0.4)']}
                style={StyleSheet.absoluteFill}
              />
              <ThemedText style={styles.coverGlyph}>📷</ThemedText>
              <ThemedText type="smallBold">Add a bold cover photo</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.coverHint}>
                It&apos;s the first thing people see in the feed
              </ThemedText>
            </View>
          )}
        </Pressable>

        <View style={styles.section}>
          <SectionLabel>THE BASICS</SectionLabel>
          <TextInput
            style={inputStyle}
            placeholder="Event title"
            placeholderTextColor={theme.textSecondary}
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[...inputStyle, styles.multiline]}
            placeholder="What's the vibe? Tell people why they can't miss it."
            placeholderTextColor={theme.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>

        <View style={styles.section}>
          <SectionLabel>WHERE &amp; WHEN</SectionLabel>
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
        </View>

        <View style={styles.section}>
          <SectionLabel>SET THE MOOD</SectionLabel>
          <TextInput
            style={inputStyle}
            placeholder="Playlist link (Spotify or YouTube)"
            placeholderTextColor={theme.textSecondary}
            value={playlistUrl}
            onChangeText={setPlaylistUrl}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        <View style={styles.section}>
          <SectionLabel>PICK A VIBE</SectionLabel>
          <ThemedText type="small" themeColor="textSecondary">
            Sets your event&apos;s colours — shows on the page and when there&apos;s no cover photo.
          </ThemedText>
          <View style={styles.vibeRow}>
            {EVENT_THEMES.map((t) => {
              const on = vibe === t.key;
              return (
                <Pressable key={t.key} onPress={() => setVibe(t.key)} style={styles.vibeItem}>
                  <LinearGradient
                    colors={t.gradient}
                    locations={BrandGradientLocations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.vibeSwatch, on && styles.vibeSwatchOn]}
                  />
                  <ThemedText type="small" themeColor={on ? 'text' : 'textSecondary'}>
                    {t.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>WHO CAN SEE IT</SectionLabel>
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
          <ThemedText type="small" themeColor="textSecondary">
            {VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.hint}
          </ThemedText>
        </View>

        {error ? <ThemedText type="small">{error}</ThemedText> : null}

        <Pressable
          style={[styles.primaryButton, { opacity: busy ? 0.5 : 1 }]}
          disabled={busy}
          onPress={() => submit('published')}>
          <ThemedText type="smallBold" style={styles.publishLabel}>
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
    gap: Spacing.four,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingBottom: Spacing.six,
  },
  intro: {
    marginBottom: Spacing.one,
  },
  introTitle: {
    fontFamily: DisplayFont,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.5,
    color: '#EFF6EE',
  },
  coverPicker: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 20,
    overflow: 'hidden',
  },
  coverPreview: {
    width: '100%',
    height: '100%',
  },
  coverChange: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    backgroundColor: 'rgba(7,15,10,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
  },
  coverChangeText: {
    color: '#fff',
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 20,
  },
  coverGlyph: {
    fontSize: 30,
    marginBottom: Spacing.one,
  },
  coverHint: {
    textAlign: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  studio: {
    borderRadius: 20,
    padding: Spacing.four,
    gap: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(233,196,106,0.28)',
  },
  studioInput: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  studioBtn: {
    backgroundColor: Gold,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  studioLabel: {
    color: '#1A1403',
  },
  vibeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
    marginTop: Spacing.one,
  },
  vibeItem: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  vibeSwatch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  vibeSwatchOn: {
    borderColor: '#EFF6EE',
  },
  input: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  multiline: {
    minHeight: 96,
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  visibilitySelected: {
    backgroundColor: Brand,
    borderColor: 'transparent',
  },
  selectedLabel: {
    color: OnBrand,
  },
  primaryButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    padding: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  publishLabel: {
    color: OnBrand,
  },
  draftLink: {
    textAlign: 'center',
  },
});
