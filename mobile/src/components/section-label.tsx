import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand, Spacing } from '@/constants/theme';

// Signature section header for the app: a short brand-green accent bar
// followed by an uppercase label. Replaces the emoji-in-a-heading pattern
// so screens read editorial and consistent instead of templated.
export function SectionLabel({ children, color = Brand }: { children: string; color?: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.bar, { backgroundColor: color }]} />
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  bar: {
    width: 3,
    height: 14,
    borderRadius: 2,
  },
  label: {
    fontSize: 11,
    letterSpacing: 2,
  },
});
