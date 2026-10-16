import { Platform, Text as RNText, type TextProps as RNTextProps } from 'react-native';

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

/**
 * iOS New Architecture drops the last line of a wrapped Text when its box crosses y = 2048pt in
 * scroll content on 3x screens (Yoga float rounding; react/react-native#58970, fixed upstream in
 * Yoga #2037). Raising lineHeight a hair above the pixel grid absorbs the rounding error.
 */
const IOS_LINE_HEIGHT_SLACK = 0.001;

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
        Platform.OS === 'ios' && { lineHeight: typography[variant].lineHeight + IOS_LINE_HEIGHT_SLACK },
        { color: colors[color] },
        align && { textAlign: align },
        tabular && { fontVariant: ['tabular-nums'] },
        style,
      ]}
      {...rest}
    />
  );
}
