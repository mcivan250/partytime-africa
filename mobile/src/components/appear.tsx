import { useEffect } from 'react';
import type { ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

// Subtle, production-safe entrance: fade + rise. Works identically on native
// and the web build (uses reanimated core, not layout animations). Pass an
// index to stagger items in a list; the stagger is capped so long lists don't
// wait forever.
export function Appear({
  children,
  index = 0,
  style,
}: {
  children: React.ReactNode;
  index?: number;
  style?: ViewStyle | ViewStyle[];
}) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      Math.min(index, 8) * 55,
      withTiming(1, { duration: 340, easing: Easing.out(Easing.cubic) }),
    );
  }, [p, index]);
  const anim = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ translateY: (1 - p.value) * 12 }],
  }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}
