import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Kinetic entrance for hero headlines: rise + settle + subtle scale-up.
// Reanimated core so it runs on native and the web build.
export function KineticReveal({
  children,
  delay = 0,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }));
  }, [p, delay]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 22 }, { scale: 0.94 + p.value * 0.06 }],
  }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
