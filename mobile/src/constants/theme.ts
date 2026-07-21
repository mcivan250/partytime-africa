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
  text: '#EFF6EE', // paper
  textSecondary: '#94A697', // mute
  background: '#111811', // ink
  backgroundElement: '#19231B', // ink2 — cards, raised surfaces
  backgroundSelected: '#243527', // ink3 — inputs, chips, pressed
  surfaceElevated: '#243527',
  border: 'rgba(255,255,255,0.08)', // line
  accent: '#1DC96B', // brand gradient mid
  accentSoft: 'rgba(29,201,107,0.16)',
  onAccent: '#07130B', // onGrad — dark text ON gradient/accent, never white
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
export const OnBrand = '#07130B';

// State + accent colors from the design system.
export const StateGo = '#3DDC97';
export const StateMaybe = '#FFB84D';
export const Gold = '#E9C46A';

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

// On web the nav floats absolutely at the bottom; screens inside the tab group
// need this much BOTTOM padding so their content clears it.
export const WebBottomNavInset = Platform.OS === 'web' ? 104 : 0;
