import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { SectionLabel } from '@/components/section-label';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { EVENT_THEMES } from '@/constants/event-themes';
import { Brand, BrandGradientLocations, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuth } from '@/lib/auth-context';
import { tapMedium, tapSuccess } from '@/lib/haptics';
import { pickImage, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Visibility = Tables<'events'>['visibility'];

const VISIBILITY_OPTIONS: { value: Visibility; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'unlisted', label: 'Unlisted' },
  { value: 'private', label: 'Private' },
];

// "2026-08-01 20:00" in the device's timezone → ISO for the DB.
function parseStartsAt(text: string): string | null | undefined {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed.replace(' ', 'T'));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}
function formatForInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EditEventScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const theme = useTheme();
  const { session } = useAuth();

  const [event, setEvent] = useState<Tables<'events'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [startsAtText, setStartsAtText] = useState('');
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [vibe, setVibe] = useState('forest');
  const [allowPlusOnes, setAllowPlusOnes] = useState(false);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [coverImage, setCoverImage] = useState<Awaited<ReturnType<typeof pickImage>>>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('events').select('*').eq('id', eventId).maybeSingle();
    if (data) {
      setEvent(data);
      setTitle(data.title);
      setDescription(data.description ?? '');
      setVenueName(data.venue_name ?? '');
      setAddress(data.address ?? '');
      setStartsAtText(formatForInput(data.starts_at));
      setPlaylistUrl(data.playlist_url ?? '');
      setVisibility(data.visibility);
      setVibe(data.theme);
      setAllowPlusOnes(data.allow_plus_ones);
      setCoverUri(data.cover_url);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const chooseCover = async () => {
    try {
      const picked = await pickImage([16, 9]);
      if (!picked) return;
      setCoverImage(picked);
      setCoverUri(`data:${picked.mimeType};base64,${picked.base64}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not pick an image.');
    }
  };

  const save = async () => {
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
    if (!event || !session) return;
    tapMedium();
    setBusy(true);
    try {
      let coverUrl = event.cover_url;
      if (coverImage) {
        coverUrl = (await uploadImage('event-covers', session.user.id, coverImage)).url;
      }
      const { error: rpcError } = await supabase.rpc('host_update_event', {
        p_id: event.id,
        p_title: title.trim(),
        p_description: description.trim(),
        p_venue_name: venueName.trim(),
        p_venue_id: event.venue_id,
        p_address: address.trim(),
        p_starts_at: startsAt,
        p_theme: vibe,
        p_cover_url: coverUrl,
        p_visibility: visibility,
        p_allow_plus_ones: allowPlusOnes,
        p_playlist_url: playlistUrl.trim(),
      });
      if (rpcError) {
        setError(rpcError.message);
        return;
      }
      tapSuccess();
      router.replace({ pathname: '/e/[slug]', params: { slug: event.slug } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save changes.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }
  if (!event || (session && event.host_id !== session.user.id)) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText>You don&apos;t manage this event.</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <ThemedText type="title">Edit event</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            Fix the photo, wording or details — your link and tickets stay the same.
          </ThemedText>

          <Pressable onPress={chooseCover} style={styles.coverPicker}>
            {coverUri ? (
              <View>
                <Image source={{ uri: coverUri }} style={styles.coverPreview} contentFit="cover" />
                <View style={styles.coverChange}>
                  <ThemedText type="smallBold" style={styles.onBrand}>
                    Change photo
                  </ThemedText>
                </View>
              </View>
            ) : (
              <View style={styles.coverPlaceholder}>
                <ThemedText style={styles.coverGlyph}>📷</ThemedText>
                <ThemedText type="smallBold">Add a cover photo</ThemedText>
              </View>
            )}
          </Pressable>

          <SectionLabel>TITLE</SectionLabel>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor={theme.textSecondary}
          />

          <SectionLabel>DESCRIPTION</SectionLabel>
          <TextInput
            style={[styles.input, styles.multiline, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell guests what to expect"
            placeholderTextColor={theme.textSecondary}
            multiline
          />

          <SectionLabel>WHEN (YYYY-MM-DD HH:MM)</SectionLabel>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={startsAtText}
            onChangeText={setStartsAtText}
            placeholder="2026-08-01 20:00"
            placeholderTextColor={theme.textSecondary}
          />

          <SectionLabel>VENUE</SectionLabel>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={venueName}
            onChangeText={setVenueName}
            placeholder="Venue name"
            placeholderTextColor={theme.textSecondary}
          />
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Address / area"
            placeholderTextColor={theme.textSecondary}
          />

          <SectionLabel>VIBE</SectionLabel>
          <View style={styles.chips}>
            {EVENT_THEMES.map((t) => {
              const on = vibe === t.key;
              return (
                <Pressable
                  key={t.key}
                  onPress={() => setVibe(t.key)}
                  style={[styles.vibeChip, on && { borderColor: t.accent, borderWidth: 2 }]}>
                  <LinearGradient
                    colors={t.gradient}
                    locations={BrandGradientLocations}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.vibeSwatch}
                  />
                  <ThemedText type="small">{t.name}</ThemedText>
                </Pressable>
              );
            })}
          </View>

          <SectionLabel>WHO CAN SEE IT</SectionLabel>
          <View style={styles.chips}>
            {VISIBILITY_OPTIONS.map((v) => (
              <Pressable
                key={v.value}
                onPress={() => setVisibility(v.value)}
                style={[styles.chip, visibility === v.value && styles.chipOn]}>
                <ThemedText type="small" style={visibility === v.value ? styles.onBrand : undefined}>
                  {v.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>

          <View style={styles.switchRow}>
            <View style={styles.flex}>
              <ThemedText type="smallBold">Allow plus-ones</ThemedText>
              <ThemedText type="small" themeColor="textSecondary">
                Guests can bring named friends.
              </ThemedText>
            </View>
            <Switch
              value={allowPlusOnes}
              onValueChange={setAllowPlusOnes}
              trackColor={{ true: StateGo, false: '#3a4a3d' }}
              thumbColor={OnBrand}
            />
          </View>

          <SectionLabel>PLAYLIST LINK (OPTIONAL)</SectionLabel>
          <TextInput
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            value={playlistUrl}
            onChangeText={setPlaylistUrl}
            placeholder="Spotify / Apple Music link"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="none"
          />

          {error ? (
            <ThemedText type="small" style={styles.err}>
              {error}
            </ThemedText>
          ) : null}

          <Pressable style={[styles.saveBtn, { opacity: busy ? 0.6 : 1 }]} disabled={busy} onPress={save}>
            {busy ? (
              <ActivityIndicator color={OnBrand} />
            ) : (
              <ThemedText type="smallBold" style={styles.onBrand}>
                Save changes
              </ThemedText>
            )}
          </Pressable>
          <View style={styles.pad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four },
  content: {
    padding: Spacing.four,
    gap: Spacing.two,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  coverPicker: { marginTop: Spacing.two },
  coverPreview: { width: '100%', height: 180, borderRadius: 18 },
  coverChange: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.three,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  coverPlaceholder: {
    height: 180,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  coverGlyph: { fontSize: 34 },
  input: {
    borderRadius: 14,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  chipOn: { backgroundColor: Brand, borderColor: 'transparent' },
  vibeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 999,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  vibeSwatch: { width: 18, height: 18, borderRadius: 9 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  onBrand: { color: OnBrand },
  err: { color: '#F2C14E' },
  saveBtn: {
    backgroundColor: Brand,
    borderRadius: 16,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  pad: { height: Spacing.six },
});
