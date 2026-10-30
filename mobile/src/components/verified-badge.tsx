import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, OnBrand } from '@/constants/theme';

// A verified-organizer checkmark. Green (brand) to stay on-palette and read as
// "trusted/go". Pass label to show the word "Verified" alongside the mark.
export function VerifiedBadge({ size = 16, label = false }: { size?: number; label?: boolean }) {
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { width: size, height: size, borderRadius: size / 2 }]}>
        <ThemedText style={[styles.check, { fontSize: Math.round(size * 0.62) }]}>✓</ThemedText>
      </View>
      {label ? (
        <ThemedText type="small" style={styles.label}>
          Verified
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { backgroundColor: Brand, alignItems: 'center', justifyContent: 'center' },
  check: { color: OnBrand, fontWeight: '900', lineHeight: undefined },
  label: { color: Brand },
});
