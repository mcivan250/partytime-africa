import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Gold, OnBrand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney, toMinor } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Table = Pick<
  Tables<'venue_tables'>,
  'id' | 'name' | 'seats' | 'price_minor' | 'currency' | 'status'
>;

// Booking a table reuses the ticket checkout path — the Pesapal order carries
// table_id and the IPN webhook creates the booking + marks the table taken.
export function VenueTables({
  eventId,
  currency,
  isManager,
  onBook,
}: {
  eventId: string;
  currency: string;
  isManager: boolean;
  onBook?: (table: Table) => void;
}) {
  const theme = useTheme();
  const [tables, setTables] = useState<Table[]>([]);
  const [name, setName] = useState('');
  const [seats, setSeats] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('venue_tables')
      .select('id, name, seats, price_minor, currency, status')
      .eq('event_id', eventId)
      .order('price_minor', { ascending: true });
    if (data) setTables(data);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTable = async () => {
    setError(null);
    const seatsNum = Number(seats);
    const priceNum = Number(price);
    if (!name.trim()) return setError('Give the table a name.');
    if (!Number.isInteger(seatsNum) || seatsNum <= 0) return setError('How many seats?');
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError('Enter a valid price.');
    setBusy(true);
    const { error: insertError } = await supabase.from('venue_tables').insert({
      event_id: eventId,
      name: name.trim(),
      seats: seatsNum,
      price_minor: toMinor(priceNum, currency),
      currency,
      status: 'available',
    });
    if (!insertError) {
      setName('');
      setSeats('');
      setPrice('');
      await load();
    } else {
      setError(insertError.message);
    }
    setBusy(false);
  };

  const removeTable = async (id: string) => {
    await supabase.from('venue_tables').delete().eq('id', id);
    await load();
  };

  if (tables.length === 0 && !isManager) return null;

  const input = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.icon}>🍾</ThemedText>
        <ThemedText type="subtitle">Book a table</ThemedText>
      </View>

      {tables.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {isManager ? 'Add VIP tables or booths below to sell bottle service.' : 'No tables yet.'}
        </ThemedText>
      ) : (
        tables.map((table) => {
          const taken = table.status !== 'available';
          return (
            <View key={table.id} style={styles.table}>
              <View style={styles.tableText}>
                <ThemedText type="smallBold">{table.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {taken ? 'Booked' : `Seats ${table.seats}`}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={styles.price}>
                {formatMoney(table.price_minor, table.currency)}
              </ThemedText>
              {isManager ? (
                <Pressable onPress={() => removeTable(table.id)} style={styles.remove}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    ✕
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  disabled={taken}
                  onPress={() => onBook?.(table)}
                  style={[styles.book, taken && styles.bookDisabled]}>
                  <ThemedText type="smallBold" style={styles.bookLabel}>
                    {taken ? 'Taken' : 'Book'}
                  </ThemedText>
                </Pressable>
              )}
            </View>
          );
        })
      )}

      {isManager ? (
        <View style={styles.form}>
          <TextInput
            style={input}
            placeholder="Table name — e.g. VIP Booth 1"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.formRow}>
            <TextInput
              style={[...input, styles.flex]}
              placeholder="Seats"
              placeholderTextColor={theme.textSecondary}
              value={seats}
              onChangeText={setSeats}
              keyboardType="number-pad"
            />
            <TextInput
              style={[...input, styles.flex]}
              placeholder={`Price (${currency})`}
              placeholderTextColor={theme.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
          </View>
          {error ? <ThemedText type="small">{error}</ThemedText> : null}
          <Pressable
            style={[styles.addButton, { opacity: busy ? 0.5 : 1 }]}
            disabled={busy}
            onPress={addTable}>
            <ThemedText type="smallBold" style={styles.bookLabel}>
              + Add table
            </ThemedText>
          </Pressable>
        </View>
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
  table: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: Spacing.three,
  },
  tableText: {
    flex: 1,
    gap: Spacing.half,
  },
  price: {
    color: Gold,
  },
  book: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  bookDisabled: {
    backgroundColor: '#33473A',
  },
  bookLabel: {
    color: OnBrand,
  },
  remove: {
    paddingHorizontal: Spacing.two,
  },
  form: {
    gap: Spacing.two,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  input: {
    borderRadius: 16,
    padding: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  addButton: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
});
