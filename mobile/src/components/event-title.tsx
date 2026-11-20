import { useEffect } from 'react';
import { StyleSheet, Text, View, type TextStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { normalizeFx, type TitleFx } from '@/constants/title-effects';
import { Coral, DisplayFont, Gold, StateGo } from '@/constants/theme';

const AText = Animated.createAnimatedComponent(Text);

// Per-effect base colour + glow colour used on native. (Gradient-filled text
// isn't practical cross-platform in RN, so native leans on colour + an animated
// glow; the web variant does the full gradient sweep.)
const FX: Record<TitleFx, { color: string; glow: string }> = {
  none: { color: '#F2F7F1', glow: 'transparent' },
  glow: { color: '#EAFBF1', glow: StateGo },
  chrome: { color: '#EDF3EE', glow: 'rgba(255,255,255,0.55)' },
  fire: { color: '#FFB15C', glow: '#FF5A2C' },
  electric: { color: '#FF6E92', glow: Coral },
  sparkle: { color: '#FFF4CF', glow: Gold },
};

/**
 * Event title with a host-chosen "effect" — the Party Time take on Partiful's
 * living invite titles. Native build: colour + animated glow (+ sparkles).
 */
export function EventTitle({
  title,
  fx,
  style,
}: {
  title: string;
  fx?: string | null;
  style?: TextStyle | TextStyle[];
}) {
  const key = normalizeFx(fx);
  const spec = FX[key];
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);
  const twinkle = useSharedValue(0);

  useEffect(() => {
    if (reduced || key === 'none' || key === 'chrome') return;
    pulse.value = withRepeat(
      withTiming(1, { duration: key === 'electric' ? 900 : 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse, reduced, key]);

  useEffect(() => {
    if (reduced || key !== 'sparkle') return;
    twinkle.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [twinkle, reduced, key]);

  const animated = useAnimatedStyle(() => {
    if (key === 'none') return {};
    const base = key === 'electric' ? 10 : 14;
    const radius = reduced ? base : base + pulse.value * (key === 'electric' ? 16 : 12);
    return {
      textShadowColor: spec.glow,
      textShadowRadius: radius,
      textShadowOffset: { width: 0, height: 0 },
    };
  });

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: reduced ? 0.9 : 0.3 + twinkle.value * 0.7,
    transform: [{ scale: reduced ? 1 : 0.8 + twinkle.value * 0.4 }],
  }));

  return (
    <View style={styles.wrap}>
      {key === 'sparkle' ? (
        <>
          <Animated.Text style={[styles.sparkle, styles.sparkleTL, sparkleStyle]}>✦</Animated.Text>
          <Animated.Text style={[styles.sparkle, styles.sparkleBR, sparkleStyle]}>✦</Animated.Text>
        </>
      ) : null}
      <AText style={[styles.base, style, { color: spec.color }, animated]}>{title}</AText>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', alignSelf: 'flex-start' },
  base: { fontFamily: DisplayFont },
  sparkle: { position: 'absolute', color: Gold, fontSize: 18, zIndex: 2 },
  sparkleTL: { top: -6, left: -10 },
  sparkleBR: { right: -6, bottom: 2 },
});
