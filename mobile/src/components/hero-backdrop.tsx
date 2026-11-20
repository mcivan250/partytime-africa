import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { getEventTheme } from '@/constants/event-themes';
import { Coral, Gold } from '@/constants/theme';

// A living gradient backdrop for the event hero — slow-drifting colour blobs
// over the event's vibe, plus a few twinkling sparkles. This is what turns a
// flat poster into something that feels alive (the Partiful move), while the
// rest of the page stays calm. Reduce-motion settles it to a still gradient.
function Blob({
  colors,
  style,
  phase = 0,
  dur = 9000,
}: {
  colors: [string, string];
  style: object;
  phase?: number;
  dur?: number;
}) {
  const p = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(phase, withRepeat(withTiming(1, { duration: dur, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [p, reduced, phase, dur]);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(p.value, [0, 1], [-18, 22]) },
      { translateY: interpolate(p.value, [0, 1], [10, -16]) },
      { scale: interpolate(p.value, [0, 1], [1, 1.22]) },
    ],
    opacity: interpolate(p.value, [0, 1], [0.55, 0.8]),
  }));
  return (
    <Animated.View style={[styles.blob, style, anim]} pointerEvents="none">
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
    </Animated.View>
  );
}

function Sparkle({ style, delay }: { style: object; delay: number }) {
  const t = useSharedValue(0);
  const reduced = useReducedMotion();
  useEffect(() => {
    if (reduced) return;
    t.value = withDelay(delay, withRepeat(withTiming(1, { duration: 1300, easing: Easing.inOut(Easing.ease) }), -1, true));
  }, [t, reduced, delay]);
  const anim = useAnimatedStyle(() => ({
    opacity: reduced ? 0.8 : interpolate(t.value, [0, 1], [0.15, 1]),
    transform: [{ scale: reduced ? 1 : interpolate(t.value, [0, 1], [0.7, 1.15]) }],
  }));
  return <Animated.Text style={[styles.sparkle, style, anim]}>✦</Animated.Text>;
}

export function HeroBackdrop({ theme, show = true }: { theme?: string | null; show?: boolean }) {
  const vibe = getEventTheme(theme);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {show ? (
        <>
          <Blob colors={[vibe.accent, vibe.gradient[2]]} style={styles.b1} dur={9000} />
          <Blob colors={[Coral, '#FF7AA0']} style={styles.b2} phase={1500} dur={11000} />
          <Blob colors={[Gold, vibe.gradient[0]]} style={styles.b3} phase={3000} dur={13000} />
        </>
      ) : null}
      <Sparkle style={{ top: '18%', left: '12%', fontSize: 18 }} delay={0} />
      <Sparkle style={{ top: '30%', right: '14%', fontSize: 13 }} delay={500} />
      <Sparkle style={{ top: '48%', left: '22%', fontSize: 11 }} delay={1000} />
    </View>
  );
}

const styles = StyleSheet.create({
  blob: {
    position: 'absolute',
    width: '72%',
    aspectRatio: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  b1: { top: '-14%', left: '-10%' },
  b2: { top: '6%', right: '-18%' },
  b3: { bottom: '-20%', left: '14%' },
  sparkle: {
    position: 'absolute',
    color: '#FFFFFF',
    textShadowColor: 'rgba(255,255,255,0.7)',
    textShadowRadius: 6,
  },
});
