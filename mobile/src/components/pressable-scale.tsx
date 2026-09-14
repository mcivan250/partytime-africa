import { type ReactNode } from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// A Pressable that springs down slightly on press — physical, tactile feedback
// that makes every tap feel alive. Reduce-motion falls back to no scale.
export function PressableScale({
  children,
  style,
  onPress,
  to = 0.96,
  disabled,
  hitSlop,
  accessibilityLabel,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  to?: number;
  disabled?: boolean;
  hitSlop?: number;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const reduced = useReducedMotion();
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const spring = { damping: 15, stiffness: 320, mass: 0.6 };

  return (
    <AnimatedPressable
      disabled={disabled}
      hitSlop={hitSlop}
      accessibilityLabel={accessibilityLabel}
      onPressIn={() => {
        if (!reduced) scale.value = withSpring(to, spring);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
      }}
      onPress={onPress}
      style={[style, anim]}>
      {children}
    </AnimatedPressable>
  );
}
