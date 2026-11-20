import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { getEventTheme } from '@/constants/event-themes';

// A single, slow, barely-there light drift over the event's vibe. The event's
// cover (or its gradient) is the one bright moment; this just keeps it from
// feeling dead-flat. No sparkles, no stacked glows — the chrome stays quiet.
// Reduce-motion settles it to a still gradient.
export function HeroBackdrop({ theme, show = true }: { theme?: string | null; show?: boolean }) {
  const vibe = getEventTheme(theme);
  const p = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced || !show) return;
    p.value = withRepeat(withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [p, reduced, show]);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(p.value, [0, 1], [-14, 18]) },
      { translateY: interpolate(p.value, [0, 1], [8, -12]) },
      { scale: interpolate(p.value, [0, 1], [1, 1.18]) },
    ],
    opacity: interpolate(p.value, [0, 1], [0.4, 0.58]),
  }));
  if (!show) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View style={[styles.glow, anim]}>
        <LinearGradient
          colors={[vibe.accent, 'transparent']}
          start={{ x: 0.3, y: 0.2 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    top: '-18%',
    right: '-20%',
    width: '85%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
});
