import { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  type SharedValue,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { Brand, Coral, Gold, StateGo } from '@/constants/theme';

const COLORS = [Brand, Gold, Coral, StateGo, '#39D6E8', '#F3FAF4'];
const COUNT = 28;

type Spec = { angle: number; speed: number; color: string; size: number; spin: number; drift: number };

function Piece({ spec, t, originX, originY }: { spec: Spec; t: SharedValue<number>; originX: number; originY: number }) {
  const anim = useAnimatedStyle(() => {
    const p = t.value;
    const x = Math.cos(spec.angle) * spec.speed * p + spec.drift * p;
    const y = Math.sin(spec.angle) * spec.speed * p + 900 * p * p; // gravity
    return {
      opacity: p === 0 ? 0 : 1 - p,
      transform: [
        { translateX: originX + x },
        { translateY: originY + y },
        { rotate: `${spec.spin * p * 360}deg` },
        { scale: 1 - p * 0.3 },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        { width: spec.size, height: spec.size * 0.6, backgroundColor: spec.color },
        anim,
      ]}
    />
  );
}

// A one-shot confetti burst. Bump `fireKey` to replay (e.g. on RSVP "Going").
// Reduce-motion renders nothing.
export function Confetti({ fireKey }: { fireKey: number }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const t = useSharedValue(0);

  const specs = useMemo<Spec[]>(
    () =>
      Array.from({ length: COUNT }, () => ({
        angle: -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1,
        speed: 120 + Math.random() * 260,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        size: 7 + Math.random() * 7,
        spin: (Math.random() - 0.5) * 3,
        drift: (Math.random() - 0.5) * 120,
      })),
    [],
  );

  useEffect(() => {
    if (fireKey === 0 || reduced) return;
    t.value = 0;
    t.value = withTiming(1, { duration: 1300, easing: Easing.out(Easing.quad) });
  }, [fireKey, reduced, t]);

  if (reduced) return null;
  const originX = Math.min(width, 440) / 2;
  const originY = height * 0.5;

  return (
    <View style={styles.overlay} pointerEvents="none">
      {specs.map((spec, i) => (
        <Piece key={i} spec={spec} t={t} originX={originX} originY={originY} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  piece: { position: 'absolute', borderRadius: 2 },
});
