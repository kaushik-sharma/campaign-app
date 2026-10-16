import { useEffect } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextStyle } from 'react-native';
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
  /** Count from this value on mount instead of zero, e.g. the total before a contribution. */
  from?: number;
  delay?: number;
  /**
   * For numbers inside a row of text: sizes the number to its final value so neighbours sit where
   * they will end up (a native text input does not re-measure while it counts).
   */
  inline?: boolean;
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
  from,
  delay = 0,
  inline = false,
  style,
}: Props) {
  const { colors } = useTheme();
  const start = from ?? (animateOnMount ? 0 : value);
  const current = useSharedValue(start);

  useEffect(() => {
    current.set(withDelay(delay, withTiming(value, { duration: duration.counter, easing: easing.enter })));
  }, [value, delay, current]);

  const animatedProps = useAnimatedProps(() => {
    const text = `${prefix}${format(current.get(), kind)}${suffix}`;
    return { text, defaultValue: text } as Partial<{ text: string; defaultValue: string }>;
  });

  const finalText = `${prefix}${format(value, kind)}${suffix}`;

  const input = (
    <AnimatedTextInput
      editable={false}
      underlineColorAndroid="transparent"
      pointerEvents="none"
      accessibilityLabel={finalText}
      maxFontSizeMultiplier={1.6}
      defaultValue={`${prefix}${format(start, kind)}${suffix}`}
      animatedProps={animatedProps}
      style={[styles.input, typography[variant], { color: colors[color] }, inline && styles.overlay, style]}
    />
  );

  if (!inline) return input;
  return (
    <View accessible accessibilityLabel={finalText}>
      <Text
        importantForAccessibility="no-hide-descendants"
        maxFontSizeMultiplier={1.6}
        style={[typography[variant], styles.sizer, style]}>
        {finalText}
      </Text>
      {input}
    </View>
  );
}

const styles = StyleSheet.create({
  input: { padding: 0, margin: 0, fontVariant: ['tabular-nums'] },
  sizer: { opacity: 0, fontVariant: ['tabular-nums'] },
  // Spare width on the right so a briefly longer intermediate value isn't clipped.
  overlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: -24 },
});
