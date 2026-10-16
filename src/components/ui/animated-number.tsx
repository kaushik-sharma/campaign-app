import { useEffect } from 'react';
import { StyleSheet, TextInput, type StyleProp, type TextStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { formatCompact, formatInteger, formatMoney } from '@/lib/format';
import { duration, easing, typography, useTheme, type TypeVariant } from '@/theme';

import type { TextColor } from './text';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export type NumberFormat = 'money' | 'compact' | 'integer' | 'percent';

function format(value: number, kind: NumberFormat): string {
  'worklet';
  switch (kind) {
    case 'money':
      return formatMoney(value);
    case 'compact':
      return formatCompact(value);
    case 'percent':
      return `${Math.round(value * 100)}%`;
    default:
      return formatInteger(value);
  }
}

type Props = {
  /** For `money`, pass cents. For `percent`, pass a fraction. */
  value: number;
  format?: NumberFormat;
  variant?: TypeVariant;
  color?: TextColor;
  prefix?: string;
  suffix?: string;
  animateOnMount?: boolean;
  delay?: number;
  style?: StyleProp<TextStyle>;
};

/**
 * Counts up to `value` on the UI thread. Rendered through a read-only TextInput so the text can
 * change every frame without React re-renders.
 */
export function AnimatedNumber({
  value,
  format: kind = 'integer',
  variant = 'body',
  color = 'text',
  prefix = '',
  suffix = '',
  animateOnMount = true,
  delay = 0,
  style,
}: Props) {
  const { colors } = useTheme();
  const current = useSharedValue(animateOnMount ? 0 : value);

  useEffect(() => {
    current.set(withDelay(delay, withTiming(value, { duration: duration.counter, easing: easing.enter })));
  }, [value, delay, current]);

  const animatedProps = useAnimatedProps(() => {
    const text = `${prefix}${format(current.get(), kind)}${suffix}`;
    return { text, defaultValue: text } as Partial<{ text: string; defaultValue: string }>;
  });

  const finalText = `${prefix}${format(value, kind)}${suffix}`;

  return (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      pointerEvents="none"
      accessibilityLabel={finalText}
      maxFontSizeMultiplier={1.6}
      defaultValue={`${prefix}${format(animateOnMount ? 0 : value, kind)}${suffix}`}
      animatedProps={animatedProps}
      style={[styles.input, typography[variant], { color: colors[color] }, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: { padding: 0, margin: 0, fontVariant: ['tabular-nums'] },
});
