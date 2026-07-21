import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, OnBrand, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { pickImage, publicUrl, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

type Photo = { id: string; storage_path: string };

export function PhotoAlbum({ eventId }: { eventId: string }) {
  const { session } = useAuth();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('photos')
      .select('id, storage_path')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false })
      .limit(60);
    if (data) setPhotos(data);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const addPhoto = async () => {
    if (!session) return;
    setError(null);
    try {
      const picked = await pickImage([1, 1]);
      if (!picked) return;
      setBusy(true);
      const { path } = await uploadImage('event-photos', `${eventId}/${session.user.id}`, picked);
      const { error: insertError } = await supabase
        .from('photos')
        .insert({ event_id: eventId, profile_id: session.user.id, storage_path: path });
      if (insertError) {
        setError('Could not add your photo. The host may have photos turned off.');
      } else {
        await load();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not add your photo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.icon}>📸</ThemedText>
        <ThemedText type="subtitle">Moments</ThemedText>
      </View>

      {photos.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          No photos yet. Add the first shot from the party.
        </ThemedText>
      ) : (
        <View style={styles.grid}>
          {photos.map((p) => (
            <Image
              key={p.id}
              source={{ uri: publicUrl('event-photos', p.storage_path) }}
              style={styles.thumb}
              contentFit="cover"
            />
          ))}
        </View>
      )}

      {error ? <ThemedText type="small">{error}</ThemedText> : null}

      {session ? (
        <Pressable
          style={[styles.addButton, { opacity: busy ? 0.5 : 1 }]}
          disabled={busy}
          onPress={addPhoto}>
          <ThemedText type="smallBold" style={styles.addLabel}>
            {busy ? 'Uploading…' : '+ Add a photo'}
          </ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  icon: {
    fontSize: 18,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  thumb: {
    width: '31.5%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: '#243527',
  },
  addButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  addLabel: {
    color: OnBrand,
  },
});
