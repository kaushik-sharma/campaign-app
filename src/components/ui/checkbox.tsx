import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

import { duration, radius, space, spring, useTheme } from '@/theme';

import { CheckIcon } from './icons';
import { PressableScale } from './pressable-scale';
import { Text } from './text';

type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
  /** Highlights an unchecked required box after a failed submit. */
  invalid?: boolean;
};

/** A labelled checkbox; the whole row is the touch target. The box fills and the check springs in. */
export function Checkbox({ label, checked, onChange, description, invalid }: Props) {
  const { colors } = useTheme();
  const on = useSharedValue(checked ? 1 : 0);

  useEffect(() => {
    on.set(withTiming(checked ? 1 : 0, { duration: duration.fast }));
  }, [checked, on]);

  const boxStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(on.get(), [0, 1], [colors.surface, colors.primary]),
    borderColor: interpolateColor(on.get(), [0, 1], [invalid ? colors.danger : colors.borderStrong, colors.primary]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: on.get(),
    transform: [{ scale: withSpring(on.get() > 0.5 ? 1 : 0.4, spring.snappy) }],
  }));

  return (
    <PressableScale
      onPress={() => onChange(!checked)}
      haptic="selection"
      scaleTo={0.98}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
      style={styles.row}>
      <Animated.View style={[styles.box, boxStyle]}>
        <Animated.View style={checkStyle}>
          <CheckIcon size={14} color={colors.onPrimary} weight="bold" />
        </Animated.View>
      </Animated.View>
      <View style={styles.text}>
        <Text variant="subhead">{label}</Text>
        {description && (
          <Text variant="footnote" color="textMuted">
            {description}
          </Text>
        )}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: space.md, alignItems: 'flex-start', paddingVertical: space.sm },
  box: {
    width: 22,
    height: 22,
    borderRadius: radius.xs,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -1,
  },
  text: { flex: 1, gap: 2 },
});
