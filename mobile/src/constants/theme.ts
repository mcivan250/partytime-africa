/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

// Party Time's approved design system (DESIGN.md): a green "forest-black"
// chrome, dark-first, applied regardless of the device light/dark setting.
// Brand chrome is green; event posters bring their own colorful gradients.
// Purple/violet is explicitly banned. Both palette slots point at the same
// values so every `Colors[scheme]` reader gets this look.
const nightPalette = {
  text: '#F2F7F1', // paper
  textSecondary: '#8FA895', // mute
  background: '#0B120D', // ink
  backgroundElement: '#131C16', // ink2 — cards, raised surfaces
  backgroundSelected: '#1D2A21', // ink3 — inputs, chips, pressed
  surfaceElevated: '#1D2A21',
  border: 'rgba(255,255,255,0.07)', // line — finer hairline
  borderStrong: 'rgba(255,255,255,0.14)', // line2 — emphasized edges
  accent: '#1DC96B', // brand gradient mid
  accentSoft: 'rgba(29,201,107,0.14)',
  onAccent: '#04120A', // onGrad — dark text ON gradient/accent, never white
} as const;

export const Colors = {
  light: nightPalette,
  dark: nightPalette,
} as const;

export type ThemeColor = keyof typeof nightPalette;

// Brand constants for static StyleSheet.create (can't read the runtime theme).
export const Brand = '#1DC96B';
export const BrandGradient = ['#5BEA8E', '#1DC96B', '#0B8F52'] as const;
export const BrandGradientLocations = [0, 0.45, 1] as const;
export const OnBrand = '#04120A';

// State + accent colors from the design system.
export const StateGo = '#3DDC97';
export const StateMaybe = '#FFB84D';
export const Gold = '#D4AF37';
export const GoldSoft = 'rgba(212,175,55,0.14)';

// Corner radii — softer on outer containers, tighter on inner elements, so
// nested surfaces read as a hierarchy rather than one uniform stamp.
export const Radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

// Tinted elevation. Raised surfaces float on a soft near-black shadow (not a
// hard line), and the brand "glow" lifts the one hero element per screen.
// Spread a preset into a style: `[styles.card, Elevation.med]`.
export const Elevation = {
  low: {
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  med: {
    shadowColor: '#000000',
    shadowOpacity: 0.42,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 14 },
    elevation: 9,
  },
  glow: {
    shadowColor: '#1DC96B',
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 11,
  },
} as const;

// Font families loaded in the root layout (bundled by @expo-google-fonts).
export const DisplayFont = 'Unbounded_900Black';
export const DisplayFontBold = 'Unbounded_700Bold';
export const BodyFont = 'SpaceGrotesk_400Regular';
export const BodyFontMedium = 'SpaceGrotesk_500Medium';
export const BodyFontBold = 'SpaceGrotesk_700Bold';

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

// The nav floats absolutely at the bottom on every platform; screens inside
// the tab group need this much BOTTOM padding so their content clears it.
export const BottomNavInset = 108;
