import { useEffect } from 'react';
import { View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { Coral } from '@/constants/theme';

// A small "live" dot with an expanding ring — the heartbeat of the app. Used on
// anything happening right now (live events, going counts, tonight). Respects
// reduce-motion by falling back to a static dot.
export function LivePulse({
  color = Coral,
  size = 8,
  style,
}: {
  color?: string;
  size?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const p = useSharedValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.ease) }), -1, false);
  }, [p, reduced]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - p.value),
    transform: [{ scale: 1 + p.value * 2.4 }],
  }));

  return (
    <View style={[{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }, style]}>
      {!reduced ? (
        <Animated.View
          style={[
            { position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color },
            ring,
          ]}
        />
      ) : null}
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}
