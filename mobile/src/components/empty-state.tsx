import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Brand, OnBrand, Spacing } from '@/constants/theme';

// A living empty state: a softly pulsing glyph + copy (+ optional CTA), so a
// quiet screen feels intentional instead of broken.
export function EmptyState({
  glyph,
  title,
  subtitle,
  ctaLabel,
  onCta,
}: {
  glyph: string;
  title: string;
  subtitle: string;
  ctaLabel?: string;
  onCta?: () => void;
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withRepeat(withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p]);
  const glow = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + p.value * 0.1 }],
    opacity: 0.65 + p.value * 0.35,
  }));

  return (
    <View style={styles.wrap}>
      <Animated.Text style={[styles.glyph, glow]}>{glyph}</Animated.Text>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
        {subtitle}
      </ThemedText>
      {ctaLabel && onCta ? (
        <Pressable style={styles.cta} onPress={onCta}>
          <ThemedText type="smallBold" style={styles.ctaLabel}>
            {ctaLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.four,
    gap: Spacing.two,
  },
  glyph: {
    fontSize: 56,
    marginBottom: Spacing.two,
  },
  title: {
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  cta: {
    marginTop: Spacing.three,
    backgroundColor: Brand,
    borderRadius: 999,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five,
  },
  ctaLabel: {
    color: OnBrand,
  },
});
