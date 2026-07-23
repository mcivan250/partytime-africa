import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Brand, Gold, OnBrand, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { formatMoney, toMinor } from '@/lib/money';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/types/database';

type Variant = Pick<Tables<'merch_variants'>, 'id' | 'label' | 'inventory' | 'sold' | 'position'>;
type Item = Pick<
  Tables<'merch_items'>,
  'id' | 'name' | 'description' | 'image_url' | 'price_minor' | 'currency' | 'status'
> & { merch_variants: Variant[] };

function soldOut(v: Variant) {
  return v.inventory !== null && v.inventory - v.sold <= 0;
}

// Merch reuses the ticket checkout path — the Pesapal order carries a
// merch_variant_id and the IPN webhook issues a QR pickup in the buyer's wallet.
export function MerchShop({
  eventId,
  currency,
  isManager,
  onBuy,
}: {
  eventId: string;
  currency: string;
  isManager: boolean;
  onBuy?: (variant: Variant) => void;
}) {
  const theme = useTheme();
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('merch_items')
      .select('id, name, description, image_url, price_minor, currency, status, merch_variants(id, label, inventory, sold, position)')
      .eq('event_id', eventId)
      .order('position');
    if (data) setItems(data as unknown as Item[]);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const addItem = async () => {
    setError(null);
    const priceNum = Number(price);
    if (!name.trim()) return setError('Name the item.');
    if (!Number.isFinite(priceNum) || priceNum < 0) return setError('Enter a valid price.');
    setBusy(true);
    // Create the item, then a default "One size" variant so it's instantly
    // buyable. Hosts can add real sizes (S/M/L) afterwards.
    const { data: item, error: itemError } = await supabase
      .from('merch_items')
      .insert({
        event_id: eventId,
        name: name.trim(),
        price_minor: toMinor(priceNum, currency),
        currency,
        position: items.length,
      })
      .select('id')
      .single();
    if (itemError || !item) {
      setError(itemError?.message ?? 'Could not add item.');
      setBusy(false);
      return;
    }
    await supabase.from('merch_variants').insert({ item_id: item.id, label: 'One size' });
    setName('');
    setPrice('');
    await load();
    setBusy(false);
  };

  const addSize = async (item: Item, label: string) => {
    const clean = label.trim();
    if (!clean) return;
    // First real size replaces the default "One size" placeholder.
    const onlyDefault =
      item.merch_variants.length === 1 && item.merch_variants[0].label === 'One size';
    if (onlyDefault) {
      await supabase.from('merch_variants').delete().eq('id', item.merch_variants[0].id);
    }
    await supabase
      .from('merch_variants')
      .insert({ item_id: item.id, label: clean, position: item.merch_variants.length });
    await load();
  };

  const removeItem = async (id: string) => {
    await supabase.from('merch_items').delete().eq('id', id);
    await load();
  };

  if (items.length === 0 && !isManager) return null;

  const input = [styles.input, { color: theme.text, backgroundColor: theme.background }];

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <View style={styles.header}>
        <ThemedText style={styles.icon}>🛍️</ThemedText>
        <ThemedText type="subtitle">Merch</ThemedText>
      </View>

      {items.length === 0 ? (
        <ThemedText type="small" themeColor="textSecondary">
          {isManager ? 'Sell tees, caps, wristbands — collected at the event.' : 'No merch yet.'}
        </ThemedText>
      ) : (
        items.map((item) => (
          <MerchRow
            key={item.id}
            item={item}
            isManager={isManager}
            picked={picked[item.id]}
            onPick={(vid) => setPicked((p) => ({ ...p, [item.id]: vid }))}
            onBuy={onBuy}
            onAddSize={(label) => addSize(item, label)}
            onRemove={() => removeItem(item.id)}
          />
        ))
      )}

      {isManager ? (
        <View style={styles.form}>
          <TextInput
            style={input}
            placeholder="Item name — e.g. Event T-Shirt"
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
            <Pressable
              style={[styles.addButton, { opacity: busy ? 0.5 : 1 }]}
              disabled={busy}
              onPress={addItem}>
              <ThemedText type="smallBold" style={styles.onBrand}>
                + Add item
              </ThemedText>
            </Pressable>
          </View>
          {error ? <ThemedText type="small">{error}</ThemedText> : null}
        </View>
      ) : null}
    </ThemedView>
  );
}

