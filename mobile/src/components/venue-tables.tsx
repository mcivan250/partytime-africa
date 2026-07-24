import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Gold, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney, toMinor } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Table = Pick<
  Tables<'venue_tables'>,
  'id' | 'name' | 'seats' | 'price_minor' | 'currency' | 'status' | 'held_for'
>;

type TableStatus = 'available' | 'booked' | 'held' | 'comp';

// Visual language for the floor map. Each status gets an accent + label.
const STATUS_META: Record<TableStatus, { accent: string; label: string }> = {
  available: { accent: StateGo, label: 'Open' },
  booked: { accent: Gold, label: 'Booked' },
  held: { accent: '#94A697', label: 'Held' },
  comp: { accent: '#5AC8E8', label: 'Comp' },
};

function statusOf(t: Table): TableStatus {
  return (['available', 'booked', 'held', 'comp'].includes(t.status) ? t.status : 'booked') as TableStatus;
}

// Booking a table reuses the ticket checkout path — the Pesapal order carries
// table_id and the IPN webhook creates the booking + marks the table taken.
// Hosts can also mark tables held/comp (no payment) straight from the map.
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
  const [editing, setEditing] = useState<Table | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('venue_tables')
      .select('id, name, seats, price_minor, currency, status, held_for')
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

  // Host-only: flip a table's status (held/comp/available) with no payment.
  const setStatus = async (id: string, status: TableStatus, heldFor: string | null) => {
    await supabase
      .from('venue_tables')
      .update({ status, held_for: status === 'held' || status === 'comp' ? heldFor : null })
      .eq('id', id);
    setEditing(null);
    await load();
  };

  const removeTable = async (id: string) => {
    await supabase.from('venue_tables').delete().eq('id', id);
    setEditing(null);
    await load();
  };

  if (tables.length === 0 && !isManager) return null;

  const input = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerBar} />
        <ThemedText type="subtitle">Book a table</ThemedText>
      </View>

      {tables.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {isManager ? 'Add VIP tables or booths below to sell bottle service.' : 'No tables yet.'}
        </ThemedText>
      ) : (
        <>
          <View style={styles.map}>
            {tables.map((table) => {
              const status = statusOf(table);
              const meta = STATUS_META[status];
              const open = status === 'available';
              const onPress = isManager
                ? () => setEditing(table)
                : open
                  ? () => onBook?.(table)
                  : undefined;
              return (
                <Pressable
                  key={table.id}
                  disabled={!onPress}
                  onPress={onPress}
                  style={({ pressed }) => [
                    styles.tableTile,
                    { borderColor: meta.accent },
                    open && styles.tableTileOpen,
                    pressed && onPress ? styles.pressed : null,
                  ]}>
                  <View style={[styles.statusDot, { backgroundColor: meta.accent }]} />
                  <ThemedText type="smallBold" numberOfLines={1} style={styles.tileName}>
                    {table.name}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    {table.seats} seats
                  </ThemedText>
                  <ThemedText type="smallBold" style={{ color: meta.accent }}>
                    {open ? formatMoney(table.price_minor, table.currency) : meta.label}
                  </ThemedText>
                  {isManager && !open && table.held_for ? (
                    <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                      {table.held_for}
                    </ThemedText>
                  ) : null}
                </Pressable>
              );
            })}
          </View>

          <View style={styles.legend}>
            {(Object.keys(STATUS_META) as TableStatus[]).map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: STATUS_META[s].accent }]} />
                <ThemedText type="small" themeColor="textSecondary">
                  {STATUS_META[s].label}
                </ThemedText>
              </View>
            ))}
          </View>
        </>
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
            <ThemedText type="smallBold" style={styles.onBrand}>
              + Add table
            </ThemedText>
          </Pressable>
        </View>
      ) : null}

      {editing ? (
        <TableEditor
          table={editing}
          onClose={() => setEditing(null)}
          onSetStatus={setStatus}
          onRemove={removeTable}
        />
      ) : null}
    </ThemedView>
  );
}

// Host action sheet for a tapped table: reserve without payment (held / comp),
// release it back to open, or remove it. Paid bookings can only be removed.
function TableEditor({
  table,
  onClose,
  onSetStatus,
  onRemove,
}: {
  table: Table;
  onClose: () => void;
  onSetStatus: (id: string, status: TableStatus, heldFor: string | null) => void;
  onRemove: (id: string) => void;
}) {
  const theme = useTheme();
  const [heldFor, setHeldFor] = useState(table.held_for ?? '');
  const status = statusOf(table);
  const paid = status === 'booked';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <ThemedView type="backgroundElement" style={styles.sheetInner}>
            <ThemedText type="subtitle">{table.name}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">
              {table.seats} seats · {formatMoney(table.price_minor, table.currency)} · {STATUS_META[status].label}
            </ThemedText>

            {paid ? (
              <ThemedText type="small" themeColor="textSecondary">
                This table is paid for. You can only remove it.
              </ThemedText>
            ) : (
              <>
                <TextInput
                  style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                  placeholder="Reserve for… (name — optional)"
                  placeholderTextColor={theme.textSecondary}
                  value={heldFor}
                  onChangeText={setHeldFor}
                  autoCapitalize="words"
                />
                <View style={styles.sheetRow}>
                  <Pressable
                    style={[styles.sheetBtn, { borderColor: STATUS_META.held.accent }]}
                    onPress={() => onSetStatus(table.id, 'held', heldFor.trim() || null)}>
                    <ThemedText type="smallBold">Hold</ThemedText>
                  </Pressable>
                  <Pressable
                    style={[styles.sheetBtn, { borderColor: STATUS_META.comp.accent }]}
                    onPress={() => onSetStatus(table.id, 'comp', heldFor.trim() || null)}>
                    <ThemedText type="smallBold">Comp</ThemedText>
                  </Pressable>
                  {status !== 'available' ? (
                    <Pressable
                      style={[styles.sheetBtn, { borderColor: STATUS_META.available.accent }]}
                      onPress={() => onSetStatus(table.id, 'available', null)}>
                      <ThemedText type="smallBold">Release</ThemedText>
                    </Pressable>
                  ) : null}
                </View>
              </>
            )}

            <Pressable style={styles.removeBtn} onPress={() => onRemove(table.id)}>
              <ThemedText type="smallBold" style={styles.removeLabel}>
                Remove table
              </ThemedText>
            </Pressable>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <ThemedText type="small" themeColor="textSecondary">
                Cancel
              </ThemedText>
            </Pressable>
          </ThemedView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const TILE_MIN = 104;

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
  headerBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: Brand,
  },
  map: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  tableTile: {
    flexGrow: 1,
    flexBasis: TILE_MIN,
    minWidth: TILE_MIN,
    maxWidth: 180,
    borderRadius: 16,
    borderWidth: 1.5,
    padding: Spacing.three,
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tableTileOpen: {
    backgroundColor: 'rgba(61,220,151,0.08)',
  },
  pressed: {
    opacity: 0.7,
  },
  statusDot: {
    position: 'absolute',
    top: Spacing.three,
    right: Spacing.three,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileName: {
    paddingRight: Spacing.three,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.three,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  onBrand: {
    color: OnBrand,
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
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  sheetInner: {
    borderRadius: 22,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  sheetRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  sheetBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  removeBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    borderRadius: 14,
    backgroundColor: 'rgba(247,53,88,0.14)',
  },
  removeLabel: {
    color: '#F73558',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
});
