import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Gold, OnBrand, Spacing, StateGo } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney, toMinor } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Tier = Pick<
  Tables<'ticket_tiers'>,
  'id' | 'name' | 'description' | 'price_minor' | 'currency' | 'quantity' | 'sold' | 'position'
>;

export function TicketTiers({
  eventId,
  currency,
  isManager,
  onBuy,
}: {
  eventId: string;
  currency: string;
  isManager: boolean;
  onBuy?: (tier: Tier) => void;
}) {
  const theme = useTheme();
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ticket_tiers')
      .select('id, name, description, price_minor, currency, quantity, sold, position')
      .eq('event_id', eventId)
      .order('position', { ascending: true });
    if (data) setTiers(data);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTier = async () => {
    setError(null);
    const priceNum = Number(price);
    const qtyNum = Number(quantity);
    if (!name.trim()) return setError('Give the tier a name.');
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError('Enter a valid price.');
    if (!Number.isInteger(qtyNum) || qtyNum <= 0) return setError('Enter how many are available.');
    setBusy(true);
    const { error: insertError } = await supabase.from('ticket_tiers').insert({
      event_id: eventId,
      name: name.trim(),
      price_minor: toMinor(priceNum, currency),
      currency,
      quantity: qtyNum,
      position: tiers.length,
    });
    if (!insertError) {
      // Mark the event as ticketed so guests see the ticket section.
      await supabase.from('events').update({ is_ticketed: true }).eq('id', eventId);
      setName('');
      setPrice('');
      setQuantity('');
      await load();
    } else {
      setError(insertError.message);
    }
    setBusy(false);
  };

  const removeTier = async (id: string) => {
    await supabase.from('ticket_tiers').delete().eq('id', id);
    await load();
  };

  if (tiers.length === 0 && !isManager) return null;

  const input = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerBar} />
        <ThemedText type="subtitle">Tickets</ThemedText>
      </View>

      {tiers.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {isManager ? 'Add a ticket tier below to start selling.' : 'No tickets yet.'}
        </ThemedText>
      ) : (
        tiers.map((tier) => {
          const left = tier.quantity - tier.sold;
          const soldOut = left <= 0;
          return (
            <View key={tier.id} style={styles.tier}>
              <View style={styles.tierText}>
                <ThemedText type="smallBold">{tier.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {soldOut ? 'Sold out' : `${left} left`}
                </ThemedText>
              </View>
              <ThemedText type="smallBold" style={{ color: tier.price_minor === 0 ? StateGo : Gold }}>
                {formatMoney(tier.price_minor, tier.currency)}
              </ThemedText>
              {isManager ? (
                <Pressable onPress={() => removeTier(tier.id)} style={styles.remove}>
                  <ThemedText type="smallBold" themeColor="textSecondary">
                    ✕
                  </ThemedText>
                </Pressable>
              ) : (
                <Pressable
                  disabled={soldOut}
                  onPress={() => onBuy?.(tier)}
                  style={[styles.buy, soldOut && styles.buyDisabled]}>
                  <ThemedText type="smallBold" style={styles.buyLabel}>
                    {soldOut ? '—' : 'Get'}
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
            placeholder="Tier name — e.g. Regular"
            placeholderTextColor={theme.textSecondary}
            value={name}
            onChangeText={setName}
          />
          <View style={styles.formRow}>
            <TextInput
              style={[...input, styles.flex]}
              placeholder={`Price (${currency})`}
              placeholderTextColor={theme.textSecondary}
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />
            <TextInput
              style={[...input, styles.flex]}
              placeholder="Quantity"
              placeholderTextColor={theme.textSecondary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="number-pad"
            />
          </View>
          {error ? <ThemedText type="small">{error}</ThemedText> : null}
          <Pressable
            style={[styles.addButton, { opacity: busy ? 0.5 : 1 }]}
            disabled={busy}
            onPress={addTier}>
            <ThemedText type="smallBold" style={styles.buyLabel}>
              + Add ticket tier
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
  headerBar: {
    width: 3,
    height: 18,
    borderRadius: 2,
    backgroundColor: Brand,
  },
  tier: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: Spacing.three,
  },
  tierText: {
    flex: 1,
    gap: Spacing.half,
  },
  buy: {
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  buyDisabled: {
    backgroundColor: '#33473A',
  },
  buyLabel: {
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