function MerchRow({
  item,
  isManager,
  picked,
  onPick,
  onBuy,
  onAddSize,
  onRemove,
}: {
  item: Item;
  isManager: boolean;
  picked?: string;
  onPick: (variantId: string) => void;
  onBuy?: (variant: Variant) => void;
  onAddSize: (label: string) => void;
  onRemove: () => void;
}) {
  const theme = useTheme();
  const [sizeInput, setSizeInput] = useState('');
  const variants = [...item.merch_variants].sort((a, b) => a.position - b.position);
  const multi = variants.length > 1 || variants[0]?.label !== 'One size';
  const selected = variants.find((v) => v.id === picked) ?? variants.find((v) => !soldOut(v)) ?? variants[0];

  return (
    <View style={styles.item}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.itemImage} contentFit="cover" />
      ) : null}
      <View style={styles.itemBody}>
        <View style={styles.itemTop}>
          <ThemedText type="smallBold" style={styles.flex}>
            {item.name}
          </ThemedText>
          <ThemedText type="smallBold" style={styles.price}>
            {formatMoney(item.price_minor, item.currency)}
          </ThemedText>
        </View>
        {item.description ? (
          <ThemedText type="small" themeColor="textSecondary">
            {item.description}
          </ThemedText>
        ) : null}

        {multi ? (
          <View style={styles.sizeRow}>
            {variants.map((v) => {
              const out = soldOut(v);
              const on = selected?.id === v.id;
              return (
                <Pressable
                  key={v.id}
                  disabled={out}
                  onPress={() => onPick(v.id)}
                  style={[styles.sizeChip, on && styles.sizeChipOn, out && styles.sizeChipOut]}>
                  <ThemedText type="smallBold" style={on ? styles.onBrand : undefined}>
                    {v.label}
                    {out ? ' ✕' : ''}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        ) : null}

        {isManager ? (
          <View style={styles.manageRow}>
            <TextInput
              style={[styles.input, styles.flex, { color: theme.text, backgroundColor: theme.background }]}
              placeholder="Add size (S, M, L…)"
              placeholderTextColor={theme.textSecondary}
              value={sizeInput}
              onChangeText={setSizeInput}
              autoCapitalize="characters"
              onSubmitEditing={() => {
                onAddSize(sizeInput);
                setSizeInput('');
              }}
            />
            <Pressable onPress={onRemove} style={styles.remove}>
              <ThemedText type="smallBold" themeColor="textSecondary">
                Remove
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            disabled={!selected || soldOut(selected)}
            onPress={() => selected && onBuy?.(selected)}
            style={[styles.buy, (!selected || soldOut(selected)) && styles.buyDisabled]}>
            <ThemedText type="smallBold" style={styles.onBrand}>
              {selected && soldOut(selected) ? 'Sold out' : 'Buy'}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
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
  item: {
    flexDirection: 'row',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: Spacing.three,
  },
  itemImage: {
    width: 64,
    height: 64,
    borderRadius: 12,
  },
  itemBody: {
    flex: 1,
    gap: Spacing.two,
  },
  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  price: {
    color: Gold,
  },
  sizeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  sizeChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  sizeChipOn: {
    backgroundColor: Brand,
    borderColor: 'transparent',
  },
  sizeChipOut: {
    opacity: 0.4,
  },
  manageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  buy: {
    alignSelf: 'flex-start',
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.five,
  },
  buyDisabled: {
    backgroundColor: '#33473A',
  },
  onBrand: {
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
    paddingHorizontal: Spacing.four,
    justifyContent: 'center',
  },
});
