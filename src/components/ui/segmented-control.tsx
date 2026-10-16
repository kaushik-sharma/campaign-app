import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { haptics } from '@/lib/haptics';
import { radius, space, spring, useTheme } from '@/theme';

import { Text } from './text';

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
};

/** Segmented control with a thumb that springs between options on the UI thread. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  const { colors, shadow } = useTheme();
  const index = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const segmentWidth = useSharedValue(0);
  const position = useSharedValue(index);

  useEffect(() => {
    position.set(withSpring(index, spring.snappy));
  }, [index, position]);

  const thumbStyle = useAnimatedStyle(() => ({
    width: segmentWidth.get(),
    transform: [{ translateX: position.get() * segmentWidth.get() }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(e) => segmentWidth.set((e.nativeEvent.layout.width - 4) / options.length)}
      style={[styles.track, { backgroundColor: colors.surfaceSunken }]}>
      <Animated.View
        style={[
          styles.thumb,
          { backgroundColor: colors.surface, boxShadow: shadow('e1'), borderColor: colors.border },
          thumbStyle,
        ]}
      />
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            onPress={() => {
              if (selected) return;
              haptics.selection();
              onChange(option.value);
            }}
            style={styles.segment}>
            <Text
              variant="subhead"
              color={selected ? 'text' : 'textMuted'}
              numberOfLines={1}
              maxFontSizeMultiplier={1.3}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: 2,
    borderRadius: radius.md,
    height: 40,
  },
  thumb: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    left: 2,
    borderRadius: radius.md - 2,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xs,
  },
});
