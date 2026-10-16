import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { typography, useTheme, type ColorTokens, type TypeVariant } from '@/theme';

export type TextColor = keyof Pick<
  ColorTokens,
  | 'text'
  | 'textMuted'
  | 'textInverse'
  | 'textDisabled'
  | 'primary'
  | 'onPrimary'
  | 'success'
  | 'warning'
  | 'danger'
>;

export type TextProps = RNTextProps & {
  variant?: TypeVariant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
  /** Fixed-width digits so changing numbers don't jitter. */
  tabular?: boolean;
};

export function Text({
  variant = 'body',
  color = 'text',
  align,
  tabular,
  style,
  maxFontSizeMultiplier = 1.6,
  ...rest
}: TextProps) {
  const { colors } = useTheme();
  return (
    <RNText
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[
        typography[variant],
        { color: colors[color] },
        align && { textAlign: align },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
