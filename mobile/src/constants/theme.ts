/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Party Time commits to one bold "night-out" look: a near-black canvas with a
// vibrant accent, regardless of the device's light/dark setting. Both palette
// slots point at the same dark values so every `Colors[scheme]` reader gets it.
const nightPalette = {
  text: '#FFFFFF',
  textSecondary: '#9A9AA8',
  background: '#0B0B10',
  backgroundElement: '#17171F',
  backgroundSelected: '#24242F',
  surfaceElevated: '#202029',
  border: 'rgba(255,255,255,0.08)',
  accent: '#7B61FF',
  accentSoft: 'rgba(123,97,255,0.16)',
  onAccent: '#FFFFFF',
} as const;

export const Colors = {
  light: nightPalette,
  dark: nightPalette,
} as const;

export type ThemeColor = keyof typeof nightPalette;

// Brand constants for use in static StyleSheet.create (which can't read the
// runtime theme). Keep in sync with nightPalette.accent.
export const Brand = '#7B61FF';
export const BrandGradient = ['#7B61FF', '#FF5FA2'] as const;
export const OnBrand = '#FFFFFF';

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// On web the tab bar floats absolutely at the top; screens inside the tab
// group need this much top padding so their content clears it.
export const WebTabBarInset = Platform.OS === 'web' ? 76 : 0;
