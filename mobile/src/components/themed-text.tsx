import { StyleSheet, Text, type TextProps } from 'react-native';

import { BodyFont, BodyFontBold, BodyFontMedium, DisplayFont, DisplayFontBold, ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'small' | 'smallBold' | 'subtitle' | 'link' | 'linkPrimary' | 'code';
  themeColor?: ThemeColor;
};

export function ThemedText({ style, type = 'default', themeColor, ...rest }: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[
        { color: theme[themeColor ?? 'text'] },
        type === 'default' && styles.default,
        type === 'title' && styles.title,
        type === 'small' && styles.small,
        type === 'smallBold' && styles.smallBold,
        type === 'subtitle' && styles.subtitle,
        type === 'link' && styles.link,
        type === 'linkPrimary' && styles.linkPrimary,
        type === 'code' && styles.code,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  small: {
    fontFamily: BodyFontMedium,
    fontSize: 14,
    lineHeight: 20,
  },
  smallBold: {
    fontFamily: BodyFontBold,
    fontSize: 14,
    lineHeight: 20,
  },
  default: {
    fontFamily: BodyFont,
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontFamily: DisplayFont,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: DisplayFontBold,
    fontSize: 20,
    lineHeight: 26,
  },
  link: {
    fontFamily: BodyFontMedium,
    lineHeight: 30,
    fontSize: 14,
  },
  linkPrimary: {
    fontFamily: BodyFontMedium,
    lineHeight: 30,
    fontSize: 14,
    color: '#3DDC97',
  },
  code: {
    fontFamily: BodyFontMedium,
    fontSize: 12,
  },
});
