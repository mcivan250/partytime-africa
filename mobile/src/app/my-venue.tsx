import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, MaxContentWidth, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { tapSuccess } from '@/lib/haptics';
import { useAuth } from '@/lib/auth-context';
import { pickImage, uploadImage } from '@/lib/storage';
import { supabase } from '@/lib/supabase';

type Venue = {
  id: string;
  name: string;
  kind: string;
  city: string | null;
  cover_url: string | null;
  description: string | null;
  phone: string | null;
  price_range: string | null;
  cuisines: string[];
  hours: string | null;
};

type Reservation = {
  id: string;
  guest_name: string;
  party_size: number;
  reserved_for: string;
  note: string | null;
  status: string;
};

export default function MyVenueScreen() {
  const { session } = useAuth();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'bookings' | 'details'>('bookings');

  // Editable fields.
  const [desc, setDesc] = useState('');
  const [hours, setHours] = useState('');
  const [phone, setPhone] = useState('');
  const [price, setPrice] = useState('');
  const [cuisines, setCuisines] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    const [{ data: vRows }, { data: rRows }] = await Promise.all([
      supabase.rpc('my_owned_venue'),
      supabase.rpc('owner_list_reservations'),
    ]);
    const v = (vRows?.[0] ?? null) as Venue | null;
    setVenue(v);
    if (v) {
      setDesc(v.description ?? '');
      setHours(v.hours ?? '');
      setPhone(v.phone ?? '');
      setPrice(v.price_range ?? '');
      setCuisines((v.cuisines ?? []).join(', '));
    }
    setReservations((rRows ?? []) as Reservation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) load();
    else setLoading(false);
  }, [session, load]);

  const save = async () => {
    if (!venue) return;
    setSaving(true);
    const { error } = await supabase.rpc('owner_update_venue', {
      p_id: venue.id,
      p_description: desc.trim(),
      p_hours: hours.trim(),
      p_phone: phone.trim(),
      p_price_range: price.trim(),
      p_cuisines: cuisines
        .split(',')
        .map((c) => c.trim())
        .filter(Boolean),
    });
    setSaving(false);
    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }
    tapSuccess();
    Alert.alert('Saved', 'Your venue details are updated.');
  };

  const changeCover = async () => {
    if (!venue) return;
    try {
      const picked = await pickImage([16, 9]);
      if (!picked) return;
      setUploading(true);
      const { url } = await uploadImage('venue-covers', venue.id, picked);
      const { error } = await supabase.rpc('set_venue_cover', { p_id: venue.id, p_cover_url: url });
      if (error) throw error;
      setVenue((prev) => (prev ? { ...prev, cover_url: url } : prev));
      tapSuccess();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not set the photo.');
    } finally {
      setUploading(false);
    }
  };

  const changeLogo = async () => {
    if (!venue) return;
    try {
      const picked = await pickImage([1, 1]);
      if (!picked) return;
      setUploading(true);
      const { url } = await uploadImage('venue-covers', `${venue.id}/logo`, picked);
      const { error } = await supabase.rpc('set_venue_logo', { p_id: venue.id, p_logo_url: url });
      if (error) throw error;
      tapSuccess();
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not set the logo.');
    } finally {
      setUploading(false);
    }
  };

  const addPhoto = async () => {
    if (!venue) return;
    try {
      const picked = await pickImage([4, 3]);
      if (!picked) return;
      setUploading(true);
      const { url } = await uploadImage('venue-covers', `${venue.id}/gallery`, picked);
      const { error } = await supabase.rpc('add_venue_photo', { p_venue_id: venue.id, p_url: url });
      if (error) throw error;
      tapSuccess();
      Alert.alert('Photo added', 'It now shows in your venue’s gallery.');
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not add the photo.');
    } finally {
      setUploading(false);
    }
  };

  const changeMenu = async () => {
    if (!venue) return;
    try {
      const picked = await pickImage([3, 4], false);
      if (!picked) return;
      setUploading(true);
      const { url } = await uploadImage('venue-covers', `${venue.id}/menu`, picked);
      const { error } = await supabase.rpc('set_venue_menu', { p_id: venue.id, p_menu_url: url });
      if (error) throw error;
      tapSuccess();
      Alert.alert('Menu updated', 'Guests can now tap “Menu” on your page.');
    } catch (e) {
      Alert.alert('Upload failed', e instanceof Error ? e.message : 'Could not set the menu.');
    } finally {
      setUploading(false);
    }
  };

  const setStatus = async (r: Reservation, status: 'confirmed' | 'declined') => {
    setReservations((prev) => prev.map((x) => (x.id === r.id ? { ...x, status } : x)));
    const { error } = await supabase.rpc('owner_set_reservation_status', { p_id: r.id, p_status: status });
    if (error) {
      Alert.alert('Could not update', error.message);
      setReservations((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: r.status } : x)));
      return;
    }
    tapSuccess();
  };

  if (loading) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ActivityIndicator color={Brand} />
      </ThemedView>
    );
  }
  if (!session || !venue) {
    return (
      <ThemedView style={[styles.container, styles.center]}>
        <ThemedText type="subtitle">No venue yet</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
          You don&apos;t manage a venue yet. Find your bar or restaurant in the guide and tap “Claim
          this venue” — we&apos;ll verify and hand you the keys.
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          {venue.cover_url ? (
            <Image source={{ uri: venue.cover_url }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, styles.thumbEmpty]} />
          )}
          <View style={styles.flex}>
            <ThemedText type="subtitle">{venue.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {venue.kind} · {venue.city ?? 'Kampala'}
            </ThemedText>
          </View>
        </View>

        <View style={styles.segment}>
          <Pressable style={[styles.segItem, tab === 'bookings' && styles.segOn]} onPress={() => setTab('bookings')}>
            <ThemedText type="smallBold" style={tab === 'bookings' ? styles.segOnText : styles.segText}>
              Bookings
            </ThemedText>
          </Pressable>
          <Pressable style={[styles.segItem, tab === 'details' && styles.segOn]} onPress={() => setTab('details')}>
            <ThemedText type="smallBold" style={tab === 'details' ? styles.segOnText : styles.segText}>
              Edit details
            </ThemedText>
          </Pressable>
        </View>

        {tab === 'bookings' ? (
          reservations.length === 0 ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.emptyText}>
              No table requests yet. When guests reserve, they&apos;ll appear here to confirm.
            </ThemedText>
          ) : (
            reservations.map((r) => {
              const pending = r.status === 'requested';
              return (
                <ThemedView key={r.id} type="backgroundElement" style={styles.bookingCard}>
                  <View style={styles.bookingTop}>
                    <View style={styles.flex}>
                      <ThemedText type="smallBold">
                        {r.guest_name} · party of {r.party_size}
                      </ThemedText>
                      <ThemedText type="small" themeColor="textSecondary">
                        {new Date(r.reserved_for).toLocaleString(undefined, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </ThemedText>
                      {r.note ? (
                        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
                          “{r.note}”
                        </ThemedText>
                      ) : null}
                    </View>
                    {!pending ? (
                      <View
                        style={[
                          styles.statusPill,
                          r.status === 'confirmed' ? styles.confirmedBg : styles.declinedBg,
                        ]}>
                        <ThemedText type="small" style={r.status === 'confirmed' ? styles.goText : styles.noText}>
                          {r.status === 'confirmed' ? 'Confirmed' : 'Declined'}
                        </ThemedText>
                      </View>
                    ) : null}
                  </View>
                  {pending ? (
                    <View style={styles.actions}>
                      <Pressable style={[styles.actionBtn, styles.confirmedBg, styles.flex]} onPress={() => setStatus(r, 'confirmed')}>
                        <ThemedText type="smallBold" style={styles.goText}>
                          Confirm
                        </ThemedText>
                      </Pressable>
                      <Pressable style={[styles.actionBtn, styles.declinedBg, styles.flex]} onPress={() => setStatus(r, 'declined')}>
                        <ThemedText type="smallBold" style={styles.noText}>
                          Decline
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : null}
                </ThemedView>
              );
            })
          )
        ) : (
          <ThemedView type="backgroundElement" style={styles.formCard}>
            <Pressable style={styles.photoBtn} disabled={uploading} onPress={changeCover}>
              {uploading ? (
                <ActivityIndicator color={Brand} />
              ) : (
                <ThemedText type="smallBold" style={styles.photoText}>
                  {venue.cover_url ? '📷 Replace cover photo' : '📷 Add cover photo'}
                </ThemedText>
              )}
            </Pressable>
            <View style={styles.mediaRow}>
              <Pressable style={styles.mediaBtn} disabled={uploading} onPress={changeLogo}>
                <ThemedText type="smallBold" style={styles.photoText}>
                  🏷️ Logo
                </ThemedText>
              </Pressable>
              <Pressable style={styles.mediaBtn} disabled={uploading} onPress={addPhoto}>
                <ThemedText type="smallBold" style={styles.photoText}>
                  ＋ Photo
                </ThemedText>
              </Pressable>
              <Pressable style={styles.mediaBtn} disabled={uploading} onPress={changeMenu}>
                <ThemedText type="smallBold" style={styles.photoText}>
                  📄 Menu
                </ThemedText>
              </Pressable>
            </View>

            <ThemedText type="small" themeColor="textSecondary">
              Description
            </ThemedText>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Tell guests what makes your place special"
              placeholderTextColor="#66766A"
              value={desc}
              onChangeText={setDesc}
              multiline
            />
            <ThemedText type="small" themeColor="textSecondary">
              Opening hours
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="e.g. Daily · 12pm–11pm"
              placeholderTextColor="#66766A"
              value={hours}
              onChangeText={setHours}
            />
            <ThemedText type="small" themeColor="textSecondary">
              Cuisines / tags (comma separated)
            </ThemedText>
            <TextInput
              style={styles.input}
              placeholder="Italian, Pizza, Cocktails"
              placeholderTextColor="#66766A"
              value={cuisines}
              onChangeText={setCuisines}
            />
            <View style={styles.formRow}>
              <View style={styles.flex}>
                <ThemedText type="small" themeColor="textSecondary">
                  Price ($ – $$$$)
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="$$"
                  placeholderTextColor="#66766A"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={styles.flex}>
                <ThemedText type="small" themeColor="textSecondary">
                  Phone
                </ThemedText>
                <TextInput
                  style={styles.input}
                  placeholder="+256…"
                  placeholderTextColor="#66766A"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            <Pressable style={[styles.saveBtn, saving && styles.disabled]} disabled={saving} onPress={save}>
              {saving ? (
                <ActivityIndicator color={OnBrand} />
              ) : (
                <ThemedText type="smallBold" style={styles.segOnText}>
                  Save changes
                </ThemedText>
              )}
            </Pressable>
          </ThemedView>
        )}
        <View style={styles.pad} />
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center', padding: Spacing.four, gap: Spacing.two },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  thumb: { width: 56, height: 56, borderRadius: 14 },
  thumbEmpty: { backgroundColor: '#243527' },
  flex: { flex: 1 },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#19231B',
    borderRadius: 999,
    padding: 4,
    gap: 4,
  },
  segItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: 999 },
  segOn: { backgroundColor: Brand },
  segText: { color: '#94A697' },
  segOnText: { color: OnBrand },
  emptyText: { textAlign: 'center', lineHeight: 20, maxWidth: 380 },
  bookingCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.three },
  bookingTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  note: { fontStyle: 'italic', marginTop: 2 },
  actions: { flexDirection: 'row', gap: Spacing.two },
  actionBtn: { borderRadius: 999, paddingVertical: Spacing.two, alignItems: 'center' },
  statusPill: { borderRadius: 999, paddingVertical: Spacing.one, paddingHorizontal: Spacing.three },
  confirmedBg: { backgroundColor: 'rgba(61,220,151,0.15)' },
  declinedBg: { backgroundColor: 'rgba(247,53,88,0.15)' },
  goText: { color: StateGo },
  noText: { color: '#F73558' },
  formCard: { borderRadius: 16, padding: Spacing.three, gap: Spacing.two },
  formRow: { flexDirection: 'row', gap: Spacing.two },
  photoBtn: {
    borderRadius: 12,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    marginBottom: Spacing.one,
  },
  photoText: { color: '#EFF6EE' },
  mediaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginBottom: Spacing.two },
  mediaBtn: {
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  input: {
    backgroundColor: '#243527',
    borderRadius: 12,
    padding: Spacing.three,
    color: '#EFF6EE',
    fontFamily: 'SpaceGrotesk_400Regular',
  },
  multiline: { minHeight: 70 },
  saveBtn: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  disabled: { opacity: 0.6 },
  pad: { height: Spacing.six },
});
