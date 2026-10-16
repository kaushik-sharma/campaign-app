import { useEffect, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOut,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { duration, fonts, radius, space, typography, useTheme } from '@/theme';

import { Text } from './text';

type Props = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  helper?: string;
  required?: boolean;
  /** Shows a live counter when set. */
  maxLength?: number;
  multiline?: boolean;
  ref?: Ref<TextInput>;
};

/**
 * Labelled text input. Focus ring and error colour animate; a new error shakes the field
 * once and fires a warning haptic.
 */
export function TextField({
  label,
  error,
  helper,
  required,
  maxLength,
  multiline,
  value,
  onFocus,
  onBlur,
  ref,
  ...rest
}: Props) {
  const { colors } = useTheme();
  const focus = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    if (!error) return;
    haptics.warning();
    shake.set(
      withSequence(
        withTiming(-4, { duration: 50 }),
        withTiming(4, { duration: 50 }),
        withTiming(-3, { duration: 50 }),
        withTiming(3, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      ),
    );
  }, [error, shake]);

  const fieldStyle = useAnimatedStyle(() => ({
    borderColor: error
      ? colors.danger
      : interpolateColor(focus.get(), [0, 1], [colors.border, colors.primary]),
    transform: [{ translateX: shake.get() }],
  }));

  const length = value?.length ?? 0;
  const nearLimit = maxLength !== undefined && length >= maxLength * 0.9;

  return (
    <View style={styles.wrapper}>
      <View style={styles.labelRow}>
        <Text variant="subhead">
          {label}
          {required && <Text variant="subhead" color="danger">{' *'}</Text>}
        </Text>
        {maxLength !== undefined && (
          <Text variant="caption" color={nearLimit ? 'warning' : 'textMuted'} tabular>
            {length}/{maxLength}
          </Text>
        )}
      </View>
      <Animated.View style={[styles.field, { backgroundColor: colors.surface }, multiline && styles.multiline, fieldStyle]}>
        <TextInput
          ref={ref}
          value={value}
          maxLength={maxLength}
          multiline={multiline}
          placeholderTextColor={colors.textDisabled}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          accessibilityLabel={required ? `${label}, required` : label}
          accessibilityHint={error ?? helper}
          onFocus={(e) => {
            focus.set(withTiming(1, { duration: duration.fast }));
            onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.set(withTiming(0, { duration: duration.fast }));
            onBlur?.(e);
          }}
          style={[styles.input, { color: colors.text }, multiline && styles.inputMultiline]}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...rest}
        />
      </Animated.View>
      {error ? (
        <Animated.View key="error" entering={FadeInDown.duration(duration.fast)} exiting={FadeOut.duration(duration.instant)}>
          <Text variant="footnote" color="danger" accessibilityLiveRegion="polite">
            {error}
          </Text>
        </Animated.View>
      ) : helper ? (
        <Text variant="footnote" color="textMuted">
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: space.xs + 2 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  field: {
    borderWidth: 1,
    borderRadius: radius.md,
    minHeight: 48,
    justifyContent: 'center',
  },
  multiline: { minHeight: 112 },
  input: {
    ...typography.body,
    fontFamily: fonts.regular,
    paddingHorizontal: space.md + 2,
    paddingVertical: space.md,
  },
  inputMultiline: { minHeight: 112 },
});
